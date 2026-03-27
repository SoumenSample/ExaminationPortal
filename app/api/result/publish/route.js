import { connectDB } from "@/lib/db"
import Result from "@/models/Result"

export async function PATCH(req){

await connectDB()

const { email } = await req.json()

if(email){
const updated = await Result.findOneAndUpdate(
{email},
{isPublished:true},
{new:true}
)

return Response.json({
message:"Result published",
updated
})
}

const updateResult = await Result.updateMany(
{},
{isPublished:true}
)

return Response.json({
message:"All results published",
matchedCount:updateResult.matchedCount,
modifiedCount:updateResult.modifiedCount
})

}