import { NextResponse } from "next/server"
import { connectDB } from "../../../lib/db"
import Item from "../../../models/topper"

// CREATE
export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()

    const item = await Item.create(body)

    return NextResponse.json(item)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET
export async function GET() {
  try {
    await connectDB()

    const items = await Item.find().sort({ createdAt: -1 })

    return NextResponse.json(items)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}