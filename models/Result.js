import mongoose from "mongoose"

const ResultSchema = new mongoose.Schema({

email:String,

score:Number,

totalMarks:Number,

answers:Array,

isPublished:{
type:Boolean,
default:false
}

},{timestamps:true})

export default mongoose.models.Result ||
mongoose.model("Result",ResultSchema)