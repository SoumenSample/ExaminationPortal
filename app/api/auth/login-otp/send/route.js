import { connectDB } from "../../../../../lib/db"
import OTP from "@/models/OTP"
import User from "@/models/User"
import { sendOTPEmail } from "../../../../../lib/emailService"
import { generateOTP } from "../../../../../lib/utils"

export async function POST(req) {
  try {
    await connectDB()

    const { loginId } = await req.json()
    const normalizedLoginId = typeof loginId === "string" ? loginId.trim() : ""

    if (!normalizedLoginId) {
      return Response.json(
        { message: "Email or phone is required" },
        { status: 400 }
      )
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedLoginId },
        { phone: normalizedLoginId }
      ]
    })

    if (!user) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    if (user.isBlocked) {
      return Response.json(
        { message: "Your account has been blocked. Please contact support." },
        { status: 403 }
      )
    }

    if (!user.email) {
      return Response.json(
        { message: "No email is registered with this account" },
        { status: 400 }
      )
    }

    await OTP.deleteOne({ email: user.email, role: user.role })

    const otp = generateOTP()

    const otpDoc = await OTP.create({
      email: user.email,
      role: user.role,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    })

    const emailResult = await sendOTPEmail(user.email, otp)

    if (!emailResult.success) {
      await OTP.deleteOne({ _id: otpDoc._id })
      return Response.json(
        { message: "Failed to send OTP. Please try again." },
        { status: 500 }
      )
    }

    return Response.json({
      message: "OTP sent successfully to your registered email",
      success: true,
      email: user.email
    })
  } catch (error) {
    console.error("Send Login OTP Error:", error)
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
