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
import OTP from "@/models/OTP"
import bcrypt from "bcryptjs"
import { calculateRegistrationFee, calculateCommission, generateTemporaryPassword } from "../../../../lib/utils"
import { sendLoginCredentialsEmail, sendReferralNotificationEmail } from "../../../../lib/emailService"

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
      referralCode,
      age,
      class: studentClass,
      registrationSchool,
      registrationType,
      otp
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
    
    // For all roles, verify OTP is provided
    if(!otp){
      return Response.json(
        {message:"OTP is required for registration"},
        {status:400}
      )
    }
    
    // Verify OTP for the given role
    const otpRecord = await OTP.findOne({ email, role, verified: true })
    if(!otpRecord){
      return Response.json(
        {message:"Email not verified. Please verify your email with OTP first."},
        {status:400}
      )
    }
    
    // For students, verify age and class
    if(role === "student"){
      if(!age || !studentClass){
        return Response.json(
          {message:"Age and Class are required for student registration"},
          {status:400}
        )
      }
    }
    
    // Mark OTP as used
    await OTP.deleteOne({ _id: otpRecord._id })
    
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
      }).select("_id email")
      
      if(!referrer){
        return Response.json(
          {message:"Referral code not found"},
          {status:400}
        )
      }
      
      referrerId = referrer._id
    }
    
    let generatedCode = null
    
    // generate referral code for staff or school
    if(role === "school" || role === "staff"){
      generatedCode = await generateUniqueCode(role)
    }
    
    // hash password
    const hashedPassword = await bcrypt.hash(password,10)
    
    // Calculate registration fee for students
    let registrationFee = 0
    let commissionAmount = 0
    
    if(role === "student"){
      registrationFee = calculateRegistrationFee(age)
      commissionAmount = calculateCommission(registrationFee)
    }

    if(role === "student" && referrerId){
      let referralBucketInc = {}

      if(registrationFee === 100) referralBucketInc.referral100Count = 1
      if(registrationFee === 150) referralBucketInc.referral150Count = 1
      if(registrationFee === 200) referralBucketInc.referral200Count = 1

      await User.findByIdAndUpdate(
        referrerId,
        {
          $inc: {
            referralCount: 1,
            totalReferralCount: 1,
            currentCommission: commissionAmount,
            totalCommission: commissionAmount,
            ...referralBucketInc,
          },
          $set: {
            paymentStatus: "pending"
          }
        }
      )
    }
    
    // create user
    const user = await User.create({
      role,
      name,
      email,
      phone,
      address,
      aadhaar,
      age: role === "student" ? age : null,
      class: role === "student" ? studentClass : null,
      registrationSchool: role === "student" && registrationSchool ? registrationSchool : null,
      registrationType: role === "student" ? registrationType || "individual" : null,
      registrationFee: role === "student" ? registrationFee : 0,
      emailVerified: role === "student" ? true : false,
      
      ...(role !== "student" ? { uniqueCode: generatedCode } : {}),
      referralCode: role === "student"
        ? normalizedReferralCode || null
        : generatedCode,
      referredBy: role === "student" ? referrerId : null,
      commissionPerReferral: role === "student" ? commissionAmount : 0,
      
      password: hashedPassword
    })
    
    // For students, send login credentials email
    if(role === "student"){
      // Get referrer if exists
      if(referrerId){
        const referrer = await User.findById(referrerId)
        if(referrer && referrer.email){
          await sendReferralNotificationEmail(
            referrer.email,
            name,
            commissionAmount
          )
        }
      }
      
      // Send credentials email
      await sendLoginCredentialsEmail(email, password, email)
    }
    
    return Response.json({
      message:"User created successfully",
      uniqueCode: generatedCode,
      referralCode: generatedCode,
      registrationFee: role === "student" ? registrationFee : 0,
      user
    })
    
  }catch(error){
    console.error("Signup Error:", error)
    return Response.json(
      {error:error.message},
      {status:500}
    )
  }
}