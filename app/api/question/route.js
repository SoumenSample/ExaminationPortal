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

function normalizeOptions(rawOptions) {
if (!Array.isArray(rawOptions)) return []
return rawOptions.map((item)=>typeof item === "string" ? item.trim() : "")
}

function validateQuestionPayload(payload) {
if(!payload.question){
return "Question is required"
}

if(!["mcq","descriptive"].includes(payload.type)){
return "Valid question type is required"
}

if(!Number.isFinite(payload.time) || payload.time <= 0){
return "Time must be a positive number"
}

if(!Number.isFinite(payload.marks) || payload.marks <= 0){
return "Marks must be a positive number"
}

if(!payload.ageSlab){
return "Valid age slab is required"
}

if(payload.type === "mcq"){
if(payload.options.length !== 4){
return "MCQ must have exactly 4 options"
}

if(payload.options.some((item)=>!item)){
return "All 4 MCQ options are required"
}

if(!payload.answer){
return "Correct answer required for MCQ"
}

if(!payload.options.includes(payload.answer)){
return "Correct answer must match one of the 4 options"
}
} else {
payload.answer = ""
payload.options = []
}

return ""
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

const payload = {
question: typeof body?.question === "string" ? body.question.trim() : "",
type: typeof body?.type === "string" ? body.type.trim() : "",
answer: typeof body?.answer === "string" ? body.answer.trim() : "",
options: normalizeOptions(body?.options),
time: Number(body?.time),
marks: Number(body?.marks),
ageSlab,
}

const validationError = validateQuestionPayload(payload)

if(validationError){
return Response.json({ message:validationError },{ status:400 })
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
options: normalizeOptions(body?.options),
time: Number(body?.time),
marks: Number(body?.marks),
ageSlab: normalizeAgeSlab(body?.ageSlab),
}

const validationError = validateQuestionPayload(updatedPayload)

if(validationError){
return Response.json({ message:validationError },{ status:400 })
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