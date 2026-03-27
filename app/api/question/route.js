import { connectDB } from "@/lib/db"
import Question from "@/models/Question"

export async function GET(){

await connectDB()

const questions = await Question.find().sort({createdAt:-1})

return Response.json(questions)

}

export async function POST(req){

await connectDB()

const body = await req.json()

const question = await Question.create(body)

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