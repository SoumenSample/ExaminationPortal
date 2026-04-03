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


// // generate unique code for school/member
// let uniqueCode = null

// if(role === "school" || role === "member"){
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
import School from "@/models/School"
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
      addressLine1,
      addressLine2,
      district,
      pincode,
      state,
      aadhaar,
      password,
      referralCode,
      age,
      rollNo,
      section,
      class: studentClass,
      registrationSchool,
      registrationType,
      otp
    } = body
    
    const normalizedRole = typeof rawRole === "string"
      ? rawRole.trim().toLowerCase()
      : ""
    
    const role = (normalizedRole === "stuff" || normalizedRole === "staff") ? "member" : normalizedRole
    const normalizedReferralCodeInput = typeof referralCode === "string"
      ? referralCode.trim().toUpperCase()
      : ""
    let effectiveReferralCode = normalizedReferralCodeInput

    const normalizedAddressLine1 = typeof addressLine1 === "string" ? addressLine1.trim() : ""
    const normalizedAddressLine2 = typeof addressLine2 === "string" ? addressLine2.trim() : ""
    const normalizedDistrict = typeof district === "string" ? district.trim() : ""
    const normalizedState = typeof state === "string" ? state.trim() : ""
    const normalizedPincode = typeof pincode === "string" ? pincode.trim() : ""
    
    let referrerId = null
    
    if(!["school","member","student"].includes(role)){
      return Response.json(
        {message:"Invalid role"},
        {status:400}
      )
    }

    if(!normalizedAddressLine1 || !normalizedAddressLine2 || !normalizedDistrict || !normalizedPincode || !normalizedState){
      return Response.json(
        {message:"Address Line 1, Address Line 2, District, Pincode and State are required"},
        {status:400}
      )
    }

    if(!/^\d{6}$/.test(normalizedPincode)){
      return Response.json(
        {message:"Pincode must be a 6-digit number"},
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
      if(!age || !studentClass || !rollNo || !section){
        return Response.json(
          {message:"Age, Class, Roll No and Section are required for student registration"},
          {status:400}
        )
      }
    }

    const normalizedRollNo = typeof rollNo === "string" ? rollNo.trim() : ""
    const normalizedSection = typeof section === "string" ? section.trim() : ""

    if(role === "student" && registrationType === "school"){
      if(!registrationSchool){
        return Response.json(
          {message:"Please select a school for school registration"},
          {status:400}
        )
      }

      let schoolUser = await User.findOne({ _id: registrationSchool, role: "school" })
        .select("_id email name uniqueCode referralCode")

      if(!schoolUser){
        const schoolDoc = await School.findById(registrationSchool).select("email name")

        if(schoolDoc){
          schoolUser = await User.findOne({
            role: "school",
            $or: [
              { email: schoolDoc.email },
              { name: schoolDoc.name },
            ],
          }).select("_id email name uniqueCode referralCode")
        }
      }

      if(!schoolUser){
        return Response.json(
          {message:"Selected school does not have a referral code yet"},
          {status:400}
        )
      }

      effectiveReferralCode = (schoolUser.uniqueCode || schoolUser.referralCode || "").trim().toUpperCase()

      if(!effectiveReferralCode){
        return Response.json(
          {message:"Selected school referral code is unavailable"},
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
    if(role === "student" && effectiveReferralCode){
      const referrer = await User.findOne({
        role: { $in: ["school","member","staff"] },
        $or: [
          { uniqueCode: effectiveReferralCode },
          { referralCode: effectiveReferralCode }
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
    
    // generate referral code for member or school
    if(role === "school" || role === "member"){
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
    const combinedAddress = [
      normalizedAddressLine1,
      normalizedAddressLine2,
      normalizedDistrict,
      normalizedPincode,
      normalizedState,
    ].join(", ")

    const user = await User.create({
      role,
      name,
      email,
      phone,
      address: combinedAddress || address,
      addressLine1: normalizedAddressLine1,
      addressLine2: normalizedAddressLine2,
      district: normalizedDistrict,
      pincode: normalizedPincode,
      state: normalizedState,
      aadhaar,
      age: role === "student" ? age : null,
      rollNo: role === "student" ? normalizedRollNo : null,
      section: role === "student" ? normalizedSection : null,
      class: role === "student" ? studentClass : null,
      registrationSchool: role === "student" && registrationSchool ? registrationSchool : null,
      registrationType: role === "student" ? registrationType || "individual" : null,
      registrationFee: role === "student" ? registrationFee : 0,
      emailVerified: role === "student" ? true : false,
      
      ...(role !== "student" ? { uniqueCode: generatedCode } : {}),
      referralCode: role === "student"
        ? effectiveReferralCode || null
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