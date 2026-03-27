import mongoose from "mongoose"

const QuestionSchema = new mongoose.Schema({

type:{
type:String,
enum:["mcq","descriptive"],
required:true
},

question:{
type:String,
required:true
},

answer:{
type:String
},

time:{
type:Number
},

marks:{
type:Number
},

},{timestamps:true})

export default mongoose.models.Question ||
mongoose.model("Question",QuestionSchema)