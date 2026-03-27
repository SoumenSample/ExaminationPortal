import mongoose from "mongoose"

const ChatSchema = new mongoose.Schema({

email:{
type:String,
required:true
},

message:{
type:String,
required:true
}

},{timestamps:true})

export default mongoose.models.Chat ||
mongoose.model("Chat",ChatSchema)