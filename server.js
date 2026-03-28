import { createServer } from "http"
import next from "next"
import { Server } from "socket.io"

const dev = process.env.NODE_ENV !== "production"
const port = Number(process.env.PORT) || 3000
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(()=>{

const server = createServer((req,res)=>{
handle(req,res)
})

const io = new Server(server,{
cors:{origin:"*"}
})

io.on("connection",(socket)=>{

console.log("✅ User connected, socketId:", socket.id)

socket.on("joinSupport",(payload)=>{
const isAdmin = Boolean(payload?.isAdmin)
const userEmail = payload?.userEmail

console.log("🔗 joinSupport received:", { socketId: socket.id, isAdmin, userEmail })

if(isAdmin){
socket.join("admins")
console.log(`✅ Socket ${socket.id} joined 'admins' room`)
}

if(userEmail){
socket.join(`thread:${userEmail}`)
console.log(`✅ Socket ${socket.id} joined 'thread:${userEmail}' room`)
}
console.log("📍 Rooms:", socket.rooms)
})

socket.on("sendMessage",(data)=>{
console.log("📨 Server received sendMessage:", { email: data?.email, studentEmail: data?.studentEmail })

const threadEmail = data?.studentEmail || data?.email

if(threadEmail){
console.log(`📤 Emitting to thread:${threadEmail}`)
io.to(`thread:${threadEmail}`).emit("receiveMessage",data)
}

console.log("📤 Emitting to admins")
io.to("admins").emit("receiveMessage",data)

})

})

server.listen(port,()=>{
console.log(`Server running on port ${port}`)
})

})