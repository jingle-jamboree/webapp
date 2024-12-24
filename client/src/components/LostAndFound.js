import React, { useState, useEffect, useRef } from 'react';

const SAMPLE_ITEMS = [
    { id: 1, description: 'Lost wallet near the park', contact: 'user1@example.com', date: '2024-01-15' },
    { id: 2, description: 'Found keys in the library', contact: 'user2@example.com', date: '2024-01-14' },
    { id: 3, description: 'Lost laptop charger in LT-3', contact: 'user3@example.com', date: '2024-01-13' },
    { id: 4, description: 'Found student ID card near canteen', contact: 'user4@example.com', date: '2024-01-12' },
    { id: 5, description: 'Lost black backpack in lab', contact: 'user5@example.com', date: '2024-01-11' },
    { id: 6, description: 'Found water bottle at basketball court', contact: 'user6@example.com', date: '2024-01-10' },
    { id: 7, description: 'Lost calculator during exam', contact: 'user7@example.com', date: '2024-01-09' },
    { id: 8, description: 'Found glasses in classroom', contact: 'user8@example.com', date: '2024-01-08' }
];

const LostAndFound = () => {
    const [foundItems, setFoundItems] = useState(SAMPLE_ITEMS);
    const [newItem, setNewItem] = useState('');
    const [isCompact, setIsCompact] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const headerRef = useRef(null);
    const inputRef = useRef(null);
    const headerContentRef = useRef(null);

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

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Trigger before reaching the header
                if (window.scrollY > 20) {
                    setIsCompact(!entry.isIntersecting);
                }
            },
            {
                threshold: 1,
                rootMargin: '-20px 0px 0px 0px'
            }
        );

        const headerElement = headerRef.current;
        if (headerElement) {
            observer.observe(headerElement);
        }

        // Add scroll listener for initial scroll position
        const handleScroll = () => {
            setIsCompact(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            if (headerElement) {
                observer.unobserve(headerElement);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const headerClasses = `fixed top-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out
        border-b  border-white/5 backdrop-blur-sm
        ${isCompact || isFocused
            ? 'py-4 bg-[#0B0F1A]/80 border-opacity-100'
            : 'py-12 bg-transparent border-opacity-0'}`;

    const titleClasses = `font-bold text-center gradient-text transition-all duration-500 ease-in-out
        ${isCompact || isFocused ? 'text-2xl' : 'text-4xl'}`;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Grid layout to maintain spacing */}
            <div className="grid grid-rows-[auto_1fr]">
                {/* Header spacer that maintains expanded size */}
                <div className="py-12">
                    <div className="h-[3.75rem]" /> {/* Matches text-5xl height */}
                </div>

                {/* Fixed header that overlays */}
                <div className={headerClasses}>
                    <div ref={headerContentRef} className="container mx-auto px-4">
                        <h2 ref={headerRef} className={titleClasses}>
                            Lost and Found
                        </h2>
                    </div>
                </div>

                {/* Content section */}
                <div className="px-4 space-y-8">
                    <div className="card mb-8">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="text-xl font-semibold mb-4 text-blue-300">
                                Report Found Item
                            </h3>
                            <input
                                ref={inputRef}
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Describe the found item"
                                className="input-field"
                            />
                            <button type="submit" className="btn-primary w-full">
                                Post Found Item
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <h3 className="text-xl font-semibold mb-6 text-blue-300">Recent Found Items</h3>
                        <div className="space-y-4">
                            {foundItems.map((item) => (
                                <div key={item.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition duration-300">
                                    <p className="text-lg mb-2">{item.description}</p>
                                    <div className="flex justify-between items-center text-sm text-gray-400">
                                        <p>Contact: <span className="text-blue-400">{item.contact}</span></p>
                                        <p>Posted: {item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LostAndFound;