import React, { useState, useEffect, useRef, memo } from 'react';
import { PlusIcon, ChevronDownIcon, CalendarIcon, ClockIcon, ArrowUpIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 20,
        transition: { duration: 0.2 }
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1]
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.2 }
    }
};

const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

// Update the TagList component
const TagList = ({ tags, maxVisible = 3, expandable = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleTags = isExpanded ? tags : tags.slice(0, maxVisible);
    const remainingCount = tags.length - maxVisible;
    const hasMore = remainingCount > 0;

    return (
        <motion.div layout className="flex flex-wrap items-center gap-2">
            <AnimatePresence mode="popLayout">
                {visibleTags.map((tag, index) => (
                    <motion.span
                        key={tag}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-3 py-1.5 bg-gray-800/50 rounded-full text-xs text-gray-300
                                border border-gray-700/50 transition-colors whitespace-nowrap"
                    >
                        {tag}
                    </motion.span>
                ))}
            </AnimatePresence>
            {hasMore && expandable && (
                <motion.button
                    layout
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1.5 bg-gray-800/30 rounded-full text-xs text-gray-400
                            hover:bg-gray-700/50 transition-colors"
                >
                    {isExpanded ? 'Show less' : `+${remainingCount} more`}
                </motion.button>
            )}
            {hasMore && !expandable && (
                <motion.span
                    layout
                    className="text-xs text-gray-400"
                >
                    +{remainingCount} more
                </motion.span>
            )}
        </motion.div>
    );
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

// Add ItemCard component outside main component for memoization
const ItemCard = memo(({ item, onClick }) => {
    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className="bg-gray-700 rounded-lg p-4 transition-colors duration-300
                hover:bg-gray-600/50 cursor-pointer"
            onClick={() => onClick(item)}
        >
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
                    <div className="mt-2">
                        <TagList tags={item.tags} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    return prevProps.item._id === nextProps.item._id;
});

const LostAndFound = () => {
    const { handleAuthError, isAuthError, user } = useAuth();
    // Get current date and time in required format
    const getCurrentDateTime = () => {
        const now = new Date();
        return {
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().slice(0, 5)
        };
    };

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        whenFound: getCurrentDateTime().date,
        whenFoundTime: getCurrentDateTime().time,
        description: '', // Changed from 'name' to 'description'
        whereFound: '',
        whereToFind: ''
    });
    const [isCompact, setIsCompact] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState({
        query: '',
        date: ''
    });
    const [isClosing, setIsClosing] = useState(false);
    const [isButtonCompact, setIsButtonCompact] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [lastItemId, setLastItemId] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const itemsContainerRef = useRef(null);
    const [itemCount, setItemCount] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const MAX_DESCRIPTION_LENGTH = 300; // Add this constant
    const MAX_LOCATION_LENGTH = 150; // Add this constant

    const [includePhone, setIncludePhone] = useState(true);  // Add this state

    // Update CharacterCount styles for label alignment
    const CharacterCount = ({ current, max }) => (
        <span className={`text-xs transition-colors duration-200 ${current > max * 0.9
            ? current >= max
                ? 'text-red-400'
                : 'text-amber-400'
            : 'text-gray-500'
            }`}>
            {current}/{max}
        </span>
    );

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
        // Add length checks for each field
        if (
            (name === 'description' && value.length > MAX_DESCRIPTION_LENGTH) ||
            ((name === 'whereFound' || name === 'whereToFind') && value.length > MAX_LOCATION_LENGTH)
        ) {
            return;
        }
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

            const dataToSend = {
                ...formData,
                includePhone: includePhone  // Add this to the form data
            };

            const response = await fetch(`${API_BASE_URL}/api/lost-and-found/items`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(dataToSend),
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
                whenFound: getCurrentDateTime().date,
                whenFoundTime: getCurrentDateTime().time,
                description: '', // Reset description instead of name
                whereFound: '',
                whereToFind: ''
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
        const searchTerms = searchQuery.query.toLowerCase().split(' ');
        const matchDate = !searchQuery.date || item.whenFound === searchQuery.date;

        return matchDate && searchTerms.every(term => (
            item.name.toLowerCase().includes(term) ||
            item.whereFound.toLowerCase().includes(term) ||
            item.whereToFind.toLowerCase().includes(term) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
        ));
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

        // Add scroll listener for initial scroll position
        const handleScroll = () => {
            setIsCompact(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
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
        <div className="relative" onClick={() => document.querySelector(`input[name="${name}"]`).showPicker()}>
            <input
                type="date"
                name={name}
                value={value}
                onChange={onChange}
                className="input-field input-field-required mb-0 appearance-none pl-10"
                {...props}
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
    );

    const CustomTimeInput = ({ value, onChange, name, ...props }) => (
        <div className="relative" onClick={() => document.querySelector(`input[name="${name}"]`).showPicker()}>
            <input
                type="time"
                name={name}
                value={value}
                onChange={onChange}
                className="input-field input-field-required mb-0 appearance-none pl-10"
                {...props}
            />
            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
    );

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

    // Consolidated animations
    const pageTransition = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
    };

    // Add page entry animation variants
    const pageVariants = {
        initial: {
            opacity: 0,
            y: 20
        },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        initial: {
            opacity: 0,
            y: 20
        },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1]
            }
        }
    };

    useEffect(() => {
        // Initial state after mount
        setIsCompact(window.scrollY > 20);

        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsCompact(scrollY > 20);
            setShowScrollTop(scrollY > 500);
            setIsButtonCompact(scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Add new function to handle item click
    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    // Add modal transition variants
    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 10,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 350
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 10,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className="max-w-4xl mx-auto pb-5"
        >
            {/* Simplified header with smoother transitions */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`fixed top-0 left-0 right-0 z-20 
                    transition-all duration-300 ease-out
                    border-b border-white/5 backdrop-blur-sm
                    ${isCompact ? 'py-4 bg-[#0B0F1A]/60' : 'py-8 bg-transparent'}`}
            >
                <h2 className={`font-bold text-center gradient-text 
                    transition-all duration-300 ease-out
                    ${isCompact ? 'text-2xl' : 'text-3xl'}`}>
                    Lost and Found
                </h2>
            </motion.div>

            {/* Adjust content spacing */}
            <div className={`transition-all duration-300 ease-out 
                ${isCompact ? 'pt-20' : 'pt-28'} px-4 space-y-8`}>
                {/* Search Card - Add animation */}
                <motion.div variants={itemVariants} className="card bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 
                    border border-white/10 shadow-xl">
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
                                name="query"
                                value={searchQuery.query}
                                onChange={handleSearchChange}
                                placeholder="Search items, locations, tags..."
                                className="input-field mb-0"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
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
                                    <div className="relative">
                                        <CustomDateInput
                                            name="date"
                                            value={searchQuery.date}
                                            onChange={handleSearchChange}
                                            min="2024-01-01"
                                            max="2025-12-31"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Items List Card - Add animation */}
                <motion.div variants={itemVariants} className="card bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 
                    border border-white/10 shadow-xl">
                    <h3 className="text-xl font-semibold mb-6 text-blue-300">
                        Recent Found Items
                    </h3>

                    {isLoading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-gray-400"
                        >
                            <div className="inline-flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                                />
                                Loading...
                            </div>
                        </motion.div>
                    ) : filteredItems.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-gray-400"
                        >
                            No items found
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={searchQuery.name + searchQuery.location + searchQuery.date + searchQuery.tags}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-4"
                            >
                                {filteredItems.map((item) => (
                                    <ItemCard
                                        key={item._id}
                                        item={item}
                                        onClick={handleItemClick}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </motion.div>
            </div>

            {/* Single FAB container for both buttons */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="fixed bottom-6 right-6 z-50 space-y-4"
            >
                <AnimatePresence>
                    {showScrollTop && (
                        <motion.button
                            onClick={scrollToTop}
                            className="bg-gray-800 h-14 w-14 rounded-full shadow-lg
                                flex items-center justify-center"
                            {...pageTransition}
                        >
                            <ArrowUpIcon className="h-6 w-6 text-gray-300" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Add Item FAB */}
                <motion.button
                    onClick={() => setIsFormVisible(true)}
                    className="bg-gradient-to-r from-orange-700 to-amber-700
                        text-white rounded-full shadow-lg h-14
                        flex items-center gap-3 overflow-hidden"
                    animate={{ width: isButtonCompact ? 56 : 200 }}
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

            {/* Modal */}
            <AnimatePresence>
                {isFormVisible && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 z-[100]"
                            onClick={handleCloseModal}
                            style={{ margin: 0 }}
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="w-full max-w-md pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={`bg-gray-800/95 backdrop-blur-sm rounded-xl w-full p-6 shadow-xl
                                    border border-white/10 transition-all duration-200
                                    ${isClosing ? 'animate-slide-up' : 'animate-slide-down'}`}
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

                                        {/* Item details section - Updated to textarea */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-sm font-medium text-gray-300">Item Description</label>
                                                <CharacterCount
                                                    current={formData.description.length}
                                                    max={MAX_DESCRIPTION_LENGTH}
                                                />
                                            </div>
                                            <textarea
                                                name="description"  // Changed from 'name' to 'description'
                                                value={formData.description}  // Changed from formData.name
                                                onChange={handleInputChange}
                                                placeholder="Describe the item in detail&#10;(e.g., Black leather wallet with HDFC cards, student ID, and some cash)"
                                                className="input-field input-field-required min-h-[120px] resize-none"
                                                required
                                                rows={4}
                                                maxLength={MAX_DESCRIPTION_LENGTH}
                                            />
                                        </div>

                                        {/* Location section */}
                                        <div className="space-y-2">
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <label className="block text-sm font-medium text-gray-300">Found Location</label>
                                                        <CharacterCount
                                                            current={formData.whereFound.length}
                                                            max={MAX_LOCATION_LENGTH}
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="whereFound"
                                                        autoComplete="off"
                                                        value={formData.whereFound}
                                                        onChange={handleInputChange}
                                                        placeholder="Where was it found? (Required)"
                                                        className="input-field input-field-required"
                                                        required
                                                        maxLength={MAX_LOCATION_LENGTH}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <label className="block text-sm font-medium text-gray-300">Collection Location</label>
                                                        <CharacterCount
                                                            current={formData.whereToFind.length}
                                                            max={MAX_LOCATION_LENGTH}
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="whereToFind"
                                                        autoComplete="off"
                                                        value={formData.whereToFind}
                                                        onChange={handleInputChange}
                                                        placeholder="Where to collect? (Required)"
                                                        className="input-field input-field-required"
                                                        required
                                                        maxLength={MAX_LOCATION_LENGTH}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {user?.phone && (
                                            <div className="flex items-center gap-3 pt-2">
                                                <input
                                                    type="checkbox"
                                                    id="includePhone"
                                                    checked={includePhone}
                                                    onChange={(e) => setIncludePhone(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-600 focus:ring-offset-gray-800"
                                                />
                                                <label htmlFor="includePhone" className="text-sm text-gray-300">
                                                    Include my contact number ({user.phone})
                                                </label>
                                            </div>
                                        )}

                                        <button type="submit" className="btn-primary w-full mt-6">
                                            Post Found Item
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Item Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <>
                        <motion.div
                            variants={overlayVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                            onClick={() => setSelectedItem(null)}
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 pointer-events-none">
                            <motion.div
                                variants={modalVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="w-full max-w-lg pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl 
                             border border-white/10 overflow-hidden">
                                    <div className="px-6 py-5 border-b border-white/10">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-semibold text-blue-300">
                                                Item Details
                                            </h3>
                                            <button
                                                onClick={() => setSelectedItem(null)}
                                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg -mr-2 -mt-2"
                                            >
                                                <span className="sr-only">Close</span>
                                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        <div className="px-6 py-4">
                                            <h4 className="text-lg font-medium text-white mb-3">
                                                {selectedItem.name}
                                            </h4>
                                            <div className="space-y-2">
                                                <label className="text-sm text-gray-400">Description</label>
                                                <p className="text-gray-100 text-base leading-relaxed whitespace-pre-wrap bg-white/5 rounded-lg p-3">
                                                    {selectedItem.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="px-6 py-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm text-gray-400">Found Location</label>
                                                    <p className="text-gray-200">{selectedItem.whereFound}</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm text-gray-400">Collection Location</label>
                                                    <p className="text-gray-200">{selectedItem.whereToFind}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm text-gray-400">Found Date & Time</label>
                                                    <p className="text-gray-200">
                                                        {new Date(selectedItem.whenFound).toLocaleDateString()} at {selectedItem.whenFoundTime}
                                                    </p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm text-gray-400">Posted By</label>
                                                    <div className="space-y-1">
                                                        <p className="text-gray-200">{selectedItem.reportedBy?.name || 'Unknown'}</p>
                                                        {selectedItem.reportedBy?.phone && (
                                                            <a className="text-sm text-gray-400" target='_blank' href={`https://wa.me/91${selectedItem.reportedBy.phone}`}>
                                                                Contact: {selectedItem.reportedBy.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedItem.tags && selectedItem.tags.length > 0 && (
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-sm text-gray-400">Tags</label>
                                                    <div className="bg-white/5 rounded-lg p-3">
                                                        <TagList tags={selectedItem.tags} maxVisible={8} expandable={true} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LostAndFound;
