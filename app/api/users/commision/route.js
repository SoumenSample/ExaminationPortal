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

let updateQuery = {
$set: {
paymentStatus: "pending"
}
}

if(paymentStatus === "paid"){
const amountPaid = Number(user.currentCommission || 0)

updateQuery = {
$set: {
paymentStatus: "paid",
currentCommission: 0,
referralCount: 0,
referral100Count: 0,
referral150Count: 0,
referral200Count: 0
}
}

if(amountPaid > 0){
updateQuery.$push = {
commissionPayouts: {
amount: amountPaid,
paidAt: new Date(),
paymentStatus: "paid"
}
}
}
}

const updated = await User.findByIdAndUpdate(userId, updateQuery, { new: true })

return Response.json(updated)

}catch(error){

return Response.json({error:error.message},{status:500})

}

}