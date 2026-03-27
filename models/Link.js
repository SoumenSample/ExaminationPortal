import mongoose from "mongoose"

const LinkSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

url:{
type:String,
required:true
},

readBy:[{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}]
},{timestamps:true})

export default mongoose.models.Link ||
mongoose.model("Link",LinkSchema)