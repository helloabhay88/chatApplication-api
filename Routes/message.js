import express from 'express'
import verifyUser from '../middleware/verifyUser.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { GetReceiverSocketId,io } from '../socket/socket.js'

const router = express.Router()

router.get('/read/:receiverId', verifyUser, async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user._id;
        const { skip, limit } = req.query; // Destructure skip and limit from query parameters

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const messages = await Message.find({
            conversationId: conversation._id,
        })
            .sort({ createdAt: -1 }) // Sort by most recent first
            .skip(parseInt(skip) || 0) // Skip a number of messages
            .limit(parseInt(limit) || 50); // Limit the number of messages to fetch

        return res.status(200).json(messages.reverse()); // Reverse to show oldest first on frontend
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching messages", error: error.message });
    }
});

router.post('/send/:receiverId', verifyUser, async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user._id;
        const { content } = req.body;
        
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        
        if (!conversation) {
            conversation = await Conversation({
                participants: [senderId, receiverId]
            });
            await conversation.save();
        }
        
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            content: content,
            createdAt: new Date()
        });
          const receiverSocketId = GetReceiverSocketId(receiverId);
        if (receiverSocketId) {
            //console.log("Receiver socket ID found: ", receiverSocketId);
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }
        await newMessage.save();
        
      
        
        return res.json(newMessage);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error sending message", error: error.message });
    }
});

export default router;
