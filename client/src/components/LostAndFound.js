import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, ChevronDownIcon, CalendarIcon, ClockIcon, ArrowUpIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import TagInput from './TagInput';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_BACKEND_API_URL || 'http://localhost:5000';

const LostAndFound = () => {
    const { handleAuthError, isAuthError } = useAuth();
    // Get current date and time in required format
    const getCurrentDateTime = () => {
        const now = new Date();
        return {
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().slice(0, 5)
        };
    };

    // Add formatDate helper function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).replace(/,\s*\d{4}/, ''); // Remove year
    };

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        whenFound: getCurrentDateTime().date,
        whenFoundTime: getCurrentDateTime().time,
        whereFound: '',
        whereToFind: '',
        tags: []
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
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        fetchInitialItems();
    }, []);

    const fetchInitialItems = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/lost-and-found/items?limit=6`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                const error = await response.json();
                if (isAuthError(error)) {
                    handleAuthError();
                    return;
                }
                throw new Error(error.message || 'Failed to fetch items');
            }
            const data = await response.json();
            setItems(data.items || []);
            setLastItemId(data.lastId);
            setItemCount(data.count);
            setHasMore(data.hasMore);
        } catch (err) {
            if (isAuthError(err)) {
                handleAuthError();
                return;
            }
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMoreItems = async () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/lost-and-found/items?lastId=${lastItemId}&limit=6`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch more items');
            const data = await response.json();

            setItems(prev => [...prev, ...data.items]);
            setLastItemId(data.lastId);
            setItemCount(prev => prev + data.items.length);
            setHasMore(data.hasMore);
        } catch (err) {
            setError('Failed to fetch more items');
        } finally {
            setIsFetchingMore(false);
        }
    };

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
            const token = localStorage.getItem('token');
            if (!token) {
                handleAuthError();
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/lost-and-found/items`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                if (isAuthError(error)) {
                    handleAuthError();
                    return;
                }
                throw new Error(error.message || 'Failed to post item');
            }

            const newItem = await response.json();
            setItems(prev => [newItem, ...prev]);
            handleCloseModal();
            setFormData({
                name: '',
                whenFound: getCurrentDateTime().date,
                whenFoundTime: getCurrentDateTime().time,
                whereFound: '',
                whereToFind: '',
                tags: []
            });
        } catch (err) {
            if (isAuthError(err)) {
                handleAuthError();
                return;
            }
            setError(err.message);
            console.error('Submit error:', err);
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

    // Add scroll handler for FAB and scroll-to-top button
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500);
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
        }, 200);
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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

    // Add intersection observer for infinite scroll
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
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
    }, [isFetchingMore, hasMore, itemCount]);

    return (
        <div className="max-w-4xl mx-auto pb-5">
            {/* Grid layout to maintain spacing */}
            <div className="grid grid-rows-[auto_1fr]">
                {/* Header spacer that maintains expanded size */}
                <div className="py-12"></div>
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
                                    initial={false} // Add this line
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
                                initial={false} // Add this line
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
                                        <h4 className="text-lg font-medium mb-2 truncate max-w-full" title={item.name}>
                                            {item.name}
                                        </h4>
                                        <div className="space-y-2 text-gray-300">
                                            <p>Found at: {item.whereFound}</p>
                                            <p>Collect from: {item.whereToFind}</p>
                                            <p>Found on: {new Date(item.whenFound).toLocaleDateString()} at {item.whenFoundTime}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span className="truncate">Posted by: {item.reportedBy?.name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span className="whitespace-nowrap">{formatDate(item.createdAt)}</span>
                                            </div>
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
                            <div ref={itemsContainerRef} className="pt-5 text-center">
                                {isFetchingMore ? (
                                    <div className="text-gray-400">Loading more items...</div>
                                ) : !hasMore && (
                                    <div className="text-gray-500">No More Items</div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Floating Action Button */}
                <motion.div
                    className="fixed bottom-6 right-6 z-50 space-y-4"
                    initial={false}
                >
                    {/* Scroll to Top Button */}
                    <motion.button
                        onClick={scrollToTop}
                        className="bg-gray-800 hover:bg-gray-700 h-14 w-14 rounded-full shadow-lg
                            flex items-center justify-center transition-all duration-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: showScrollTop ? 1 : 0,
                            y: showScrollTop ? 0 : 20,
                            pointerEvents: showScrollTop ? 'auto' : 'none'
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <ArrowUpIcon className="h-6 w-6 text-gray-300" />
                    </motion.button>

                    {/* Existing FAB */}
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

                            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                                {/* When section */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">When was it found?</label>
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
                                </div>

                                {/* Item details section */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">Item Details</label>
                                    <input
                                        type="text"
                                        name="name"
                                        autoComplete="off"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="What was found? (e.g., Black Wallet)"
                                        className="input-field"
                                        required
                                    />
                                    <TagInput
                                        tags={formData.tags}
                                        setTags={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
                                        placeholder="Add descriptive tags (e.g. leather, cards)"
                                    />
                                </div>

                                {/* Location section */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">Location Information</label>
                                    <input
                                        type="text"
                                        name="whereFound"
                                        autoComplete="off"
                                        value={formData.whereFound}
                                        onChange={handleInputChange}
                                        placeholder="Where was it found? (e.g., Near Library)"
                                        className="input-field"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="whereToFind"
                                        autoComplete="off"
                                        value={formData.whereToFind}
                                        onChange={handleInputChange}
                                        placeholder="Where to collect? (e.g., Library Reception)"
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn-primary w-full mt-6">
                                    Post Found Item
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
};

export default LostAndFound;