import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/solid';
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

export default function PickMyParcel() {
  const { user, handleAuthError, isAuthError } = useAuth();
  const navigate = useNavigate();

  // Socket reference
  const socketRef = useRef(null);

  // Basic UI states
  const [isCompact, setIsCompact] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [userCredits, setUserCredits] = useState(0);
  const [openOrders, setOpenOrders] = useState([]);
  const [isWaitingForDelivery, setIsWaitingForDelivery] = useState(false);
  const headerRef = useRef(null);
  const headerContentRef = useRef(null);

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

  // Add scroll handler for header compactness
  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ===========================================================
  // 1. Socket.IO Setup & "DELIVERY_ACCEPTED" Listener
  // ===========================================================
  useEffect(() => {
    if (!user) return;

    // Connect to the socket server
    socketRef.current = io(WEBSOCKET_URL, {
      query: { userId: user.enroll },
      transports: ['websocket'],
    });

    // Listen for "DELIVERY_ACCEPTED" to redirect both parties
    socketRef.current.on('DELIVERY_ACCEPTED', (payload) => {
      // payload = { type, chatRoomId, requesterId, acceptorId }
      // If this user is either the requester or acceptor, redirect them
      if (
        payload.requesterId === user.enroll.toString() ||
        payload.acceptorId === user.enroll.toString()
      ) {
        navigate(`/chat/${payload.chatRoomId}`, { replace: true });
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, navigate]);

  // ===========================================================
  // 2. Fetch Data: Credits & Open Orders
  // ===========================================================
  useEffect(() => {
    if (!user) return;
    fetchUserCredits();
    fetchOpenOrders();
    setupScrollListener();
    return () => removeScrollListener();
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
        body: JSON.stringify({}), // You could pass extra data if needed
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
      // Immediately redirect
      navigate(`/chat/${data.chatRoomId}`, { replace: true });
    } catch (err) {
      setError(err.message);
    }
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

  return (
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
            {!isWaitingForDelivery && (
              <button
                onClick={requestOrderDelivery}
                className="btn-primary px-6 py-3 rounded-lg w-full md:w-auto
                                    bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600
                                    transition-all duration-300"
              >
                Get Order Delivered
              </button>
            )}
          </div>
        </motion.div>

        {/* Waiting Status Card */}
        <AnimatePresence mode="wait">
          {isWaitingForDelivery && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="card bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 
                                border border-white/10 shadow-xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-blue-300">
                    Looking for a middle man...
                  </h3>
                  <p className="text-gray-400">
                    Please wait. Once someone picks up your request,
                    you'll be redirected to the chat.
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
                />
                <button
                  onClick={cancelOrderDelivery}
                  className="btn-primary bg-red-600 hover:bg-red-700 
                                        px-6 py-3 rounded-lg transition-colors"
                >
                  Cancel Request
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Open Orders Card */}
        {!isWaitingForDelivery && (
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
                    <motion.div
                      key={order._id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="bg-gray-700/50 hover:bg-gray-700 p-5 rounded-xl
                                                border border-white/5 cursor-pointer transition-colors"
                      onClick={() => acceptDelivery(order._id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">
                              {order.title || 'Delivery Request'}
                            </h4>
                            <span className="text-sm text-gray-400">
                              • {formatTime(order.time || '12:00')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">
                            Drop off at: {order.dropoffLocation}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-400 font-semibold">
                            {order.reward} credits
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

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
  );
}
