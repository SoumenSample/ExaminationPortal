import mongoose from "mongoose"

const OTPSchema = new mongoose.Schema({

email:{
type:String,
required:true,
lowercase:true
},

role:{
type:String,
enum:["student","member","school"],
required:true
},

phone:{
type:String,
default:null
},

otp:{
type:String,
required:true
},

expiresAt:{
type:Date,
required:true,
default:()=>new Date(Date.now() + 10*60*1000) // 10 minutes
},

verified:{
type:Boolean,
default:false
},

attempts:{
type:Number,
default:0
},

maxAttempts:{
type:Number,
default:3
}

},{timestamps:true})

// Auto delete expired OTPs
OTPSchema.index({expiresAt:1},{expireAfterSeconds:0})

export default mongoose.models.OTP ||
mongoose.model("OTP",OTPSchema)
