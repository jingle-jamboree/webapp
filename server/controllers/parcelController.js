import { Parcel } from '../models/Parcel.js';
import { ChatRoom } from '../models/ChatRoom.js';
import User from '../models/User.js';
import { io, getSocketIdByUser, emitParcelUpdate } from '../server.js';
import mongoose from 'mongoose';

/**
 * GET /api/parcel/credits
 * Return current user credits
 */
export const getUserCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ credits: user.credits });
  } catch (err) {
    console.error('getUserCredits error:', err);
    res.status(500).json({ message: 'Failed to get credits' });
  }
};

/**
 * GET /api/parcel/deliveries
 * Return all open deliveries (except user's own)
 */
export const getOpenDeliveries = async (req, res) => {
  try {
    const deliveries = await Parcel.find({
      status: 'open',
      requester: { $ne: req.user._id }
    })
      .populate('requester', 'name enroll hostelcode')  // Add this line
      .lean();

    res.json({ deliveries });
  } catch (err) {
    console.error('getOpenDeliveries error:', err);
    res.status(500).json({ message: 'Failed to fetch deliveries' });
  }
};

/**
 * POST /api/parcel/deliveries
 * Request a new parcel delivery
 */
export const requestDelivery = async (req, res) => {
  try {
    // Check if user already has an open or in-progress delivery request
    const existingRequest = await Parcel.findOne({
      requester: req.user._id,
      status: { $in: ['open', 'in-progress'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'You already have an active delivery request'
      });
    }

    const { title, pickupLocation, dropoffLocation, reward } = req.body;

    // Validate required fields
    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        message: 'Pickup and drop-off locations are required'
      });
    }

    const newDelivery = new Parcel({
      title: title || 'Delivery Request',
      pickupLocation,
      dropoffLocation,
      reward: reward || 5,
      requester: req.user._id,
    });

    await newDelivery.save();

    // Broadcast new delivery to all connected users
    io.emit('NEW_DELIVERY', {
      type: 'NEW_DELIVERY',
      delivery: newDelivery
    });

    // Emit new delivery to all connected clients
    emitParcelUpdate('NEW_DELIVERY', newDelivery);

    res.status(201).json({ message: 'Delivery requested' });
  } catch (err) {
    console.error('requestDelivery error:', err);
    res.status(500).json({ message: 'Failed to request delivery' });
  }
};

/**
 * POST /api/parcel/deliveries/cancel
 * Cancel the user's open delivery
 */
export const cancelDelivery = async (req, res) => {
  try {
    // Find an open parcel for this user
    const delivery = await Parcel.findOne({
      requester: req.user._id,
      status: 'open'
    });

    if (!delivery) {
      return res.status(404).json({ message: 'No open delivery found' });
    }

    delivery.status = 'canceled';
    await delivery.save();

    emitParcelUpdate('DELIVERY_CANCELLED', {
      deliveryId: delivery._id
    });

    res.json({ message: 'Delivery canceled' });
  } catch (err) {
    console.error('cancelDelivery error:', err);
    res.status(500).json({ message: 'Failed to cancel delivery' });
  }
};

/**
 * POST /api/parcel/deliveries/:id/accept
 * Accept an open delivery
 */
export const acceptDelivery = async (req, res) => {
  try {
    // Check how many active deliveries user is currently handling
    const activeDeliveries = await Parcel.countDocuments({
      acceptor: req.user._id,
      status: 'in-progress'
    });

    if (activeDeliveries >= 5) {
      return res.status(400).json({
        message: 'You cannot accept more than 5 deliveries at once'
      });
    }

    const delivery = await Parcel.findById(req.params.id);
    if (!delivery || delivery.status !== 'open') {
      return res.status(404).json({ message: 'Delivery not found or not open' });
    }

    // Add check to prevent accepting own delivery
    if (delivery.requester.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot accept your own delivery' });
    }

    delivery.acceptor = req.user._id;
    delivery.status = 'in-progress';
    await delivery.save();

    const chatRoom = new ChatRoom({
      participants: [delivery.requester, req.user._id]
    });
    await chatRoom.save();

    // Add this line to link chatRoom to delivery
    delivery.chatRoomId = chatRoom._id;
    await delivery.save();

    const requester = await User.findById(delivery.requester);
    const requesterId = requester.enroll.toString();
    const acceptorId = req.user.enroll.toString();

    const payload = {
      type: 'DELIVERY_ACCEPTED',
      chatRoomId: chatRoom._id.toString(),
      requesterId,
      acceptorId
    };

    const requesterSocket = getSocketIdByUser(requesterId);
    if (requesterSocket) {
      io.to(requesterSocket).emit('DELIVERY_ACCEPTED', payload);
    }

    const acceptorSocket = getSocketIdByUser(acceptorId);
    if (acceptorSocket) {
      io.to(acceptorSocket).emit('DELIVERY_ACCEPTED', payload);
    }

    res.json({ message: 'Delivery accepted', chatRoomId: chatRoom._id });
  } catch (err) {
    console.error('acceptDelivery error:', err);
    res.status(500).json({ message: 'Failed to accept delivery' });
  }
};

/**
 * GET /api/parcel/deliveries/user
 * Get user's active and past deliveries
 */
export const getUserDeliveries = async (req, res) => {
  try {
    const deliveries = await Parcel.find({
      $or: [
        { requester: req.user._id },
        { acceptor: req.user._id }
      ]
    })
      .sort({ completedAt: -1, createdAt: -1 })
      .populate('requester', 'name phone hostelcode')
      .populate('acceptor', 'name phone hostelcode')
      .lean();

    // Add a field to indicate user's role in each delivery
    const enrichedDeliveries = deliveries.map(delivery => ({
      ...delivery,
      userRole: delivery.requester._id.toString() === req.user._id.toString()
        ? 'requester'
        : 'acceptor'
    }));

    res.json({ deliveries: enrichedDeliveries });
  } catch (err) {
    console.error('getUserDeliveries error:', err);
    res.status(500).json({ message: 'Failed to fetch user deliveries' });
  }
};

/**
 * GET /api/parcel/deliveries/:id/chat
 * Get chat room for a delivery
 */
export const getChatRoom = async (req, res) => {
  try {
    const delivery = await Parcel.findById(req.params.id)
      .populate('chatRoomId')
      .lean();

    if (!delivery || !delivery.chatRoomId) {
      return res.status(404).json({ message: 'Chat room not found for this delivery' });
    }

    // Check if user is participant
    if (delivery.requester.toString() !== req.user._id.toString() &&
      delivery.acceptor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ chatRoom: delivery.chatRoomId });
  } catch (err) {
    console.error('getChatRoom error:', err);
    res.status(500).json({ message: 'Failed to fetch chat room' });
  }
};

/**
 * POST /api/parcel/deliveries/:id/complete
 * Mark delivery as complete and transfer credits
 */
export const completeDelivery = async (req, res) => {
  try {
    const delivery = await Parcel.findById(req.params.id);

    if (!delivery || delivery.status !== 'in-progress') {
      return res.status(404).json({ message: 'Delivery not found or not in progress' });
    }

    // Verify user is requester
    if (delivery.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only requester can complete delivery' });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update delivery status
      delivery.status = 'completed';
      delivery.completedAt = new Date();
      await delivery.save({ session });

      // Transfer credits
      const requester = await User.findById(delivery.requester);
      const acceptor = await User.findById(delivery.acceptor);

      requester.credits -= delivery.reward;
      acceptor.credits += delivery.reward;

      await requester.save({ session });
      await acceptor.save({ session });

      await session.commitTransaction();

      // After successful transaction, emit to both parties
      const payload = {
        type: 'DELIVERY_COMPLETED',
        deliveryId: delivery._id.toString(),
        requesterId: requester.enroll.toString(),
        acceptorId: acceptor.enroll.toString()
      };

      // Notify both parties
      const requesterSocket = getSocketIdByUser(requester.enroll.toString());
      const acceptorSocket = getSocketIdByUser(acceptor.enroll.toString());

      if (requesterSocket) {
        io.to(requesterSocket).emit('DELIVERY_STATUS_CHANGED', payload);
      }
      if (acceptorSocket) {
        io.to(acceptorSocket).emit('DELIVERY_STATUS_CHANGED', payload);
      }

      emitParcelUpdate('DELIVERY_COMPLETED', {
        deliveryId: delivery._id,
        completedAt: delivery.completedAt
      });

      res.json({ message: 'Delivery completed successfully' });
    } catch (err) {
      await session.abortTransaction();
      console.error('completeDelivery transaction error:', err);
      res.status(500).json({ message: 'Failed to complete delivery' });
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('completeDelivery error:', err);
    res.status(500).json({ message: 'Failed to complete delivery' });
  }
};

/**
 * GET /api/parcel/deliveries/chat/:chatRoomId/messages
 * Get chat history for a delivery
 */
export const getChatMessages = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.chatRoomId)
      .populate('messages.sender', 'enroll name');

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Verify user is a participant
    if (!chatRoom.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Format messages for client
    const messages = chatRoom.messages.map(msg => ({
      sender: msg.sender.enroll,
      senderName: msg.sender.name,
      text: msg.text,
      timestamp: msg.createdAt
    }));

    res.json({ messages });
  } catch (err) {
    console.error('getChatMessages error:', err);
    res.status(500).json({ message: 'Failed to fetch chat messages' });
  }
};
