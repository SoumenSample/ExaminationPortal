import { connectDB } from "@/lib/db"
import User from "@/models/User"

export async function GET(req) {
  try {
    await connectDB()
    
    // Get all staff members with their student referral count and commission
    const staffReport = await User.aggregate([
      {
        $match: {
          role: "staff"
        }
      },
      {
        $lookup: {
          from: "users",
          let: { staffId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$referredBy", "$$staffId"] },
                role: "student"
              }
            }
          ],
          as: "referredStudents"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          totalStudentsReferred: { $ifNull: ["$totalReferralCount", { $size: "$referredStudents" }] },
          totalCommissionEarned: { $ifNull: ["$totalCommission", 0] },
          referralCode: 1,
          totalReferralCount: 1
        }
      },
      {
        $sort: { totalStudentsReferred: -1 }
      }
    ])
    
    // Also get school staff (if role exists as school that manages students)
    const schoolReport = await User.aggregate([
      {
        $match: {
          role: "school"
        }
      },
      {
        $lookup: {
          from: "users",
          let: { schoolId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$registrationSchool", "$$schoolId"] },
                role: "student"
              }
            }
          ],
          as: "registeredStudents"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          totalStudentsRegistered: { $size: "$registeredStudents" },
          totalCommissionEarned: { $ifNull: ["$totalCommission", 0] },
          referralCode: 1
        }
      },
      {
        $sort: { totalStudentsRegistered: -1 }
      }
    ])
    
    return Response.json({
      success: true,
      staffReport,
      schoolReport
    })
  } catch (error) {
    console.error("Error generating staff report:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
