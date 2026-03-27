import { connectDB } from "@/lib/db"
import Link from "@/models/Link"
import mongoose from "mongoose"

export async function GET(req){

await connectDB()

const links = await Link.find().sort({createdAt:-1})

const { searchParams } = new URL(req.url)
const userId = searchParams.get("userId")

if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
return Response.json(links)
}

const linksWithFlag = links.map((link)=>{
const readBy = link.readBy || []
const isRead = readBy.some((id)=>id.toString() === userId)

return {
...link.toObject(),
isNew:!isRead
}
})

return Response.json(linksWithFlag)

}

export async function POST(req){

await connectDB()

const body = await req.json()

const link = await Link.create(body)

return Response.json(link)

}

export async function PATCH(req){

await connectDB()

const body = await req.json().catch(()=>null)
const userId = body?.userId

if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
return Response.json({message:"Valid userId is required"},{status:400})
}

await Link.updateMany(
{},
{ $addToSet: { readBy: userId } }
)

return Response.json({message:"All study materials marked as read"})

}