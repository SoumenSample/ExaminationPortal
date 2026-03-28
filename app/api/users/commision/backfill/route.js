import { connectDB } from "@/lib/db"
import User from "@/models/User"

function getCommissionFromFee(fee) {
  const amount = Number(fee || 0)
  if (amount === 100) return 5
  if (amount === 150) return 10
  if (amount === 200) return 15
  return 0
}

export async function POST(req) {
  try {
    await connectDB()

    const body = await req.json().catch(() => ({}))
    const dryRun = Boolean(body?.dryRun)

    const referrers = await User.find({ role: { $in: ["staff", "school"] } })
      .select("_id email role referralCode uniqueCode")
      .lean()

    const referrerIds = referrers.map((r) => r._id)

    const referralCodes = referrers
      .flatMap((r) => [r.referralCode, r.uniqueCode])
      .filter(Boolean)

    const codeToReferrerMap = new Map()
    for (const referrer of referrers) {
      if (referrer.referralCode) {
        codeToReferrerMap.set(String(referrer.referralCode).toUpperCase(), String(referrer._id))
      }
      if (referrer.uniqueCode) {
        codeToReferrerMap.set(String(referrer.uniqueCode).toUpperCase(), String(referrer._id))
      }
    }

    const students = await User.find({
      role: "student",
      $or: [
        { referredBy: { $in: referrerIds } },
        { referralCode: { $in: referralCodes } },
      ],
    })
      .select("referredBy referralCode registrationFee")
      .lean()

    const statsMap = new Map()

    for (const student of students) {
      const referrerId = student.referredBy
        ? String(student.referredBy)
        : codeToReferrerMap.get(String(student.referralCode || "").toUpperCase())

      if (!referrerId) continue
      const fee = Number(student.registrationFee || 0)

      if (!statsMap.has(referrerId)) {
        statsMap.set(referrerId, {
          referral100Count: 0,
          referral150Count: 0,
          referral200Count: 0,
          referralCount: 0,
          totalReferralCount: 0,
          totalCommission: 0,
          currentCommission: 0,
        })
      }

      const stats = statsMap.get(referrerId)

      if (fee === 100) stats.referral100Count += 1
      if (fee === 150) stats.referral150Count += 1
      if (fee === 200) stats.referral200Count += 1

      stats.referralCount += 1
      stats.totalReferralCount += 1

      const commission = getCommissionFromFee(fee)
      stats.currentCommission += commission
      stats.totalCommission += commission
    }

    const bulkOps = []

    for (const referrer of referrers) {
      const referrerId = String(referrer._id)
      const stats = statsMap.get(referrerId) || {
        referral100Count: 0,
        referral150Count: 0,
        referral200Count: 0,
        referralCount: 0,
        totalReferralCount: 0,
        totalCommission: 0,
        currentCommission: 0,
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: referrer._id },
          update: {
            $set: {
              referral100Count: stats.referral100Count,
              referral150Count: stats.referral150Count,
              referral200Count: stats.referral200Count,
              referralCount: stats.referralCount,
              totalReferralCount: stats.totalReferralCount,
              totalCommission: stats.totalCommission,
              currentCommission: stats.currentCommission,
              paymentStatus: "pending",
            },
          },
        },
      })
    }

    if (!dryRun && bulkOps.length > 0) {
      await User.bulkWrite(bulkOps)
    }

    return Response.json({
      success: true,
      dryRun,
      referrersFound: referrers.length,
      referredStudentsFound: students.length,
      updatedReferrers: dryRun ? 0 : bulkOps.length,
      sample: Array.from(statsMap.entries()).slice(0, 5).map(([referrerId, stats]) => ({
        referrerId,
        ...stats,
      })),
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
