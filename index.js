import express from 'express'
import cors from 'cors'
import connect from './db/connection.js'
import dotenv from 'dotenv';
import authRouter from './Routes/auth.js'
import userRouter from './Routes/user.js'
import messageRouter from './Routes/message.js'
import { app,server } from './socket/socket.js';
dotenv.config();
app.use(cors({
  origin: ['https://socketmate.vercel.app','http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.static('public/images'))
app.use('/chat/user',authRouter)
app.use('/chat/users',userRouter)
app.use('/chat/message',messageRouter)

server.listen(process.env.PORT,()=>{
    connect()
    console.log(`server is running on PORT ${process.env.PORT}`)
})