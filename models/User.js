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

// New fields for students
age:{
type:Number,
required:function(){return this.role === "student"}
},
class:{
type:String,
required:function(){return this.role === "student"}
},
registrationSchool:{
type:mongoose.Schema.Types.ObjectId,
ref:"School",
default:null
},
registrationType:{
type:String,
enum:["school","individual"],
default:"individual"
},
registrationFee:{
type:Number,
default:0
},

// Email verification OTP
emailVerified:{
type:Boolean,
default:false
},

// User blocking status
isBlocked:{
type:Boolean,
default:false
},
blockedReason:{
type:String,
default:null
},

referralCode:{
type:String,
default:null
},
referralCount:{
type:Number,
default:0
},
totalReferralCount:{
type:Number,
default:0
},
referral100Count:{
type:Number,
default:0
},
referral150Count:{
type:Number,
default:0
},
referral200Count:{
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
currentCommission:{
type:Number,
default:0
},
paymentStatus:{
type:String,
enum:["pending","paid"],
default:"pending"
},

password:String

},{timestamps:true})

const existingUserModel = mongoose.models.User

if(existingUserModel){
const runtimeAdditions = {
totalReferralCount:{ type:Number, default:0 },
referral100Count:{ type:Number, default:0 },
referral150Count:{ type:Number, default:0 },
referral200Count:{ type:Number, default:0 },
currentCommission:{ type:Number, default:0 },
paymentStatus:{ type:String, enum:["pending","paid"], default:"pending" },
}

Object.entries(runtimeAdditions).forEach(([key,definition])=>{
if(!existingUserModel.schema.path(key)){
existingUserModel.schema.add({ [key]: definition })
}
})
}

export default existingUserModel ||
mongoose.model("User",UserSchema)