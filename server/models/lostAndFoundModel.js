import mongoose from 'mongoose';

const lostAndFoundSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    whenFound: {
        type: Date,
        required: true,
        transform: (v) => new Date(v)
    },
    whenFoundTime: {
        type: String,
        required: true,
    },
    whereFound: {
        type: String,
        required: true,
    },
    whereToFind: {
        type: String,
        required: true,
    },
    tags: [{
        type: String
    }],
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'lostandfounds'
});

export default mongoose.model('LostAndFound', lostAndFoundSchema);