import { connectDB } from "@/lib/db"
import User from "@/models/User"
import School from "@/models/School"

export async function GET(req) {
  try {
    await connectDB()

    // Build report from students and resolve school details from both collections:
    // 1) School collection
    // 2) User collection where role is school
    const schoolReport = await User.aggregate([
      {
        $match: {
          role: "student",
          registrationSchool: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$registrationSchool",
          studentCount: { $sum: 1 },
          totalFeeCollected: { $sum: "$registrationFee" },
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "schoolDoc",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { schoolId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ["$_id", "$$schoolId"] }, { $eq: ["$role", "school"] }] },
              },
            },
          ],
          as: "schoolUser",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { schoolId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$registrationSchool", "$$schoolId"] },
                    { $eq: ["$role", "student"] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                class: 1,
                rollNo: 1,
                section: 1,
              },
            },
            {
              $sort: { name: 1 },
            },
          ],
          as: "students",
        },
      },
      {
        $project: {
          _id: 0,
          schoolId: "$_id",
          schoolName: {
            $ifNull: [{ $arrayElemAt: ["$schoolDoc.name", 0] }, { $arrayElemAt: ["$schoolUser.name", 0] }],
          },
          schoolRegistrationId: {
            $ifNull: [
              { $arrayElemAt: ["$schoolDoc.registrationNumber", 0] },
              { $arrayElemAt: ["$schoolUser.schoolRegistrationId", 0] }
            ],
          },
          schoolAddress: {
            $ifNull: [{ $arrayElemAt: ["$schoolDoc.address", 0] }, { $arrayElemAt: ["$schoolUser.address", 0] }],
          },
          schoolCity: { $ifNull: [{ $arrayElemAt: ["$schoolDoc.city", 0] }, ""] },
          studentCount: 1,
          totalFeeCollected: 1,
          students: 1,
        },
      },
      {
        $sort: { studentCount: -1 },
      },
    ])
    
    // Add individual registration count
    const individualStudents = await User.countDocuments({
      role: "student",
      registrationSchool: null,
      registrationType: "individual"
    })
    
    return Response.json({
      success: true,
      schoolReport,
      individualRegistrations: individualStudents
    })
  } catch (error) {
    console.error("Error generating school report:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
