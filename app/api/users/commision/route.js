import { connectDB } from "@/lib/db"
import User from "@/models/User"

export async function PATCH(req){

try{

await connectDB()

const { userId, paymentStatus } = await req.json()

const user = await User.findById(userId)

if(!user){
return Response.json({message:"User not found"}, {status:404})
}

if(!["pending","paid"].includes(paymentStatus)){
return Response.json({message:"Invalid payment status"}, {status:400})
}

const updated = await User.findByIdAndUpdate(
userId,
paymentStatus === "paid"
? {
paymentStatus: "paid",
currentCommission: 0,
referralCount: 0,
referral100Count: 0,
referral150Count: 0,
referral200Count: 0
}
: {
paymentStatus: "pending"
},
{ new: true }
)

return Response.json(updated)

}catch(error){

return Response.json({error:error.message},{status:500})

}

}