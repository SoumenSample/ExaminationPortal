import { connectDB } from "@/lib/db"
import User from "@/models/User"
import { getAgeSlabFromAge } from "@/lib/utils"
import {
  buildClearSessionCookie,
  getSessionTokenFromRequest,
  verifySessionToken,
} from "@/lib/session"

export async function GET(req) {
  try {
    const token = getSessionTokenFromRequest(req)
    const payload = verifySessionToken(token)

    if (!payload?.sub) {
      return Response.json(
        { message: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Set-Cookie": buildClearSessionCookie(),
          },
        }
      )
    }

    await connectDB()

    const user = await User.findById(payload.sub).lean()

    if (!user) {
      return Response.json(
        { message: "Session user not found" },
        {
          status: 401,
          headers: {
            "Set-Cookie": buildClearSessionCookie(),
          },
        }
      )
    }

    if (user.isBlocked) {
      return Response.json(
        { message: "Your account has been blocked. Please contact support." },
        {
          status: 403,
          headers: {
            "Set-Cookie": buildClearSessionCookie(),
          },
        }
      )
    }

    return Response.json({
      user: {
        _id: String(user._id),
        role: user.role,
        name: user.name,
        age: user.age,
        ageSlab: user.role === "student" ? getAgeSlabFromAge(user.age) : null,
        class: user.class,
        rollNo: user.rollNo,
        section: user.section,
        email: user.email,
        phone: user.phone,
        address: user.address,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        district: user.district,
        pincode: user.pincode,
        state: user.state,
        bankDetails: user.bankDetails || "",
        aadhaar: user.aadhaar,
        uniqueCode: user.uniqueCode,
        currentCommission: user.currentCommission || 0,
        totalCommission: user.totalCommission || 0,
        totalReferralCount: user.totalReferralCount || 0,
        paymentStatus: user.paymentStatus || "pending",
      },
    })
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  return Response.json(
    { message: "Logged out" },
    {
      headers: {
        "Set-Cookie": buildClearSessionCookie(),
      },
    }
  )
}
