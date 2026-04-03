import { connectDB } from "@/lib/db"
import Result from "@/models/Result"
import Question from "@/models/Question"

function toNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export async function GET() {
  try {
    await connectDB()

    const [results, questions] = await Promise.all([
      Result.find({}).sort({ createdAt: -1 }),
      Question.find({}).select("question type marks").lean(),
    ])

    const questionMetaMap = new Map(
      questions.map((item) => [
        String(item.question || "").trim().toLowerCase(),
        {
          type: item.type,
          marks: toNumber(item.marks, 0),
        },
      ])
    )

    const normalizedResults = results.map((resultDoc) => {
      const result = resultDoc.toObject()
      const currentAnswers = Array.isArray(result.answers) ? result.answers : []

      result.answers = currentAnswers.map((row) => {
        const key = String(row?.question || "").trim().toLowerCase()
        const questionMeta = questionMetaMap.get(key)

        const inferredType = row?.type || questionMeta?.type || "mcq"
        const inferredMaxMarks = Math.max(
          0,
          toNumber(row?.maxMarks, toNumber(questionMeta?.marks, 0))
        )

        return {
          ...row,
          type: inferredType,
          maxMarks: inferredMaxMarks,
          autoAwardedMarks:
            inferredType === "mcq"
              ? toNumber(row?.autoAwardedMarks, toNumber(row?.awardedMarks, 0))
              : toNumber(row?.autoAwardedMarks, 0),
          awardedMarks: toNumber(row?.awardedMarks, 0),
        }
      })

      return result
    })

    return Response.json({ results: normalizedResults })
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    await connectDB()

    const body = await req.json()
    const action = typeof body?.action === "string" ? body.action.trim() : ""

    if (action === "publishAll") {
      const updateResult = await Result.updateMany({}, { isPublished: true })
      return Response.json({
        message: "All results published",
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
      })
    }

    if (action === "publishOne") {
      const resultId = body?.resultId

      if (!resultId) {
        return Response.json({ message: "Result id is required" }, { status: 400 })
      }

      const updated = await Result.findByIdAndUpdate(
        resultId,
        { isPublished: true },
        { new: true }
      )

      if (!updated) {
        return Response.json({ message: "Result not found" }, { status: 404 })
      }

      return Response.json({
        message: "Result published",
        result: updated,
      })
    }

    if (action === "evaluate") {
      const resultId = body?.resultId

      if (!resultId) {
        return Response.json({ message: "Result id is required" }, { status: 400 })
      }

      const result = await Result.findById(resultId)

      if (!result) {
        return Response.json({ message: "Result not found" }, { status: 404 })
      }

      const reviewRows = Array.isArray(body?.answers) ? body.answers : []
      const reviewByIndex = new Map(
        reviewRows
          .filter((item) => Number.isInteger(item?.index))
          .map((item) => [item.index, toNumber(item.awardedMarks, 0)])
      )

      const questions = await Question.find({}).select("question type marks").lean()
      const questionMetaMap = new Map(
        questions.map((item) => [
          String(item.question || "").trim().toLowerCase(),
          {
            type: item.type,
            marks: toNumber(item.marks, 0),
          },
        ])
      )

      const existingAnswers = Array.isArray(result.answers) ? result.answers : []
      const updatedAnswers = existingAnswers.map((item, index) => {
        const key = String(item?.question || "").trim().toLowerCase()
        const questionMeta = questionMetaMap.get(key)

        const type =
          (item?.type || questionMeta?.type) === "descriptive" ? "descriptive" : "mcq"
        const maxMarks = Math.max(
          0,
          toNumber(item?.maxMarks, toNumber(questionMeta?.marks, 0))
        )

        if (type === "descriptive") {
          const rawMarks = reviewByIndex.has(index)
            ? reviewByIndex.get(index)
            : toNumber(item?.awardedMarks, 0)
          const awardedMarks = clamp(rawMarks, 0, maxMarks)

          return {
            ...item,
            awardedMarks,
            reviewedByAdmin: true,
          }
        }

        const autoMarks = toNumber(item?.autoAwardedMarks, toNumber(item?.awardedMarks, 0))
        const awardedMarks = clamp(autoMarks, 0, maxMarks)

        return {
          ...item,
          awardedMarks,
        }
      })

      const totalMarks = updatedAnswers.reduce(
        (sum, item) => sum + Math.max(0, toNumber(item?.maxMarks, 0)),
        0
      )

      const score = updatedAnswers.reduce(
        (sum, item) => sum + Math.max(0, toNumber(item?.awardedMarks, 0)),
        0
      )

      result.answers = updatedAnswers
      result.totalMarks = totalMarks
      result.score = score

      if (body?.publish === true) {
        result.isPublished = true
      }

      await result.save()

      return Response.json({
        message: "Result evaluation saved",
        result,
      })
    }

    return Response.json({ message: "Invalid action" }, { status: 400 })
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 })
  }
}
