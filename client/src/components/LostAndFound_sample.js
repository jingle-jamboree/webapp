import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, ChevronDownIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

// Comment out API_BASE_URL as we're using sample data
// const API_BASE_URL = process.env.REACT_BACKEND_API_URL;

const SAMPLE_ITEMS = [
    {
        _id: 1,
        name: 'Black Wallet',
        whereFound: 'Near Library',
        whereToFind: 'Library Reception',
        whenFound: '2024-03-15',
        whenFoundTime: '10:30',
        createdAt: '2024-03-15T10:30:00',
        tags: ['wallet', 'leather', 'black']
    },
    {
        _id: 2,
        name: 'USB Drive',
        whereFound: 'LT-3',
        whereToFind: 'CSE Department',
        whenFound: '2024-03-14',
        whenFoundTime: '15:20',
        createdAt: '2024-03-14T15:20:00',
        tags: ['usb', 'drive', 'storage']
    },
    {
        _id: 3,
        name: 'Student ID Card',
        whereFound: 'Canteen',
        whereToFind: 'Security Office',
        whenFound: '2024-03-13',
        whenFoundTime: '09:45',
        createdAt: '2024-03-13T09:45:00',
        tags: ['id', 'card', 'student']
    }
];

// Helper function to generate sample items
const generateSampleItems = (startId, count = 3) => {
    const items = [];
    const locations = ['Library', 'Canteen', 'LT-3', 'CSE Lab', 'Sports Complex', 'Hostel Block'];
    const itemTypes = ['Wallet', 'Phone', 'ID Card', 'USB Drive', 'Water Bottle', 'Notebook'];
    const colors = ['Black', 'Blue', 'Red', 'Grey', 'White'];

    for (let i = 0; i < count; i++) {
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];

        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Random date within last week

        items.push({
            _id: startId + i,
            name: `${color} ${itemType}`,
            whereFound: `Near ${location}`,
            whereToFind: `${location} Reception`,
            whenFound: date.toISOString().split('T')[0],
            whenFoundTime: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            createdAt: date.toISOString(),
            tags: [itemType.toLowerCase(), color.toLowerCase(), location.toLowerCase()]
        });
    }
    return items;
};

const LostAndFound = () => {
    const [items, setItems] = useState(SAMPLE_ITEMS);
    const [isLoading, setIsLoading] = useState(false); // Changed to false for sample data
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        whereFound: '',
        whereToFind: '',
        whenFound: '',
        whenFoundTime: ''
    });
    const [isCompact, setIsCompact] = useState(false);
    const headerRef = useRef(null);
    const headerContentRef = useRef(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState({
        name: '',
        location: '',
        date: '',
        tags: ''
    });
    const [isButtonVisible, setIsButtonVisible] = useState(true);
    const lastScrollY = useRef(0);
    const [isClosing, setIsClosing] = useState(false);
    const [isButtonCompact, setIsButtonCompact] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [lastItemId, setLastItemId] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const itemsContainerRef = useRef(null);
    const [itemCount, setItemCount] = useState(0);

    // Comment out the fetch effect since we're using sample data
    /*useEffect(() => {
        fetchItems();
    }, []);*/

    /*const fetchItems = async () => {
        try {
            const response = await fetch('/api/lost-and-found/items');
            if (!response.ok) throw new Error('Failed to fetch items');
            const data = await response.json();
            setItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };*/

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isClosing) return;

        try {
            // Demo implementation
            const newItem = {
                _id: Date.now(),
                ...formData,
                createdAt: new Date().toISOString(),
                tags: ['demo', 'new-item']
            };
            setItems(prev => [newItem, ...prev]);
            handleCloseModal();
            setFormData({
                name: '',
                whereFound: '',
                whereToFind: '',
                whenFound: '',
                whenFoundTime: ''
            });
        } catch (err) {
            setError('Failed to post item');
        }
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchQuery(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredItems = items.filter(item => {
        const matchName = item.name.toLowerCase().includes(searchQuery.name.toLowerCase());
        const matchLocation = !searchQuery.location || item.whereFound.toLowerCase().includes(searchQuery.location.toLowerCase());
        const matchDate = !searchQuery.date || item.whenFound === searchQuery.date;
        const matchTags = !searchQuery.tags || (
            item.tags && item.tags.some(tag =>
                tag.toLowerCase().includes(searchQuery.tags.toLowerCase())
            )
        );
        return matchName && matchLocation && matchDate && matchTags;
    });

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

    // Add scroll handler for FAB
    useEffect(() => {
        const handleScroll = () => {
            setIsButtonCompact(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsFormVisible(false);
            setIsClosing(false);
        }, 200); // Match animation duration
    };

    // Custom date/time input wrappers
    const CustomDateInput = ({ value, onChange, name, ...props }) => (
        <div className="relative">
            <input
                type="date"
                name={name}
                value={value}
                onChange={onChange}
                className="input-field mb-0 appearance-none pl-10"
                {...props}
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
    );

    const CustomTimeInput = ({ value, onChange, name, ...props }) => (
        <div className="relative">
            <input
                type="time"
                name={name}
                value={value}
                onChange={onChange}
                className="input-field mb-0 appearance-none pl-10"
                {...props}
            />
            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
    );

    const headerClasses = `fixed top-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out
        border-b border-white/5 backdrop-blur-sm
        ${isCompact ? 'py-4 bg-[#0B0F1A]/80 border-opacity-100' : 'py-12 bg-transparent border-opacity-0'}`;

    const titleClasses = `font-bold text-center gradient-text transition-all duration-500 ease-in-out
        ${isCompact ? 'text-2xl' : 'text-4xl'}`;

    useEffect(() => {
        fetchInitialItems();
    }, []);

    const fetchInitialItems = async () => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const initialItems = generateSampleItems(1, 6); // Start with 6 items
            setItems(initialItems);
            setLastItemId(initialItems[initialItems.length - 1]._id);
            setItemCount(6);
            setHasMore(true);
        } catch (err) {
            setError('Failed to fetch items');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMoreItems = async () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const nextId = lastItemId + 1;
            const moreItems = generateSampleItems(nextId, 6);

            setItems(prev => [...prev, ...moreItems]);
            setLastItemId(moreItems[moreItems.length - 1]._id);
            setItemCount(prev => prev + 6);

            // Stop after 24 items total
            setHasMore(itemCount < 18);
        } catch (err) {
            setError('Failed to fetch more items');
        } finally {
            setIsFetchingMore(false);
        }
    };

    // Add intersection observer for infinite scroll
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '100px', // Increased margin to trigger earlier
            threshold: 0.1 // Lower threshold to trigger more reliably
        };

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !isFetchingMore && hasMore) {
                fetchMoreItems();
            }
        }, options);

        const container = itemsContainerRef.current;
        if (container) {
            observer.observe(container);
        }

        return () => {
            if (container) {
                observer.unobserve(container);
            }
        };
    }, [isFetchingMore, hasMore, itemCount]); // Add itemCount as dependency

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
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Search Section */}
                    <div className="card">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-blue-300">
                                    Search Items
                                </h3>
                                <button
                                    onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <motion.div
                                        animate={{ rotate: isSearchExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDownIcon className="h-5 w-5" />
                                    </motion.div>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    name="name"
                                    value={searchQuery.name}
                                    onChange={handleSearchChange}
                                    placeholder="Search by item name"
                                    className="input-field mb-0"
                                />

                                <motion.div
                                    animate={{
                                        height: isSearchExpanded ? 'auto' : 0,
                                        opacity: isSearchExpanded ? 1 : 0
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-4 pt-2">
                                        <input
                                            type="text"
                                            name="location"
                                            value={searchQuery.location}
                                            onChange={handleSearchChange}
                                            placeholder="Search by location"
                                            className="input-field mb-0"
                                        />
                                        <div className="relative">
                                            <CustomDateInput
                                                name="date"
                                                value={searchQuery.date}
                                                onChange={handleSearchChange}
                                                min="2024-01-01"
                                                max="2025-12-31"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={searchQuery.tags}
                                            onChange={handleSearchChange}
                                            placeholder="Search by tags (e.g., wallet, black)"
                                            className="input-field mb-0"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-6 text-blue-300">
                            Recent Found Items
                        </h3>

                        {isLoading ? (
                            <div className="text-center py-8 text-gray-400">Loading...</div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {filteredItems.map((item) => (
                                        <div key={item._id} className="bg-gray-700 rounded-lg p-4 transition duration-300">
                                            <h4 className="text-lg font-medium mb-2">{item.name}</h4>
                                            <div className="space-y-2 text-gray-300">
                                                <p>Found at: {item.whereFound}</p>
                                                <p>Collect from: {item.whereToFind}</p>
                                                <p>Found on: {new Date(item.whenFound).toLocaleDateString()} at {item.whenFoundTime}</p>
                                                <p className="text-sm text-gray-400">
                                                    Posted: {new Date(item.createdAt).toLocaleString()}
                                                </p>
                                                {item.tags && item.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {item.tags.map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-3 py-1.5 bg-gray-800/50 rounded-full text-xs text-gray-300
                                                                    border border-gray-700/50 transition-colors"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Loading indicator */}
                                <div ref={itemsContainerRef} className="py-4 text-center">
                                    {isFetchingMore ? (
                                        <div className="text-gray-400">Loading more items...</div>
                                    ) : !hasMore && (
                                        <div className="text-gray-500">All items listed</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Floating Action Button */}
                    <motion.div
                        className="fixed bottom-6 right-6 z-50"
                        initial={false}
                    >
                        <motion.button
                            onClick={() => setIsFormVisible(true)}
                            className="bg-gradient-to-r from-orange-700 to-amber-700 floating-action-button
                                text-white font-semibold rounded-full shadow-lg
                                transition-colors duration-500
                                flex items-center gap-3 overflow-hidden"
                            animate={{
                                width: isButtonCompact ? 56 : 200,
                                transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                            }}
                            style={{ height: 56 }}
                        >
                            <div className="flex items-center h-full pl-4">
                                <PlusIcon className="h-6 w-6 flex-shrink-0" />
                            </div>
                            <motion.div
                                className="flex-1 pr-5 whitespace-nowrap"
                                animate={{
                                    x: isButtonCompact ? -50 : 0,
                                    opacity: isButtonCompact ? 0 : 1,
                                }}
                                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            >
                                Report Found Item
                            </motion.div>
                        </motion.button>
                    </motion.div>

                    {/* Modal Form */}
                    {isFormVisible && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4
                            transition-opacity duration-200"
                            onClick={handleCloseModal}
                        >
                            <div
                                className={`bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl
                                    border border-white/10 transition-all duration-200
                                    ${isClosing ? 'animate-slide-up' : 'animate-slide-down'}`}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold text-blue-300">
                                        Report Found Item
                                    </h3>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-gray-400 hover:text-white transition-colors text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                                    <input
                                        type="text"
                                        name="name"
                                        autoComplete="off"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Item name"
                                        className="input-field"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="whereFound"
                                        autoComplete="off"
                                        value={formData.whereFound}
                                        onChange={handleInputChange}
                                        placeholder="Where was it found?"
                                        className="input-field"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="whereToFind"
                                        autoComplete="off"
                                        value={formData.whereToFind}
                                        onChange={handleInputChange}
                                        placeholder="Where can it be collected from?"
                                        className="input-field"
                                        required
                                    />
                                    {/* Update grid columns distribution */}
                                    <div className="grid grid-cols-[1.3fr_1fr] gap-4">
                                        <CustomDateInput
                                            name="whenFound"
                                            value={formData.whenFound}
                                            onChange={handleInputChange}
                                            min="2024-01-01"
                                            max="2025-12-31"
                                            required
                                        />
                                        <CustomTimeInput
                                            name="whenFoundTime"
                                            value={formData.whenFoundTime}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn-primary w-full">
                                        Post Found Item
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LostAndFound;