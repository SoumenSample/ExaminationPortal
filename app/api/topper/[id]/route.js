import { connectDB } from "@/lib/db"
import Item from "@/models/topper"

export async function PATCH(req, { params }) {
  try {
    await connectDB()

    const resolvedParams = await params
    const id = resolvedParams?.id

    if (!id) {
      return Response.json({ message: "Topper id is required" }, { status: 400 })
    }

    const body = await req.json()

    const updatedTopper = await Item.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })

    if (!updatedTopper) {
      return Response.json({ message: "Topper not found" }, { status: 404 })
    }

    return Response.json(updatedTopper)
  } catch (error) {
    console.error("Error updating topper:", error)
    return Response.json({ message: "Failed to update topper" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB()

    const resolvedParams = await params
    const id = resolvedParams?.id

    if (!id) {
      return Response.json({ message: "Topper id is required" }, { status: 400 })
    }

    const topper = await Item.findByIdAndDelete(id)

    if (!topper) {
      return Response.json({ message: "Topper not found" }, { status: 404 })
    }

    return Response.json({ message: "Topper deleted successfully" })
  } catch (error) {
    console.error("Error deleting topper:", error)
    return Response.json({ message: "Failed to delete topper" }, { status: 500 })
  }
}