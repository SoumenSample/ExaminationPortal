import { connectDB } from "../../../../lib/db"
import OTP from "@/models/OTP"

export async function POST(req) {
  try {
    await connectDB()
    
    const { email, otp, role } = await req.json()
    
    if (!email || !otp) {
      return Response.json(
        { message: "Email and OTP are required" },
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
    
    // Find OTP record
    const otpRecord = await OTP.findOne({ email, role: normalizedRole })
    
    if (!otpRecord) {
      return Response.json(
        { message: "OTP not found. Please request a new OTP." },
        { status: 400 }
      )
    }
    
    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id })
      return Response.json(
        { message: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      )
    }
    
    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id })
      return Response.json(
        { message: "Maximum OTP attempts exceeded. Please request a new OTP." },
        { status: 400 }
      )
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      // Increment attempts
      await OTP.findByIdAndUpdate(
        otpRecord._id,
        { $inc: { attempts: 1 } }
      )
      
      return Response.json(
        { message: "Invalid OTP. Please try again." },
        { status: 400 }
      )
    }
    
    // OTP verified successfully
    await OTP.findByIdAndUpdate(
      otpRecord._id,
      { verified: true }
    )
    
    return Response.json({
      message: "OTP verified successfully",
      verified: true
    })
    
  } catch (error) {
    console.error("Verify OTP Error:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
