import { connectDB } from "@/lib/db"
import User from "@/models/User"
import MemberActivity from "@/models/memberActivity"

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const MemberId = searchParams.get("MemberId")

    const MemberList = await User.find({ role: { $in: ["member", "staff"] } })
      .select("_id name email phone")
      .sort({ name: 1 })
      .lean()

    const query = {}
    if (MemberId) {
      query.MemberId = MemberId
    }

    const rows = await MemberActivity.find(query)
      .populate("MemberId", "name email phone")
      .sort({ activityDate: -1, createdAt: -1 })
      .lean()

    const activities = rows.map((row) => ({
      _id: String(row._id),
      date: row.dateKey,
      checkIn: row.checkIn || "",
      checkOut: row.checkOut || "",
      report: row.report || "",
      updatedAt: row.updatedAt,
      member: row.MemberId
        ? {
            _id: String(row.MemberId._id),
            name: row.MemberId.name || "",
            email: row.MemberId.email || "",
            phone: row.MemberId.phone || "",
          }
        : null,
    }))

    return Response.json({
      member: MemberList.map((s) => ({
        _id: String(s._id),
        name: s.name || "",
        email: s.email || "",
        phone: s.phone || "",
      })),
      activities,
    })
  } catch (error) {
    return Response.json({ message: error.message || "Failed to load member activity" }, { status: 500 })
  }
}
