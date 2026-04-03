import { connectDB } from "../../../../lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { buildSessionCookie, createSessionToken } from "@/lib/session"

export async function POST(req){

try {

await connectDB()

const {loginId, password} = await req.json()
const normalizedLoginId = typeof loginId === "string" ? loginId.trim() : ""

if(!normalizedLoginId || !password){
  return Response.json(
    {message:"Login ID and password are required"},
    {status:400}
  )
}

// Try to find user by email or phone
const user = await User.findOne({
  role: "student",
  $or: [
    { email: normalizedLoginId },
    { phone: normalizedLoginId }
  ]
})

// If not found as student, try staff/school with any field
if(!user){
  const altUser = await User.findOne({
    $or: [
      { email: normalizedLoginId },
      { phone: normalizedLoginId }
    ]
  })
  
  if(!altUser){
    console.log("User not found with login ID:", normalizedLoginId)
    return Response.json(
      {message:"User not found"},
      {status:404}
    )
  }
  
  // Check if user is blocked
  if(altUser.isBlocked){
    return Response.json(
      {message:"Your account has been blocked. Please contact support."},
      {status:403}
    )
  }

  if(!altUser.password){
    return Response.json(
      {message:"Account is not configured for password login"},
      {status:400}
    )
  }
  
  const valid = await bcrypt.compare(password, altUser.password)
  
  if(!valid){
    return Response.json(
      {message:"Wrong password"},
      {status:401}
    )
  }
  
  const responseBody = {
    message:"Login successful",
    userId: altUser._id,
    email: altUser.email,
    phone: altUser.phone,
    name: altUser.name,
    role: altUser.role,
    referralCode: altUser.referralCode
  }

  const sessionToken = createSessionToken({ userId: altUser._id, role: altUser.role })
  return Response.json(responseBody, {
    headers: {
      "Set-Cookie": buildSessionCookie(sessionToken),
    },
  })
}

// Check if student is blocked
if(user.isBlocked){
  return Response.json(
    {message:"Your account has been blocked. Please contact support."},
    {status:403}
  )
}

// Check if email is verified for students
if(user.role === "student" && !user.emailVerified){
  return Response.json(
    {message:"Email not verified. Please verify your email first."},
    {status:403}
  )
}

if(!user.password){
  return Response.json(
    {message:"Account is not configured for password login"},
    {status:400}
  )
}

const valid = await bcrypt.compare(password, user.password)

if(!valid){
  return Response.json(
    {message:"Wrong password"},
    {status:401}
  )
}

const responseBody = {
  message:"Login successful",
  userId: user._id,
  email: user.email,
  phone: user.phone,
  name: user.name,
  role: user.role,
  age: user.age,
  class: user.class,
  registrationType: user.registrationType,
  registrationFee: user.registrationFee
}

const sessionToken = createSessionToken({ userId: user._id, role: user.role })

return Response.json(responseBody, {
  headers: {
    "Set-Cookie": buildSessionCookie(sessionToken),
  },
})

} catch (error) {
  console.error("Login API error:", error)
  return Response.json(
    {message:"Internal server error"},
    {status:500}
  )
}

}