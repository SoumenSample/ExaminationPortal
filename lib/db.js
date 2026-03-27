import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

mongoose.set("strictQuery", true)

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null }
}

export async function connectDB() {

  if (!MONGODB_URI) {
    throw new Error("Missing environment variable: MONGODB_URI")
  }

  if (global.mongoose.conn) return global.mongoose.conn

  if (!global.mongoose.promise) {

    global.mongoose.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })

  }

  try {
    global.mongoose.conn = await global.mongoose.promise
  } catch (error) {
    global.mongoose.promise = null
    global.mongoose.conn = null
    throw error
  }

  return global.mongoose.conn
}