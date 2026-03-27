import { connectDB } from "@/lib/db"
import User from "@/models/User"

export async function PATCH(req){

try{

await connectDB()

const { userId, commission } = await req.json()

const user = await User.findById(userId)

if(!user){
return Response.json({message:"User not found"}, {status:404})
}

const total = user.referralCount * commission

const updated = await User.findByIdAndUpdate(
userId,
{
commissionPerReferral: commission,
totalCommission: total
},
{ new: true }
)

return Response.json(updated)

}catch(error){

return Response.json({error:error.message},{status:500})

}

}