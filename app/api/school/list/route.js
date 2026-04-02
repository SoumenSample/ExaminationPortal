import { connectDB } from "../../../../lib/db"
import School from "@/models/School"
import User from "@/models/User"

export async function GET(req) {
  try {
    await connectDB()

    const [schoolDocs, schoolUsers] = await Promise.all([
      School.find({}).select("_id name address city email").lean(),
      User.find({ role: "school" }).select("_id name address email referralCode uniqueCode").lean(),
    ])

    // Merge schools from both collections; prefer School docs when same email/name exists.
    const merged = new Map()

    for (const s of schoolDocs) {
      const key = (s.email || s.name || s._id.toString()).toLowerCase()
      merged.set(key, {
        _id: s._id,
        name: s.name,
        address: s.address || "",
        city: s.city || "",
        referralCode: "",
      })
    }

    for (const u of schoolUsers) {
      const key = (u.email || u.name || u._id.toString()).toLowerCase()
      const referralCode = u.uniqueCode || u.referralCode || ""

      if (merged.has(key)) {
        const existing = merged.get(key)
        merged.set(key, {
          ...existing,
          referralCode,
          schoolUserId: u._id,
        })
      } else {
        merged.set(key, {
          _id: u._id,
          name: u.name,
          address: u.address || "",
          city: "",
          referralCode,
          schoolUserId: u._id,
        })
      }
    }

    const schools = Array.from(merged.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    )
    
    return Response.json({
      success: true,
      schools
    })
  } catch (error) {
    console.error("Error fetching schools:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
