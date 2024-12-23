import React, { useState } from 'react';

const initialItems = [
  { id: 1, title: "Blue Wallet", location: "Library", contact: "john@email.com" },
  { id: 2, title: "House Keys", location: "Cafeteria", contact: "jane@email.com" }
];

export default function LostAndFound() {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState({ title: "", location: "", contact: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.location || !newItem.contact) return;
    setItems([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ title: "", location: "", contact: "" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Lost and Found Items</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Item name"
          value={newItem.title}
          onChange={(e) => setNewItem({...newItem, title: e.target.value})}
        />
        <input
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Location found"
          value={newItem.location}
          onChange={(e) => setNewItem({...newItem, location: e.target.value})}
        />
        <input
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Contact information"
          value={newItem.contact}
          onChange={(e) => setNewItem({...newItem, contact: e.target.value})}
        />
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add Item
        </button>
      </form>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-bold text-lg">{item.title}</h3>
            <p className="text-gray-600">Location: {item.location}</p>
            <p className="text-gray-600">Contact: {item.contact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}