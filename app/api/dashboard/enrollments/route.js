import { connectDB } from "@/lib/db"
import User from "@/models/User"

function buildEnrollmentQuery(owner) {
  if (!owner || !owner._id) {
    return { _id: null }
  }

  const filters = [
    { referredBy: owner._id },
  ]

  if (owner.uniqueCode) {
    filters.push({ referralCode: owner.uniqueCode })
  }

  if (owner.role === "school") {
    filters.push({ registrationSchool: owner._id })
  }

  return {
    role: "student",
    $or: filters,
  }
}

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ message: "userId is required" }, { status: 400 })
    }

    const owner = await User.findById(userId).select("_id role name uniqueCode")

    if (!owner) {
      return Response.json({ message: "User not found" }, { status: 404 })
    }

    if (!["school", "staff"].includes(owner.role)) {
      return Response.json({ message: "Only school or staff users are allowed" }, { status: 403 })
    }

    const students = await User.find(buildEnrollmentQuery(owner))
      .select("name email registrationFee commissionPerReferral createdAt class age rollNo section")
      .sort({ createdAt: -1 })
      .lean()

    const summary = students.reduce(
      (acc, student) => {
        acc.totalStudents += 1
        acc.totalRegistrationAmount += Number(student.registrationFee || 0)
        acc.totalCommission += Number(student.commissionPerReferral || 0)
        return acc
      },
      { totalStudents: 0, totalRegistrationAmount: 0, totalCommission: 0 }
    )

    const rows = students.map((student) => ({
      _id: String(student._id),
      name: student.name || "Unnamed student",
      email: student.email || "",
      class: student.class || "",
      age: student.age || null,
      rollNo: student.rollNo || "",
      section: student.section || "",
      registrationAmount: Number(student.registrationFee || 0),
      commissionAmount: Number(student.commissionPerReferral || 0),
      enrolledAt: student.createdAt,
    }))

    return Response.json({
      owner: {
        _id: String(owner._id),
        name: owner.name || "",
        role: owner.role,
      },
      summary,
      students: rows,
    })
  } catch (error) {
    return Response.json({ message: error.message || "Failed to load enrollments" }, { status: 500 })
  }
}
