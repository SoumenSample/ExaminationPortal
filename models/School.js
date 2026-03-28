import mongoose from "mongoose"

const SchoolSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

address:{
type:String,
required:true
},

city:{
type:String,
required:true
},

state:{
type:String,
required:true
},

pincode:{
type:String,
required:true
},

phone:{
type:String,
required:true
},

email:{
type:String,
required:true,
lowercase:true
},

principalName:{
type:String,
default:null
},

registrationNumber:{
type:String,
unique:true,
required:true
},

totalStudentsRegistered:{
type:Number,
default:0
},

status:{
type:String,
enum:["active","inactive"],
default:"active"
},

createdBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
default:null
}

},{timestamps:true})

export default mongoose.models.School ||
mongoose.model("School",SchoolSchema)
