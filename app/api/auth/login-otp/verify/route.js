import { connectDB } from "../../../../../lib/db"
import OTP from "@/models/OTP"
import User from "@/models/User"
import { buildSessionCookie, createSessionToken } from "@/lib/session"

function buildUserLoginResponse(user) {
  const baseResponse = {
    message: "Login successful",
    userId: user._id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role
  }

  if (user.role === "student") {
    return {
      ...baseResponse,
      age: user.age,
      class: user.class,
      registrationType: user.registrationType,
      registrationFee: user.registrationFee
    }
  }

  return {
    ...baseResponse,
    referralCode: user.referralCode
  }
}

export async function POST(req) {
  try {
    await connectDB()

    const { loginId, otp } = await req.json()
    const normalizedLoginId = typeof loginId === "string" ? loginId.trim() : ""
    const normalizedOtp = otp ? otp.toString().trim() : ""

    if (!normalizedLoginId || !normalizedOtp) {
      return Response.json(
        { message: "Email or phone and OTP are required" },
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

    const otpRecord = await OTP.findOne({ email: user.email, role: user.role })

    if (!otpRecord) {
      return Response.json(
        { message: "OTP not found. Please request a new OTP." },
        { status: 400 }
      )
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id })
      return Response.json(
        { message: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      )
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id })
      return Response.json(
        { message: "Maximum OTP attempts exceeded. Please request a new OTP." },
        { status: 400 }
      )
    }

    if (otpRecord.otp !== normalizedOtp) {
      await OTP.findByIdAndUpdate(
        otpRecord._id,
        { $inc: { attempts: 1 } }
      )

      return Response.json(
        { message: "Invalid OTP. Please try again." },
        { status: 400 }
      )
    }

    await OTP.deleteOne({ _id: otpRecord._id })

    const responseBody = buildUserLoginResponse(user)
    const sessionToken = createSessionToken({ userId: user._id, role: user.role })

    return Response.json(responseBody, {
      headers: {
        "Set-Cookie": buildSessionCookie(sessionToken),
      },
    })
  } catch (error) {
    console.error("Verify Login OTP Error:", error)
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
