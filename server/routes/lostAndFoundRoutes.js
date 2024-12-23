const express = require('express');
const router = express.Router();
const lostAndFoundController = require('../controllers/lostAndFoundController');

// Sample data for lost and found items
let sampleData = [
    { id: 1, item: 'Lost Wallet', description: 'Black leather wallet with ID and cards', contact: 'user1@example.com' },
    { id: 2, item: 'Found Keys', description: 'Set of keys with a blue keychain', contact: 'user2@example.com' },
    { id: 3, item: 'Lost Phone', description: 'iPhone 12, black color', contact: 'user3@example.com' },
    { id: 4, item: 'Found Glasses', description: 'Round glasses with a black frame', contact: 'user4@example.com' }
];

// Route to get all lost and found items
router.get('/', (req, res) => {
    res.json(sampleData);
});

// Route to post a new found item
router.post('/', (req, res) => {
    const newItem = {
        id: sampleData.length + 1,
        item: req.body.item,
        description: req.body.description,
        contact: req.body.contact
    };
    sampleData.push(newItem);
    res.status(201).json(newItem);
});

module.exports = router;