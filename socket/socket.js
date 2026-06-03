import { Server } from 'socket.io'
import http from 'http'
import express from 'express'
import Message from '../models/Message.js'

const app = express()
const onlineUsers = {}
const lastHeartbeat = {};
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
})

export const GetReceiverSocketId = (receiverId) => {
    return onlineUsers[receiverId]
}

io.on('connection', (socket) => {
    //console.log("user joined", socket.id);

    socket.on('join', (receiverId) => {
        onlineUsers[receiverId] = socket.id;
        //console.log("Receiver id ", receiverId, " socket id ", socket.id);

        io.emit('onlineUsers', Object.keys(onlineUsers));
    });

    // New handlers for visibility online/offline status
    socket.on('user-online', (userId) => {
        onlineUsers[userId] = socket.id;
        io.emit('onlineUsers', Object.keys(onlineUsers));
        //console.log(`User ${userId} is online`);
    });

    socket.on('user-offline', (userId) => {
        if (onlineUsers[userId] === socket.id) {
            delete onlineUsers[userId];
            io.emit('onlineUsers', Object.keys(onlineUsers));
            //console.log(`User ${userId} is offline`);
        }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
        const receiverSocketId = onlineUsers[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', { senderId });
        }
    });

    socket.on('stopTyping', ({ senderId, receiverId }) => {
        const receiverSocketId = onlineUsers[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userStopTyping', { senderId });
        }
    });

    socket.on('heartbeat', (userId) => {
        lastHeartbeat[userId] = Date.now();
        if (!onlineUsers[userId]) {
            onlineUsers[userId] = socket.id;
            io.emit('onlineUsers', Object.keys(onlineUsers));
        }
    });

    socket.on('disconnect', () => {
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                break;
            }
        }
        io.emit('onlineUsers', Object.keys(onlineUsers));
    });

    socket.on('messageSeen', async ({ messageId, senderId }) => {
        await Message.findByIdAndUpdate(messageId, { seen: true })
        //console.log(senderId, " ", messageId)
        
        if (onlineUsers[senderId]) {
            //console.log("message seen who is the sender", senderId, onlineUsers[senderId])
            io.to(onlineUsers[senderId]).emit('messageSeen', { messageId })
        }
    });

    // WebRTC Signaling Events
    socket.on('callUser', ({ userToCall, signalData, from, name }) => {
        console.log(`--> [Socket] callUser received. From: ${from}, To: ${userToCall}`);
        const receiverSocketId = onlineUsers[userToCall];
        if (receiverSocketId) {
            console.log(`--> [Socket] Forwarding callUser to socket ${receiverSocketId}`);
            io.to(receiverSocketId).emit("callUser", { signal: signalData, from, name });
        } else {
            console.log(`--> [Socket] ERROR: Receiver ${userToCall} is not online.`);
        }
    });

    socket.on('answerCall', (data) => {
        console.log(`--> [Socket] answerCall received. To: ${data.to}`);
        const callerSocketId = onlineUsers[data.to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("callAccepted", data.signal);
        }
    });

    socket.on('ice-candidate', ({ target, candidate }) => {
        const receiverSocketId = onlineUsers[target];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('ice-candidate', candidate);
        }
    });

    socket.on('endCall', ({ to }) => {
        console.log(`--> [Socket] endCall received. To: ${to}`);
        const receiverSocketId = onlineUsers[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("callEnded");
        }
    });
});


export { app, server, io }
