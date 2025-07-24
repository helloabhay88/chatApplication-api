import { Server } from 'socket.io'
import http from 'http'
import express from 'express'

const app = express()
const onlineUsers = {}
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
    console.log("user jointed", socket.id)
    socket.on('join', (receiverId) => {
        onlineUsers[receiverId] = socket.id
        console.log("Receiver id ", receiverId, " socket id ", socket.id)
    })

    socket.on('typing', ({ senderId, receiverId }) => {
        const receiverSocketId = onlineUsers[receiverId];
        console.log(receiverSocketId)
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

})

export { app, server, io }