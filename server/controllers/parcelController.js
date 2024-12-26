import { Parcel } from '../models/Parcel.js';
import { ChatRoom } from '../models/ChatRoom.js';
import User from '../models/User.js';
import { io, getSocketIdByUser } from '../server.js';

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
    }).lean();

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
    const { title, reward } = req.body;

    const newDelivery = new Parcel({
      title: title || 'Delivery Request',
      dropoffLocation: req.user.hostelcode || 'Dorm Lobby',
      reward: reward || 5,
      requester: req.user._id,
    });

    await newDelivery.save();

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
    const delivery = await Parcel.findById(req.params.id);
    if (!delivery || delivery.status !== 'open') {
      return res.status(404).json({ message: 'Delivery not found or not open' });
    }

    delivery.acceptor = req.user._id;
    delivery.status = 'in-progress';
    await delivery.save();

    const chatRoom = new ChatRoom({
      participants: [delivery.requester, req.user._id]
    });
    await chatRoom.save();

    
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
