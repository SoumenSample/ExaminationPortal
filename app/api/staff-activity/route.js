import { connectDB } from "@/lib/db"
import User from "@/models/User"
import StaffActivity from "@/models/StaffActivity"

function normalizeDateKey(value) {
  if (!value) return ""
  const str = String(value).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : ""
}

function normalizeTime(value) {
  if (!value) return ""
  const str = String(value).trim()
  return /^\d{2}:\d{2}$/.test(str) ? str : ""
}

function getServerDateTimeParts() {
  const now = new Date()
  const dateKey = now.toLocaleDateString("en-CA")
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return { dateKey, time }
}

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ message: "userId is required" }, { status: 400 })
    }

    const staff = await User.findById(userId).select("_id role name")

    if (!staff || staff.role !== "staff") {
      return Response.json({ message: "Only staff users are allowed" }, { status: 403 })
    }

    const rows = await StaffActivity.find({ staffId: staff._id })
      .sort({ activityDate: -1, createdAt: -1 })
      .lean()

    const activities = rows.map((row) => ({
      _id: String(row._id),
      date: row.dateKey,
      checkIn: row.checkIn || "",
      checkOut: row.checkOut || "",
      report: row.report || "",
      updatedAt: row.updatedAt,
    }))

    return Response.json({
      staff: { _id: String(staff._id), name: staff.name || "" },
      activities,
    })
  } catch (error) {
    return Response.json({ message: error.message || "Failed to load staff activity" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await connectDB()

    const body = await req.json()

    const userId = body?.userId
    const dateKey = normalizeDateKey(body?.date)
    const checkIn = normalizeTime(body?.checkIn)
    const checkOut = normalizeTime(body?.checkOut)
    const report = typeof body?.report === "string" ? body.report.trim() : ""

    if (!userId) {
      return Response.json({ message: "userId is required" }, { status: 400 })
    }

    if (!dateKey) {
      return Response.json({ message: "Valid date is required" }, { status: 400 })
    }

    if (!checkIn && !checkOut && !report) {
      return Response.json(
        { message: "Please add check in/check out/report before saving" },
        { status: 400 }
      )
    }

    const staff = await User.findById(userId).select("_id role")

    if (!staff || staff.role !== "staff") {
      return Response.json({ message: "Only staff users are allowed" }, { status: 403 })
    }

    const activityDate = new Date(`${dateKey}T00:00:00.000Z`)

    const saved = await StaffActivity.findOneAndUpdate(
      { staffId: staff._id, dateKey },
      {
        $set: {
          activityDate,
          dateKey,
          checkIn,
          checkOut,
          report,
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).lean()

    return Response.json({
      message: "Staff activity saved",
      activity: {
        _id: String(saved._id),
        date: saved.dateKey,
        checkIn: saved.checkIn || "",
        checkOut: saved.checkOut || "",
        report: saved.report || "",
        updatedAt: saved.updatedAt,
      },
    })
  } catch (error) {
    return Response.json({ message: error.message || "Failed to save staff activity" }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    await connectDB()

    const body = await req.json()
    const userId = body?.userId
    const action = typeof body?.action === "string" ? body.action.trim().toLowerCase() : ""

    if (!userId) {
      return Response.json({ message: "userId is required" }, { status: 400 })
    }

    if (!["check-in", "check-out"].includes(action)) {
      return Response.json({ message: "action must be check-in or check-out" }, { status: 400 })
    }

    const staff = await User.findById(userId).select("_id role")

    if (!staff || staff.role !== "staff") {
      return Response.json({ message: "Only staff users are allowed" }, { status: 403 })
    }

    const { dateKey, time } = getServerDateTimeParts()
    const activityDate = new Date(`${dateKey}T00:00:00.000Z`)

    if (action === "check-in") {
      const savedCheckIn = await StaffActivity.findOneAndUpdate(
        { staffId: staff._id, dateKey },
        {
          $set: {
            staffId: staff._id,
            activityDate,
            dateKey,
            checkIn: time,
          },
        },
        { new: true, upsert: true, runValidators: true }
      ).lean()

      return Response.json({
        message: "Check in saved",
        activity: {
          _id: String(savedCheckIn._id),
          date: savedCheckIn.dateKey,
          checkIn: savedCheckIn.checkIn || "",
          checkOut: savedCheckIn.checkOut || "",
          report: savedCheckIn.report || "",
          updatedAt: savedCheckIn.updatedAt,
        },
      })
    }

    const existing = await StaffActivity.findOne({ staffId: staff._id, dateKey })

    if (!existing || !existing.checkIn) {
      return Response.json({ message: "Please check in first" }, { status: 400 })
    }

    existing.checkOut = time
    await existing.save()

    return Response.json({
      message: "Check out saved",
      activity: {
        _id: String(existing._id),
        date: existing.dateKey,
        checkIn: existing.checkIn || "",
        checkOut: existing.checkOut || "",
        report: existing.report || "",
        updatedAt: existing.updatedAt,
      },
    })
  } catch (error) {
    return Response.json({ message: error.message || "Failed to save attendance" }, { status: 500 })
  }
}
