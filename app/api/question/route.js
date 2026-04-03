import { connectDB } from "@/lib/db"
import Question from "@/models/Question"
import User from "@/models/User"
import { getSessionTokenFromRequest, verifySessionToken } from "@/lib/session"
import { AGE_SLAB, getAgeSlabFromAge } from "@/lib/utils"

const ALLOWED_AGE_SLABS = Object.values(AGE_SLAB)

function normalizeAgeSlab(value) {
	const slab = typeof value === "string" ? value.trim() : ""
	return ALLOWED_AGE_SLABS.includes(slab) ? slab : ""
}

export async function GET(req){

await connectDB()

const token = getSessionTokenFromRequest(req)
const payload = verifySessionToken(token)

const { searchParams } = new URL(req.url)
const requestedAgeSlab = normalizeAgeSlab(searchParams.get("ageSlab"))

let filter = {}

if (payload?.sub) {
const sessionUser = await User.findById(payload.sub).select("role age").lean()

if (sessionUser?.role === "student") {
const studentAgeSlab = getAgeSlabFromAge(sessionUser.age)

if (!studentAgeSlab) {
return Response.json([])
}

filter = { ageSlab: studentAgeSlab }
} else if (requestedAgeSlab) {
filter = { ageSlab: requestedAgeSlab }
}
} else if (requestedAgeSlab) {
filter = { ageSlab: requestedAgeSlab }
}

const questions = await Question.find(filter).sort({createdAt:-1})

return Response.json(questions)

}

export async function POST(req){

await connectDB()

const body = await req.json()

const ageSlab = normalizeAgeSlab(body?.ageSlab)

if (!ageSlab) {
return Response.json({ message:"Valid age slab is required" },{ status:400 })
}

const payload = {
...body,
ageSlab,
}

const question = await Question.create(payload)

return Response.json({
message:"Question saved successfully",
question
})

}

export async function DELETE(req){

await connectDB()

const { searchParams } = new URL(req.url)
const id = searchParams.get("id")

if(!id){
return Response.json({ message:"Question id is required" },{ status:400 })
}

const deleted = await Question.findByIdAndDelete(id)

if(!deleted){
return Response.json({ message:"Question not found" },{ status:404 })
}

return Response.json({ message:"Question deleted successfully" })

}

export async function PATCH(req){

await connectDB()

const { searchParams } = new URL(req.url)
const id = searchParams.get("id")

if(!id){
return Response.json({ message:"Question id is required" },{ status:400 })
}

const body = await req.json()

const updatedPayload = {
question: typeof body?.question === "string" ? body.question.trim() : "",
type: body?.type,
answer: typeof body?.answer === "string" ? body.answer.trim() : "",
time: Number(body?.time),
marks: Number(body?.marks),
ageSlab: normalizeAgeSlab(body?.ageSlab),
}

if(!updatedPayload.question){
return Response.json({ message:"Question is required" },{ status:400 })
}

if(!["mcq","descriptive"].includes(updatedPayload.type)){
return Response.json({ message:"Valid question type is required" },{ status:400 })
}

if(updatedPayload.type === "mcq" && !updatedPayload.answer){
return Response.json({ message:"Answer is required for MCQ" },{ status:400 })
}

if(!Number.isFinite(updatedPayload.time) || updatedPayload.time <= 0){
return Response.json({ message:"Time must be a positive number" },{ status:400 })
}

if(!Number.isFinite(updatedPayload.marks) || updatedPayload.marks <= 0){
return Response.json({ message:"Marks must be a positive number" },{ status:400 })
}

if(!updatedPayload.ageSlab){
return Response.json({ message:"Valid age slab is required" },{ status:400 })
}

if(updatedPayload.type === "descriptive"){
updatedPayload.answer = ""
}

const updatedQuestion = await Question.findByIdAndUpdate(
id,
updatedPayload,
{ new:true, runValidators:true }
)

if(!updatedQuestion){
return Response.json({ message:"Question not found" },{ status:404 })
}

return Response.json({
message:"Question updated successfully",
question: updatedQuestion
})

}