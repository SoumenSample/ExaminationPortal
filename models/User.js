import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({

role:{
type:String,
enum:["school","member","student"],
required:true
},

name:String,
email:String,
phone:String,
address:String,
addressLine1:{
type:String,
required:function(){return ["school","member","student"].includes(this.role)}
},
addressLine2:{
type:String,
required:function(){return ["school","member","student"].includes(this.role)}
},
bankDetails:{
type:String,
default:""
},
district:{
type:String,
required:function(){return ["school","member","student"].includes(this.role)}
},
pincode:{
type:String,
required:function(){return ["school","member","student"].includes(this.role)}
},
state:{
type:String,
required:function(){return ["school","member","student"].includes(this.role)}
},
schoolRegistrationId:{
type:String,
required:function(){return this.role === "school"},
default:""
},
aadhaar:{
type:String,
required:function(){return this.role === "member"}
},

// New fields for students
age:{
type:Number,
required:function(){return this.role === "student"}
},
rollNo:{
type:String,
required:function(){return this.role === "student"}
},
section:{
type:String,
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
enum:["school","member","individual"],
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
commissionPayouts:[{
amount:{
type:Number,
default:0
},
paidAt:{
type:Date,
default:Date.now
},
paymentStatus:{
type:String,
enum:["paid"],
default:"paid"
}
}],

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
addressLine1:{ type:String, default:"" },
addressLine2:{ type:String, default:"" },
district:{ type:String, default:"" },
pincode:{ type:String, default:"" },
state:{ type:String, default:"" },
schoolRegistrationId:{ type:String, default:"" },
bankDetails:{ type:String, default:"" },
rollNo:{ type:String, default:"" },
section:{ type:String, default:"" },
commissionPayouts:{ type:[{ amount:{ type:Number, default:0 }, paidAt:{ type:Date, default:Date.now }, paymentStatus:{ type:String, enum:["paid"], default:"paid" } }], default:[] },
}

Object.entries(runtimeAdditions).forEach(([key,definition])=>{
if(!existingUserModel.schema.path(key)){
existingUserModel.schema.add({ [key]: definition })
}
})
}

export default existingUserModel ||
mongoose.model("User",UserSchema)