import { connectDB } from "../../../../lib/db"
import User from "@/models/User"

async function generateUniqueCode(role){
const prefix = role === "school" ? "SCH" : "STF"

for(let attempt = 0; attempt < 10; attempt++){
const randomPart = Math.floor(100000 + Math.random() * 900000)
const code = `${prefix}${randomPart}`

const exists = await User.exists({ uniqueCode: code })

if(!exists){
return code
}
}

throw new Error("Could not generate unique code. Please try again.")
}

export async function GET(req){

try{

await connectDB()

const { searchParams } = new URL(req.url)

const id = searchParams.get("id")

if(!id){
return Response.json({message:"User id is required"},{status:400})
}

const user = await User.findById(id)

if(!user){
return Response.json({message:"User not found"},{status:404})
}

if((user.role === "school" || user.role === "staff") && !user.uniqueCode){
user.uniqueCode = await generateUniqueCode(user.role)
await user.save()
}

return Response.json({
_id:user._id,
role:user.role,
name:user.name,
email:user.email,
phone:user.phone,
address:user.address,
aadhaar:user.aadhaar,
uniqueCode:user.uniqueCode
})

}catch(error){

return Response.json({message:error.message},{status:500})
}

}

