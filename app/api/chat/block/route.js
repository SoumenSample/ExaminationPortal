import { connectDB } from "@/lib/db"
import User from "@/models/User"

export async function POST(req) {
  try {
    await connectDB()
    
    const { userEmailToBlock, blockedBy, blockReason } = await req.json()
    
    if (!userEmailToBlock || !blockedBy) {
      return Response.json(
        { error: "User email and blockedBy admin email are required" },
        { status: 400 }
      )
    }
    
    // Update user's isBlocked status
    const user = await User.findOneAndUpdate(
      { email: userEmailToBlock },
      {
        isBlocked: true,
        blockedReason: blockReason || "Blocked by admin"
      },
      { new: true }
    )
    
    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    return Response.json({
      success: true,
      message: `User ${userEmailToBlock} has been blocked`,
      user
    })
  } catch (error) {
    console.error("Error blocking user:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    await connectDB()
    
    const { userEmailToUnblock } = await req.json()
    
    if (!userEmailToUnblock) {
      return Response.json(
        { error: "User email is required" },
        { status: 400 }
      )
    }
    
    // Unblock user
    const user = await User.findOneAndUpdate(
      { email: userEmailToUnblock },
      {
        isBlocked: false,
        blockedReason: null
      },
      { new: true }
    )
    
    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    return Response.json({
      success: true,
      message: `User ${userEmailToUnblock} has been unblocked`,
      user
    })
  } catch (error) {
    console.error("Error unblocking user:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
