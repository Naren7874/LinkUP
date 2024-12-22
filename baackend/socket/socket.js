import {Server} from 'socket.io'
import express from 'express'
import http from 'http'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const server = http.createServer(app)

const io = new Server(server ,{
    cors: {
        origin: `${process.env.CLIENT_URL}`,
        methods: ["GET", "POST"]
    }
})

const userSocketMap = {};
export const getRecipientSocketId = (recipientId) =>{
    return userSocketMap[recipientId]
};

io.on('connection', (socket) => {
    const  userId = socket.handshake.query.userId;
    if (userId  !== "undefined") {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected`)
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on('disconnect', () => {
        console.log('user disconnected')
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })

    // socket.on('joinRoom', (room) => {
    //     socket.join(room)
    //     console.log(`User joined room: ${room}`)
    // })

    // socket.on('sendMessage', (message) => {
    //     io.to(message.room).emit('message', message)
    // })

 })

 export {io ,server ,app}