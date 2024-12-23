exports.sampleData = [
    { id: 1, item: "Lost Wallet", contact: "user1@example.com" },
    { id: 2, item: "Found Keys", contact: "user2@example.com" },
    { id: 3, item: "Lost Phone", contact: "user3@example.com" },
    { id: 4, item: "Found Glasses", contact: "user4@example.com" }
];

exports.getLostAndFoundItems = (req, res) => {
    res.json(exports.sampleData);
};

exports.postFoundItem = (req, res) => {
    const newItem = {
        id: exports.sampleData.length + 1,
        item: req.body.item,
        contact: req.body.contact
    };
    exports.sampleData.push(newItem);
    res.status(201).json(newItem);
};