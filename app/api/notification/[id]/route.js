import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return Response.json(
        { message: "Notification id is required" },
        { status: 400 }
      );
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return Response.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    return Response.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return Response.json(
      { message: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const { isRead } = await req.json();

    if (!id) {
      return Response.json(
        { message: "Notification id is required" },
        { status: 400 }
      );
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    ).populate("recipientId", "name email role");

    if (!notification) {
      return Response.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    return Response.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return Response.json(
      { message: "Failed to update notification" },
      { status: 500 }
    );
  }
}
