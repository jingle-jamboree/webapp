// PickMyParcel.js
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';

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
    <>
      {/* Header */}
      <div className={headerClasses}>
        <div ref={headerContentRef} className="container mx-auto px-4">
          <h2 ref={headerRef} className={titleClasses}>
            Pick My Parcel
          </h2>
        </div>
      </div>

      {/* Avoid header overlap */}
      <div className="pt-32 max-w-4xl mx-auto px-4 space-y-8 pb-24">
        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Display credits + "Get Order Delivered" */}
        <div className="card flex items-center justify-between p-6">
          <div>
            <h3 className="text-xl font-bold text-blue-300 mb-1">
              Your Credits
            </h3>
            <p className="text-gray-300">
              You have <span className="font-semibold">{userCredits}</span>{' '}
              credits.
            </p>
          </div>
          {!isWaitingForDelivery && (
            <button
              onClick={requestOrderDelivery}
              className="btn-primary px-6 py-3 rounded-lg"
            >
              Get Order Delivered
            </button>
          )}
        </div>

        {/* If user is waiting */}
        {isWaitingForDelivery && (
          <div className="card p-6 flex flex-col items-center space-y-4">
            <h3 className="text-xl font-bold text-blue-300">
              Looking for a middle man...
            </h3>
            <p className="text-gray-400 text-sm text-center">
              Please wait. Once someone picks up your request, you'll be
              redirected to the chat.
            </p>
            <button
              onClick={cancelOrderDelivery}
              className="btn-primary bg-red-600 hover:bg-red-700 mt-4 px-6 py-3 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}

        {/* If user NOT waiting => show open orders */}
        {!isWaitingForDelivery && (
          <div className="card p-6 space-y-4">
            <h3 className="text-xl font-bold text-blue-300">Open Deliveries</h3>
            {openOrders.length === 0 ? (
              <p className="text-gray-400">No open deliveries at the moment.</p>
            ) : (
              <div className="space-y-3">
                {openOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors flex items-center justify-between"
                    onClick={() => acceptDelivery(order._id)}
                  >
                    <div>
                      <h4 className="font-semibold text-lg">{order.title}</h4>
                      <p className="text-sm text-gray-400">
                        Drop off at: {order.dropoffLocation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        Reward: {order.reward} credits
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scroll to top button */}
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 h-14 w-14 rounded-full shadow-lg
            flex items-center justify-center transition-all duration-200 z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: showScrollTop ? 1 : 0,
            y: showScrollTop ? 0 : 20,
            pointerEvents: showScrollTop ? 'auto' : 'none',
          }}
          transition={{ duration: 0.2 }}
        >
          <ArrowUpIcon className="h-6 w-6 text-gray-300" />
        </motion.button>
      </div>
    </>
  );
}
