"use client"

import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

export default function ChatBox({user}){

const [messages,setMessages] = useState([])
const [message,setMessage] = useState("")
const socketRef = useRef(null)

// load old messages
useEffect(()=>{

fetch("/api/chat")
.then(res=>res.json())
.then(data=>setMessages(data))

},[])
console.log("Loaded messages:", messages);
// listen realtime
useEffect(()=>{

const socketClient = io({
path:"/socket.io",
transports:["websocket","polling"]
})

socketRef.current = socketClient

socketClient.on("receiveMessage",(data)=>{

setMessages(prev=>[...prev,data])

})

return ()=>{
socketClient.off("receiveMessage")
socketClient.disconnect()
socketRef.current = null
}

},[])

async function sendMessage(){

if(!message.trim()) return

if(!user?.email){
return
}

const data = {
email:user.email,
message
}

if(socketRef.current){
socketRef.current.emit("sendMessage",data)
}

await fetch("/api/chat",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
})

setMessage("")

}

return(

<div className="fixed bottom-20 right-6 w-80 bg-white shadow-lg rounded-lg">

<div className="bg-blue-600 text-white p-3">
Chat
</div>

<div className="p-3 h-60 grid grid-cols-1 overflow-y-auto">

{messages.map((m,i)=>(
    <>
<div
className={`inline-block p-2 rounded mb-2 max-w-[70%] break-words ${
user?.email === m.email ? "bg-green-200 ml-auto" : "bg-gray-200 mr-auto"
}`}
>


<p className="text-xs text-gray-500">
{m.email}
</p>

<p>{m.message}</p>

</div>
</>
))}

</div>

<div className="flex border-t">

<input
value={message}
onChange={(e)=>setMessage(e.target.value)}
className="flex-1 p-2 outline-none"
/>

<button
onClick={sendMessage}
className="bg-blue-600 text-white px-4"
>
Send
</button>

</div>

</div>

)

}