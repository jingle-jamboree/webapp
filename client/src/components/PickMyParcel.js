import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, XMarkIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';

// Add animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
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

// Add this constant at the top with other animation variants
const waitingCardVariants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

export default function PickMyParcel() {
  // Consolidate socket and state setup
  const socketRef = useRef(null);
  const { user, handleAuthError, isAuthError } = useAuth();
  const navigate = useNavigate();

  // Cleanup and organize state declarations
  const [isCompact, setIsCompact] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [error, setError] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [openOrders, setOpenOrders] = useState([]);
  const [userDeliveries, setUserDeliveries] = useState([]);
  const [isWaitingForDelivery, setIsWaitingForDelivery] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeTab, setActiveTab] = useState('open');

  // Form related state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    pickupLocation: '',
    dropoffLocation: '',
    reward: 5
  });

  // Add new state for chat modal
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatContainerRef = useRef(null);

  const formatTime = (timeString) => {
    const date = new Date();
    const [hours, minutes] = timeString.split(':');
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Add form input handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isClosing) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to create delivery request');
      }

      setIsFormVisible(false);
      setIsWaitingForDelivery(true);
      // Reset form
      setFormData({
        title: '',
        pickupLocation: '',
        dropoffLocation: '',
        reward: 5
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Add close modal handler
  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsFormVisible(false);
      setIsClosing(false);
    }, 200);
  };

  // Add scroll handler for header compactness
  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Combined socket setup and event handlers
  useEffect(() => {
    if (!user) return;

    const setupSocket = () => {
      socketRef.current = io(WEBSOCKET_URL, {
        query: { userId: user.enroll },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      // Socket event listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        socketRef.current.emit('JOIN_PARCEL_UPDATES');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Update DELIVERY_ACCEPTED handler to open chat instead of navigate
      socketRef.current.on('DELIVERY_ACCEPTED', (payload) => {
        if (payload.requesterId === user.enroll.toString() ||
          payload.acceptorId === user.enroll.toString()) {
          setIsWaitingForDelivery(false);
          setActiveChatRoom(payload.chatRoomId);
          socketRef.current.emit('JOIN_ROOM', payload.chatRoomId);
          fetchOpenOrders();
          fetchUserDeliveries();
        }
      });

      // Add chat message handler
      socketRef.current.on('CHAT_MESSAGE', (message) => {
        setChatMessages(prev => [...prev, message]);
        // Scroll to bottom on new message
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });

      socketRef.current.on('PARCEL_UPDATE', handleParcelUpdate);

      socketRef.current.on('DELIVERY_STATUS_CHANGED', (payload) => {
        if (payload.type === 'DELIVERY_COMPLETED') {
          fetchUserDeliveries();
          fetchUserCredits();
        }
      });
    };

    setupSocket();

    // Initial data fetch
    fetchUserCredits();
    fetchOpenOrders();
    fetchUserDeliveries();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('DELIVERY_ACCEPTED');
        socketRef.current.off('PARCEL_UPDATE');
        socketRef.current.off('DELIVERY_STATUS_CHANGED');
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to fetch credits');
      }
      const data = await response.json();
      setUserCredits(data.credits);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchOpenOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to fetch deliveries');
      }
      const data = await response.json();
      setOpenOrders(data.deliveries);
    } catch (err) {
      setError(err.message);
    }
  };

  // Update fetchUserDeliveries to set hasActiveOrder
  const fetchUserDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to fetch deliveries');
      }

      const data = await response.json();
      setUserDeliveries(data.deliveries);

      // Check if user has any in-progress orders as requester
      const hasInProgress = data.deliveries.some(
        d => d.status === 'in-progress' && d.userRole === 'requester'
      );
      setHasActiveOrder(hasInProgress);

      // If user has no active orders, ensure waiting state is reset
      if (!hasInProgress) {
        setIsWaitingForDelivery(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // ===========================================================
  // 3. Create & Cancel Delivery
  // ===========================================================
  const requestOrderDelivery = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to request delivery');
      }
      setIsWaitingForDelivery(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelOrderDelivery = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to cancel delivery');
      }
      setIsWaitingForDelivery(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // ===========================================================
  // 4. Accept Delivery (Middle-Man)
  // ===========================================================
  const acceptDelivery = async (deliveryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries/${deliveryId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to accept delivery');
      }
      const data = await response.json();
      // Open chat directly instead of navigating
      setActiveChatRoom(data.chatRoomId);
      socketRef.current.emit('JOIN_ROOM', data.chatRoomId);

      // Load chat history
      const history = await loadChatHistory(data.chatRoomId);
      if (history) {
        setChatMessages(history);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteDelivery = async (deliveryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries/${deliveryId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to complete delivery');
      fetchUserDeliveries(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  // Update the handleActiveDeliveryClick function
  const handleActiveDeliveryClick = async (delivery) => {
    try {
      // If we already have the chatRoomId, use it directly
      if (delivery.chatRoomId) {
        setActiveChatRoom(delivery.chatRoomId);
        socketRef.current.emit('JOIN_ROOM', delivery.chatRoomId);

        // Load chat history
        const history = await loadChatHistory(delivery.chatRoomId);
        if (history) {
          setChatMessages(history);
        }
        return;
      }

      // Otherwise fetch it
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries/${delivery._id}/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to get chat room');
      }

      const data = await response.json();
      setActiveChatRoom(data.chatRoom._id);
      socketRef.current.emit('JOIN_ROOM', data.chatRoom._id);
    } catch (err) {
      setError(err.message);
    }
  };

  // Add chat functions
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatRoom) return;

    socketRef.current.emit('CHAT_MESSAGE', {
      chatRoomId: activeChatRoom,
      text: messageInput.trim(),
      senderId: user.enroll
    });

    setMessageInput('');
  };

  // Add before the return statement
  const closeChatModal = () => {
    setActiveChatRoom(null);
    setChatMessages([]);
  };

  // ===========================================================
  // 5. Scrolling / Layout
  // ===========================================================
  const setupScrollListener = () => {
    window.addEventListener('scroll', handleScroll, { passive: true });
  };
  const removeScrollListener = () => {
    window.removeEventListener('scroll', handleScroll);
  };
  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 500);
    setIsCompact(window.scrollY > 50);
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Header classes
  const headerClasses = `fixed top-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out
        border-b border-white/5 backdrop-blur-sm
        ${isCompact ? 'py-5 bg-[#0B0F1A]/60 border-opacity-100' : 'py-12 bg-transparent border-opacity-0'}`;
  const titleClasses = `font-bold text-center gradient-text transition-all duration-500 ease-in-out
        ${isCompact ? 'text-2xl' : 'text-4xl'}`;

  // Socket event handlers
  const handleParcelUpdate = (update) => {
    switch (update.type) {
      case 'NEW_DELIVERY':
        // Add new delivery to open orders if not user's own
        if (update.data.requester !== user._id) {
          setOpenOrders(prev => [update.data, ...prev]);
        }
        break;

      case 'DELIVERY_COMPLETED':
      case 'DELIVERY_CANCELLED':
        // Remove from open orders
        setOpenOrders(prev =>
          prev.filter(order => order._id !== update.data.deliveryId)
        );
        // Refresh user deliveries to update status
        fetchUserDeliveries();
        // Refresh credits as they might have changed
        fetchUserCredits();
        break;
    }
  };

  // Modify ItemCard to disable accepting own orders
  const ItemCard = memo(({ item, onClick, currentUserId }) => {
    const isOwnOrder = item.requester && currentUserId &&
      item.requester._id.toString() === currentUserId.toString();

    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        className={`bg-gray-700 rounded-lg p-4 transition-colors duration-300
                ${isOwnOrder ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600/50 cursor-pointer'}`}
        onClick={() => !isOwnOrder && onClick(item._id)}  // Pass item._id instead of entire item
      >
        {isOwnOrder && (
          <div className="text-amber-400 text-sm mb-2">Your order</div>
        )}
        {/* Add the rest of the ItemCard content here */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-lg">
                {item.title || 'Delivery Request'}
              </h4>
              <span className="text-sm text-gray-400">
                • {formatTime(item.time || '12:00')}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-300">
                Pick up from: {item.pickupLocation}
              </p>
              <p className="text-sm text-gray-300">
                Drop off at: {item.dropoffLocation}
              </p>
              <p className="text-sm text-gray-400">
                Posted by: {item.requester?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-orange-400 font-semibold">
              {item.reward} credits
            </p>
          </div>
        </div>
      </motion.div>
    );
  }, (prevProps, nextProps) => {
    return prevProps.item._id === nextProps.item._id;
  });

  // Add function to load chat history
  const loadChatHistory = async (chatRoomId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/parcel/deliveries/chat/${chatRoomId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return null;
        }
        throw new Error('Failed to load chat history');
      }
      const data = await response.json();
      return data.messages;
    } catch (err) {
      console.error('Failed to load chat history:', err);
      return null;
    }
  };

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto pb-5"
      >
        {/* Header */}
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
            Pick My Parcel
          </h2>
        </motion.div>

        {/* Main Content */}
        <div className={`transition-all duration-300 ease-out 
                  ${isCompact ? 'pt-20' : 'pt-28'} px-4 space-y-8`}>

          {/* Credits Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="card bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 
                          border border-white/10 shadow-xl"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-blue-300">Your Credits</h3>
                <p className="text-gray-300">
                  You have <span className="font-semibold">{userCredits}</span> credits
                </p>
              </div>
              {!isWaitingForDelivery && !hasActiveOrder && (
                <button
                  onClick={() => setIsFormVisible(true)}  // Changed from requestOrderDelivery to setIsFormVisible
                  className="btn-primary px-6 py-3 rounded-lg w-full md:w-auto
                                  bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600
                                  transition-all duration-300"
                >
                  Request Order Pickup
                </button>
              )}
              {hasActiveOrder && (
                <p className="text-amber-400 text-sm">
                  Complete your active order before requesting a new one
                </p>
              )}
            </div>
          </motion.div>

          {/* Form Modal for New Delivery */}
          <AnimatePresence>
            {isFormVisible && (
              <motion.div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="relative flex items-center justify-center min-h-screen p-4">
                  <div className="bg-gray-800/95 w-full max-w-md rounded-xl p-6 shadow-xl">
                    <h3 className="text-xl font-semibold mb-4">Request Delivery</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="What needs to be delivered?"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Pickup Location</label>
                        <input
                          type="text"
                          name="pickupLocation"
                          value={formData.pickupLocation}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Where should it be picked up from?"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Drop-off Location</label>
                        <input
                          type="text"
                          name="dropoffLocation"
                          value={formData.dropoffLocation}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Where should it be delivered?"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Reward (Credits)</label>
                        <input
                          type="number"
                          name="reward"
                          value={formData.reward}
                          onChange={handleInputChange}
                          className="input-field"
                          min="1"
                          required
                        />
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsFormVisible(false)}
                          className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1">Submit Request</button>
                      </div>
                    </form>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Delivery Management Tabs */}
          <div className="flex gap-2 mb-4 w-full">
            <button
              onClick={() => setActiveTab('open')}
              className={`flex-1 px-4 py-2 rounded-lg ${activeTab === 'open' ? 'bg-orange-600' : 'bg-gray-700'}`}
            >
              Open
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-4 py-2 rounded-lg ${activeTab === 'active' ? 'bg-orange-600' : 'bg-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 px-4 py-2 rounded-lg ${activeTab === 'past' ? 'bg-orange-600' : 'bg-gray-700'}`}
            >
              History
            </button>
          </div>

          {/* Show appropriate content based on active tab */}
          {activeTab === 'open' && (
            // Existing open orders content
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="card bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 
                              border border-white/10 shadow-xl"
            >
              <h3 className="text-xl font-semibold text-blue-300 mb-6">
                Open Deliveries
              </h3>

              {openOrders.length === 0 ? (
                <p className="text-center py-8 text-gray-400">
                  No open deliveries at the moment.
                </p>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {openOrders.map((order) => (
                      <ItemCard
                        key={order._id}
                        item={order}
                        onClick={acceptDelivery}
                        currentUserId={user?._id}  // Add null check here
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-4">
              {userDeliveries.filter(d => d.status === 'in-progress').length === 0 ? (
                <div className="bg-gray-800/95 rounded-xl p-8 text-center">
                  <p className="text-gray-400">
                    No active deliveries at the moment
                  </p>
                </div>
              ) : (
                userDeliveries
                  .filter(d => d.status === 'in-progress')
                  .map(delivery => (
                    <div
                      key={delivery._id}
                      className="bg-gray-800/95 rounded-xl p-4 hover:bg-gray-700/50 
                              transition-colors cursor-pointer"
                      onClick={() => handleActiveDeliveryClick(delivery)}
                    >
                      {/* Main container with better spacing */}
                      <div className="space-y-4">
                        {/* Header with title and status */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium">{delivery.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${delivery.userRole === 'requester'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-green-500/20 text-green-300'
                              }`}>
                              {delivery.userRole === 'requester' ? 'Your Order' : 'You\'re Delivering'}
                            </span>
                          </div>

                          {/* Location details */}
                          <div className="space-y-1.5">
                            <p className="text-sm text-gray-300 truncate">
                              Pick up from: {delivery.pickupLocation}
                            </p>
                            <p className="text-sm text-gray-300 truncate">
                              Drop off at: {delivery.dropoffLocation}
                            </p>
                          </div>
                        </div>

                        {/* Footer with person info, credits, and complete button */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-gray-400 min-w-0">
                            <MapPinIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate text-sm">
                              {delivery.userRole === 'requester'
                                ? `Deliverer: ${delivery.acceptor.name}`
                                : `Requester: ${delivery.requester.name}`
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-orange-400 font-medium">
                              {delivery.reward} credits
                            </span>
                            {delivery.userRole === 'requester' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteDelivery(delivery._id);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm 
                                         transition-colors whitespace-nowrap"
                              >
                                Completed
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div className="space-y-4">
              {userDeliveries
                .filter(d => d.status === 'completed')
                .map(delivery => (
                  <div
                    key={delivery._id}
                    className="bg-gray-800/95 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{delivery.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full 
                            ${delivery.userRole === 'requester' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                            {delivery.userRole === 'requester' ? 'You Requested' : 'You Delivered'}
                          </span>
                        </div>
                        {delivery.userRole === 'requester' ? (
                          <p className="text-sm text-gray-400">
                            Delivered by: {delivery.acceptor.name}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">
                            Requested by: {delivery.requester.name}
                          </p>
                        )}
                        <div className="text-xs text-gray-500">
                          Completed: {new Date(delivery.completedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <MapPinIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">{delivery.dropoffLocation}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-orange-400 font-medium">{delivery.reward} credits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {userDeliveries.filter(d => d.status === 'completed').length === 0 && (
                <p className="text-center py-8 text-gray-400">
                  No completed deliveries yet
                </p>
              )}
            </div>
          )}

          {/* Waiting Status Card */}

          <AnimatePresence>
            {isWaitingForDelivery && (
              <motion.div
                variants={waitingCardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fixed bottom-0 left-0 right-0 mb-4 mx-auto px-4 w-full max-w-md 
                     sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-40"
              >
                <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 sm:p-6
                       border border-white/10 shadow-xl">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-orange-500 
                          border-t-transparent rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-blue-300 truncate">
                        Looking for a middle man...
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        Please wait for someone to accept your request
                      </p>
                    </div>
                    <button
                      onClick={cancelOrderDelivery}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1.5 sm:px-4 sm:py-2 
                          rounded-lg text-sm transition-colors flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Errors */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96
                                  bg-red-500/10 border border-red-500/50 text-red-500 
                                  p-4 rounded-xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p>{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll to top button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                onClick={scrollToTop}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 h-14 w-14 rounded-xl shadow-lg
                                  flex items-center justify-center transition-all duration-200 z-50"
              >
                <ArrowUpIcon className="h-6 w-6 text-gray-300" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Chat Modal */}
      <AnimatePresence>
        {activeChatRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[45]"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative h-full md:flex md:items-center md:justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-gray-800/95 w-full max-w-2xl rounded-xl shadow-xl 
                          border border-white/10 overflow-hidden h-[90vh] md:h-[80vh]
                          flex flex-col mt-16 md:mt-0"
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeChatModal}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                      <h3 className="font-semibold text-lg">Delivery Chat</h3>
                      {userDeliveries.find(d => d.chatRoomId === activeChatRoom) && (
                        <p className="text-sm text-gray-400">
                          {(() => {
                            const delivery = userDeliveries.find(d => d.chatRoomId === activeChatRoom);
                            const otherParty = delivery.userRole === 'requester'
                              ? delivery.acceptor
                              : delivery.requester;
                            return `${otherParty.name}${otherParty.enroll ? ` (${otherParty.enroll})` : ''}`;
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === user.enroll ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.sender === user.enroll
                          ? 'bg-orange-600/90 text-white'
                          : 'bg-gray-700/90 text-gray-100'
                          }`}
                      >
                        <p>{msg.text}</p>
                        <span className="text-xs opacity-60 block text-right">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-700/50 rounded-lg px-4 py-2 
                               focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!messageInput.trim()}
                    >
                      Send
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
