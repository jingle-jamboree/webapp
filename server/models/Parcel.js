import mongoose from 'mongoose';

const parcelSchema = new mongoose.Schema({
  title: { type: String, default: 'Delivery Request' },
  dropoffLocation: { type: String, default: 'N/A' },
  reward: { type: Number, default: 0 },

  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'completed', 'canceled'], 
    default: 'open' 
  },

  createdAt: { type: Date, default: Date.now },
});

export const Parcel = mongoose.model('Parcel', parcelSchema);
