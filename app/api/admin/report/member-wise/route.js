import { connectDB } from "@/lib/db"
import User from "@/models/User"

export async function GET(req) {
  try {
    await connectDB()
    
    // Include both new role (member) and legacy role (staff).
    const MemberReport = await User.aggregate([
      {
        $match: {
          role: { $in: ["member", "staff"] }
        }
      },
      {
        $lookup: {
          from: "users",
          let: { memberId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$referredBy", "$$memberId"] },
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
    
    // Also get school member (if role exists as school that manages students)
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
      memberReport: MemberReport,
      MemberReport,
      schoolReport
    })
  } catch (error) {
    console.error("Error generating member report:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
