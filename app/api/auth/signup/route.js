// import { connectDB } from "../../../../lib/db"
// import User from "@/models/User"
// import bcrypt from "bcryptjs"

// async function generateUniqueCode(role){
// const prefix = role === "school" ? "SCH" : "STF"

// for(let attempt = 0; attempt < 10; attempt++){
// const randomPart = Math.floor(100000 + Math.random() * 900000)
// const code = `${prefix}${randomPart}`

// const exists = await User.exists({ uniqueCode: code })

// if(!exists){
// return code
// }
// }

// throw new Error("Could not generate unique code. Please try again.")
// }

// export async function POST(req){

// try{

// await connectDB()

// const body = await req.json()

// const {role,name,email,phone,address,aadhaar,password} = body


// // check if user exists
// const existingUser = await User.findOne({ email })

// if(existingUser){
// return Response.json({message:"User already exists"}, {status:400})
// }


// // generate unique code for school/staff
// let uniqueCode = null

// if(role === "school" || role === "staff"){
// uniqueCode = await generateUniqueCode(role)

// }


// const hashedPassword = await bcrypt.hash(password,10)

// const user = await User.create({
// role,
// name,
// email,
// phone,
// address,
// aadhaar,
// uniqueCode,
// password:hashedPassword
// })



// return Response.json({
// message:"User created",
// uniqueCode,
// user
// })

// }catch(error){

// return Response.json({error:error.message}, {status:500})

// }

// }
import { connectDB } from "../../../../lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { navigate } from "next/dist/client/components/segment-cache/navigation"

async function generateUniqueCode(role){

const prefix = role === "school" ? "SCH" : "STF"

for(let attempt = 0; attempt < 10; attempt++){

const randomPart = Math.floor(100000 + Math.random() * 900000)

const code = `${prefix}${randomPart}`

const exists = await User.exists({ uniqueCode: code })

if(!exists){
return code
}

}

throw new Error("Could not generate unique code")

}

export async function POST(req){

try{

await connectDB()

const body = await req.json()

const {
role: rawRole,
name,
email,
phone,
address,
aadhaar,
password,
referralCode
} = body

const normalizedRole = typeof rawRole === "string"
? rawRole.trim().toLowerCase()
: ""

const role = normalizedRole === "stuff" ? "staff" : normalizedRole
const normalizedReferralCode = typeof referralCode === "string"
? referralCode.trim().toUpperCase()
: ""
let referrerId = null

if(!["school","staff","student"].includes(role)){
return Response.json(
{message:"Invalid role"},
{status:400}
)
}


// check if user already exists
const existingUser = await User.findOne({ email })

if(existingUser){
return Response.json(
{message:"User already exists"},
{status:400}
)
}


// CHECK REFERRAL CODE FOR STUDENT
if(role === "student" && normalizedReferralCode){

const referrer = await User.findOne({
role: { $in: ["school","staff"] },
$or: [
{ uniqueCode: normalizedReferralCode },
{ referralCode: normalizedReferralCode }
]
}).select("_id")

if(!referrer){
return Response.json(
{message:"Referral code not found"},
{status:400}
)
}

referrerId = referrer._id

await User.findByIdAndUpdate(
referrerId,
{ $inc: { referralCount: 1 } }
)

}


let generatedCode = null

// generate referral code for staff or school
if(role === "school" || role === "staff"){
generatedCode = await generateUniqueCode(role)
}


// hash password
const hashedPassword = await bcrypt.hash(password,10)


// create user
const user = await User.create({

role,
name,
email,
phone,
address,
aadhaar,

// students should not write null into unique indexed field
...(role !== "student" ? { uniqueCode: generatedCode } : {}),
referralCode: role === "student"
? normalizedReferralCode || null
: generatedCode,
referredBy: role === "student" ? referrerId : null,
referralCount: 0,

password: hashedPassword

})


return Response.json({
message:"User created successfully",
uniqueCode: generatedCode,
referralCode: generatedCode,
user

})

}catch(error){

return Response.json(
{error:error.message},
{status:500}
)

}

}