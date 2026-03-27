import { NextResponse } from "next/server"
import { connectDB } from "../../../lib/db"
import Payment from "../../../models/Payment"

// CREATE PAYMENT
export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()

    const payment = await Payment.create(body)

    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET PAYMENTS
export async function GET() {
  try {
    await connectDB()

    const payments = await Payment.find().sort({ createdAt: -1 })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}