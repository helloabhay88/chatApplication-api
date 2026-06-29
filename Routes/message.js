import express from 'express'
import verifyUser from '../middleware/verifyUser.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { GetReceiverSocketId,io } from '../socket/socket.js'
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../cloudinary.js';

const attachmentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'chatApplication_attachments',
        resource_type: 'auto',
        public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`,
    },
});
const uploadAttachment = multer({ storage: attachmentStorage });

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
        const { content, messageType, fileUrl, fileName } = req.body;
        
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
            messageType: messageType || 'text',
            fileUrl: fileUrl,
            fileName: fileName,
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

router.post('/upload', verifyUser, uploadAttachment.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        return res.status(200).json({
            message: "success",
            url: req.file.filename,
            name: req.file.originalname,
            type: req.file.mimetype.startsWith('image') ? 'image' : 'file'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error uploading file", error: error.message });
    }
});

router.delete('/delete/:messageId', verifyUser, async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Verify message ownership (only original sender can delete)
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this message" });
        }

        // If the message has fileUrl, call await cloudinary.uploader.destroy(message.fileUrl, { resource_type: message.messageType === 'image' ? 'image' : 'raw' }) to remove it from Cloudinary
        if (message.fileUrl) {
            await cloudinary.uploader.destroy(message.fileUrl, {
                resource_type: message.messageType === 'image' ? 'image' : 'raw'
            });
        }

        // Delete the message from MongoDB
        await Message.findByIdAndDelete(messageId);

        // Find the other participant in the message's conversation, get their socket ID via GetReceiverSocketId(recipientId), and emit socket event messageDeleted containing { messageId }
        const conversation = await Conversation.findById(message.conversationId);
        if (conversation) {
            const recipientId = conversation.participants.find(
                id => id.toString() !== req.user._id.toString()
            );
            if (recipientId) {
                const receiverSocketId = GetReceiverSocketId(recipientId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('messageDeleted', { messageId });
                }
            }
        }

        return res.status(200).json({ message: "success" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error deleting message", error: error.message });
    }
});

export default router;
