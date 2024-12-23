import React, { useState } from 'react';

const LostAndFound = () => {
    const [foundItems, setFoundItems] = useState([
        { id: 1, description: 'Lost wallet near the park', contact: 'user1@example.com' },
        { id: 2, description: 'Found keys in the library', contact: 'user2@example.com' },
    ]);
    const [newItem, setNewItem] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newItem) {
            const newFoundItem = {
                id: foundItems.length + 1,
                description: newItem,
                contact: 'user@example.com', // Placeholder contact
            };
            setFoundItems([...foundItems, newFoundItem]);
            setNewItem('');
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Lost and Found</h2>
            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Describe the found item"
                    className="border p-2 w-full mb-2"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 w-full">
                    Post Found Item
                </button>
            </form>
            <h3 className="text-lg font-semibold mb-2">Found Items:</h3>
            <ul>
                {foundItems.map((item) => (
                    <li key={item.id} className="border p-2 mb-2">
                        <p>{item.description}</p>
                        <p>Contact: {item.contact}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LostAndFound;