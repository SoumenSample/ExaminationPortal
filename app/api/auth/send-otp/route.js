import { connectDB } from "../../../../lib/db"
import OTP from "@/models/OTP"
import User from "@/models/User"
import { sendOTPEmail } from "../../../../lib/emailService"
import { generateOTP } from "../../../../lib/utils"

export async function POST(req) {
  try {
    await connectDB()
    
    const { email, role } = await req.json()
    
    if (!email) {
      return Response.json(
        { message: "Email is required" },
        { status: 400 }
      )
    }

    const normalizedRole = typeof role === "string"
      ? role.trim().toLowerCase()
      : "student"

    if (!["student", "staff", "school"].includes(normalizedRole)) {
      return Response.json(
        { message: "Invalid role" },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return Response.json(
        { message: "User already exists with this email" },
        { status: 400 }
      )
    }
    
    // Delete previous OTP if exists for this email+role
    await OTP.deleteOne({ email, role: normalizedRole })
    
    // Generate new OTP
    const otp = generateOTP()
    
    // Save OTP to database
    const otpDoc = await OTP.create({
      email,
      role: normalizedRole,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    })
    
    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp)
    
    if (!emailResult.success) {
      await OTP.deleteOne({ _id: otpDoc._id })
      return Response.json(
        { message: "Failed to send OTP. Please try again." },
        { status: 500 }
      )
    }
    
    return Response.json({
      message: "OTP sent successfully to your email",
      success: true
    })
    
  } catch (error) {
    console.error("Send OTP Error:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
