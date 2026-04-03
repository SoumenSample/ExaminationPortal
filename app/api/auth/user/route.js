import { connectDB } from "../../../../lib/db"
import User from "@/models/User"
import { getAgeSlabFromAge } from "@/lib/utils"

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

let user = await User.findById(id).lean()

if(!user){
return Response.json({message:"User not found"},{status:404})
}

if((user.role === "school" || user.role === "member" || user.role === "staff") && !user.uniqueCode){
const generatedCode = await generateUniqueCode(user.role)
await User.findByIdAndUpdate(user._id, { $set: { uniqueCode: generatedCode } })
user.uniqueCode = generatedCode
}

return Response.json({
_id:user._id,
role:user.role,
name:user.name,
age:user.age,
ageSlab:user.role === "student" ? getAgeSlabFromAge(user.age) : null,
email:user.email,
phone:user.phone,
address:user.address,
addressLine1:user.addressLine1,
addressLine2:user.addressLine2,
district:user.district,
pincode:user.pincode,
state:user.state,
bankDetails:user.bankDetails || "",
aadhaar:user.aadhaar,
uniqueCode:user.uniqueCode,
currentCommission:user.currentCommission || 0,
totalCommission:user.totalCommission || 0,
totalReferralCount:user.totalReferralCount || 0,
paymentStatus:user.paymentStatus || "pending"
})

}catch(error){

return Response.json({message:error.message},{status:500})
}

}

export async function PATCH(req){

try{

await connectDB()

const body = await req.json()

const id = body?.id
const bankDetails = typeof body?.bankDetails === "string" ? body.bankDetails.trim() : ""

if(!id){
return Response.json({message:"User id is required"},{status:400})
}

const user = await User.findById(id)

if(!user){
return Response.json({message:"User not found"},{status:404})
}

if(user.role !== "school" && user.role !== "member" && user.role !== "staff"){
return Response.json({message:"Bank details can only be updated for school or member/staff"},{status:400})
}

user.bankDetails = bankDetails
await User.findByIdAndUpdate(
user._id,
{ $set: { bankDetails } },
{ new: true, runValidators: true }
)

return Response.json({
message:"Bank details saved",
bankDetails:bankDetails
})

}catch(error){

return Response.json({message:error.message},{status:500})

}

}

