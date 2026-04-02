import { connectDB } from "@/lib/db"
import User from "@/models/User"
import StaffActivity from "@/models/StaffActivity"

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const staffId = searchParams.get("staffId")

    const staffList = await User.find({ role: "staff" })
      .select("_id name email phone")
      .sort({ name: 1 })
      .lean()

    const query = {}
    if (staffId) {
      query.staffId = staffId
    }

    const rows = await StaffActivity.find(query)
      .populate("staffId", "name email phone")
      .sort({ activityDate: -1, createdAt: -1 })
      .lean()

    const activities = rows.map((row) => ({
      _id: String(row._id),
      date: row.dateKey,
      checkIn: row.checkIn || "",
      checkOut: row.checkOut || "",
      report: row.report || "",
      updatedAt: row.updatedAt,
      staff: row.staffId
        ? {
            _id: String(row.staffId._id),
            name: row.staffId.name || "",
            email: row.staffId.email || "",
            phone: row.staffId.phone || "",
          }
        : null,
    }))

    return Response.json({
      staff: staffList.map((s) => ({
        _id: String(s._id),
        name: s.name || "",
        email: s.email || "",
        phone: s.phone || "",
      })),
      activities,
    })
  } catch (error) {
    return Response.json({ message: error.message || "Failed to load staff activity" }, { status: 500 })
  }
}
