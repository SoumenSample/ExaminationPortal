import mongoose from "mongoose"

const ExamScheduleSchema = new mongoose.Schema({

scheduleAt:{
type:Date,
required:true
}

},{timestamps:true})

export default mongoose.models.ExamSchedule ||
mongoose.model("ExamSchedule",ExamScheduleSchema)
