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

console.log("User connected")

socket.on("sendMessage",(data)=>{

io.emit("receiveMessage",data)

})

})

server.listen(port,()=>{
console.log(`Server running on port ${port}`)
})

})