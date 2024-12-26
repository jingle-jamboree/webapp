// file: models/ChatRoom.js
import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // requester + acceptor
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      timestamp: { type: Date, default: Date.now },
    }
  ]
});

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
