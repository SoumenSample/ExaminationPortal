import { connectDB } from "@/lib/db"
import Chat from "@/models/Chat"

export async function GET(req){
  await connectDB()

  const { searchParams } = new URL(req.url)
  const isAdmin = searchParams.get("isAdmin") === "true"
  const userEmail = searchParams.get("userEmail")

  if(!isAdmin && !userEmail){
    return Response.json([])
  }

  let query = {}

  if(!isAdmin){
    query = {
      $or: [
        { studentEmail: userEmail },
        { studentEmail: null, email: userEmail }
      ]
    }
  }

  const messages = await Chat.find(query).sort({createdAt:1})
  return Response.json(messages)
}

export async function POST(req){
  await connectDB()
  const body = await req.json()

  const chat = await Chat.create({
    email: body.email,
    message: body.message,
    studentEmail: body.studentEmail || body.email
  })

  return Response.json(chat)
}

export async function PUT(req){
  try {
    await connectDB()
    
    const { messageId, newMessage } = await req.json()
    
    if(!messageId || !newMessage){
      return Response.json(
        { error: "Message ID and new message content are required" },
        { status: 400 }
      )
    }
    
    const message = await Chat.findByIdAndUpdate(
      messageId,
      {
        message: newMessage,
        isEdited: true,
        editedAt: new Date()
      },
      { new: true }
    )
    
    if(!message){
      return Response.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }
    
    return Response.json({
      success: true,
      message: "Message edited successfully",
      data: message
    })
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req){
  try {
    await connectDB()
    
    const { messageId, deletedBy } = await req.json()
    
    if(!messageId || !deletedBy){
      return Response.json(
        { error: "Message ID and deletedBy are required" },
        { status: 400 }
      )
    }
    
    const message = await Chat.findByIdAndUpdate(
      messageId,
      {
        deletedAt: new Date(),
        deletedBy: deletedBy
      },
      { new: true }
    )
    
    if(!message){
      return Response.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }
    
    return Response.json({
      success: true,
      message: "Message deleted successfully",
      data: message
    })
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}