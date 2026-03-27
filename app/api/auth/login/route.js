import { connectDB } from "../../../../lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function POST(req){

await connectDB()

const {name,password} = await req.json()

const user = await User.findOne({email:name})


if(!user){
    console.log("User not found with name:", name);
return Response.json({message:"User not found"},{status:404})
}


const valid = await bcrypt.compare(password,user.password)

if(!valid)
return Response.json({message:"Wrong password"},{status:401})

return Response.json({
message:"Login successful",
userId:user._id,
email:user.email,
role:user.role
})

}