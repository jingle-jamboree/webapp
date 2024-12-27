import mongoose from 'mongoose';

const parcelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'canceled'],
    default: 'open'
  },
  reward: { type: Number, required: true, min: 1 },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: false  // Make it optional since it's added after creation
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  description: String,
}, { timestamps: true });

export const Parcel = mongoose.model('Parcel', parcelSchema);
