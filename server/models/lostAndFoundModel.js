const mongoose = require('mongoose');

const lostAndFoundSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    contactInfo: {
        type: String,
        required: true,
    },
    dateFound: {
        type: Date,
        default: Date.now,
    },
    location: {
        type: String,
        required: true,
    },
});

const LostAndFound = mongoose.model('LostAndFound', lostAndFoundSchema);

module.exports = LostAndFound;