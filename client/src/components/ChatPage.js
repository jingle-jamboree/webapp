import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:5000';

const ChatPage = () => {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const socketRef = useRef(null);

  // Connect/Join on mount
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(WEBSOCKET_URL, {
      query: { userId: user._id },
      transports: ['websocket']
    });

    // Join the socket.io "room" for this chat
    socketRef.current.emit('JOIN_ROOM', roomId);

    // Listen for new messages
    socketRef.current.on('CHAT_MESSAGE', (data) => {
      // data = { sender, senderName, text, timestamp }
      // If we only broadcast to the room, we won't get duplicates for our own messages
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, roomId]);

  const sendMessage = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    // Just emit; do NOT push to local state optimistically
    // We'll rely on the server broadcast for a single source
    if (socketRef.current) {
      socketRef.current.emit('CHAT_MESSAGE', {
        chatRoomId: roomId,
        text: trimmed,
        senderId: user.enroll
      });
    }

    setInputMessage('');
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Animate each message
  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 }
    },
    exit: { opacity: 0, y: 10 }
  };

  const isMyMessage = (msg) => {
    console.log(msg, user)
    return msg.sender === user.enroll
  };

  return (
    <div className="page-wrapper">
      <div className="content-container relative max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Header row */}
        <div className="flex items-center mb-6">
          <button 
            onClick={handleBack} 
            className="text-gray-300 hover:text-white transition-colors p-2"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="flex-1 text-center text-2xl font-bold gradient-text">
            Chat Room
          </h2>
        </div>

        {/* Messages container */}
        <div className="card p-4 h-[60vh] overflow-y-auto flex flex-col space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`flex ${
                  isMyMessage(msg) ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    isMyMessage(msg)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  {/* If it's not my message, show the sender's name */}
                  {!isMyMessage(msg) && (
                    <p className="font-semibold text-sm mb-1">
                      {msg.senderName || 'Unknown'}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className="mt-1 text-xs text-gray-300">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <div className="mt-4 flex items-center space-x-3">
          <input
            type="text"
            className="input-field flex-grow"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="btn-primary flex items-center gap-2 px-4 py-3 basis-0"
          >
            <ArrowLeftIcon className="rotate-90 w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
