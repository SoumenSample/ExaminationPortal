import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({

role:{
type:String,
enum:["school","staff","student"],
required:true
},

name:String,
email:String,
phone:String,
address:String,
aadhaar:String,
referralCode:{
type:String,
default:null
},
referralCount:{
type:Number,
default:0
},
referredBy:{
type: mongoose.Schema.Types.ObjectId,
ref: "User",
default: null
},

uniqueCode:{
type:String,
unique:true,
sparse:true
},
commissionPerReferral:{
type:Number,
default:0
},

totalCommission:{
type:Number,
default:0
},

password:String

},{timestamps:true})

export default mongoose.models.User ||
mongoose.model("User",UserSchema)