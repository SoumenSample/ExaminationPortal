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

options:{
type:[String],
default:[]
},

time:{
type:Number
},

marks:{
type:Number
},

ageSlab:{
type:String,
enum:["8-12","13-16","17-22"],
required:true
},

},{timestamps:true})

const existingQuestionModel = mongoose.models.Question

if(existingQuestionModel && !existingQuestionModel.schema.path("ageSlab")){
existingQuestionModel.schema.add({
ageSlab:{
type:String,
enum:["8-12","13-16","17-22"],
required:true
}
})
}

if(existingQuestionModel && !existingQuestionModel.schema.path("options")){
existingQuestionModel.schema.add({
options:{
type:[String],
default:[]
}
})
}

export default existingQuestionModel ||
mongoose.model("Question",QuestionSchema)