import { connectDB } from "@/lib/db"
import ExamSchedule from "@/models/ExamSchedule"

export async function GET(){

await connectDB()

const schedule = await ExamSchedule.findOne().sort({ createdAt:-1 })

return Response.json({
scheduleAt: schedule?.scheduleAt || null,
isScheduled: !!schedule?.scheduleAt
})

}

export async function POST(req){

await connectDB()

const body = await req.json()
const scheduleAt = body?.scheduleAt

if(!scheduleAt){
return Response.json({ message:"Schedule time is required" },{ status:400 })
}

const parsedDate = new Date(scheduleAt)

if(Number.isNaN(parsedDate.getTime())){
return Response.json({ message:"Invalid schedule time" },{ status:400 })
}

const schedule = await ExamSchedule.findOneAndUpdate(
{},
{ scheduleAt: parsedDate },
{ new:true, upsert:true, setDefaultsOnInsert:true }
)

return Response.json({
message:"Schedule saved successfully",
scheduleAt: schedule.scheduleAt,
isScheduled:true
})

}

export async function DELETE(){

await connectDB()

await ExamSchedule.deleteMany({})

return Response.json({
message:"Schedule reset successfully",
scheduleAt:null,
isScheduled:false
})

}
