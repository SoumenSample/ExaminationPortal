import { connectDB } from "@/lib/db"
import User from "@/models/User"

export async function GET(){

await connectDB()

const users = await User.find().sort({createdAt:-1})

return Response.json(users)

}