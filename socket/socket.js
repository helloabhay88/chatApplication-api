import {Server} from 'socket.io'
import http from 'http'
import express from 'express'

const app=express()
const onlineUsers={}
const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:'*',
        methods:['GET','POST'],
    }
})

export const GetReceiverSocketId=(receiverId)=>{
    return onlineUsers[receiverId]
}
io.on('connection',(socket)=>{
    console.log("user jointed",socket.id)
    socket.on('join',(receiverId)=>{
        onlineUsers[receiverId]=socket.id
        console.log("Receiver id ",receiverId," socket id ", socket.id)
    })
})

export {app,server,io}