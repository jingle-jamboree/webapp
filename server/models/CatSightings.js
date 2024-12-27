// models/CatSighting.js
import mongoose from 'mongoose';

/**
 * We'll store location as a GeoJSON "Point" with [longitude, latitude].
 * reportedBy references the user's _id from your existing User model.
 */
const catSightingSchema = new mongoose.Schema({
  catName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, 
{
  timestamps: true // automatically adds createdAt, updatedAt
});

catSightingSchema.index({ location: '2dsphere' });

export default mongoose.model('CatSighting', catSightingSchema);
