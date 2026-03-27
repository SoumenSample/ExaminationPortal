import { connectDB } from "@/lib/db"
import Chat from "@/models/Chat"

export async function GET(){

await connectDB()

const messages = await Chat.find().sort({createdAt:1})

return Response.json(messages)

}

export async function POST(req){

await connectDB()

const body = await req.json()

const chat = await Chat.create(body)

return Response.json(chat)

}