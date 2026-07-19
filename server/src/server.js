import express from 'express'
import http, { Server } from 'http'
import {Server} from 'socket.io'
import cors from 'cors'
const app = express();
app.use(cors({
    origin: "http:localhost:5173"
}))
const server = http.createServer(app);
const io  = new Server(server,{
  cors :{
    origin : "http:localhost:5173"
  }
})

server.listen()