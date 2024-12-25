import mongoose from 'mongoose';

const lostItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    whereFound: { type: String, required: true },
    whereToFind: { type: String, required: true },
    whenFound: { type: String, required: true },
    whenFoundTime: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

lostItemSchema.index({
    name: 'text',
    whereFound: 'text',
    whereToFind: 'text',
    tags: 'text'
});

export const LostItem = mongoose.model('LostItem', lostItemSchema);
