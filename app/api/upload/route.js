import cloudinary from "@/lib/cloudinary"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "uploads" },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}