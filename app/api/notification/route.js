import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const notifications = await Notification.find()
      .populate("recipientId", "name email role")
      .sort({ createdAt: -1 });

    return Response.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const { recipientId, title, message, type, relatedLink } = await req.json();

    if (!recipientId || !title || !message) {
      return Response.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const user = await User.findById(recipientId);
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const notification = new Notification({
      recipientId,
      title,
      message,
      type: type || "info",
      relatedLink,
      createdBy: "admin",
    });

    await notification.save();
    await notification.populate("recipientId", "name email role");

    return Response.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return Response.json(
      { message: "Failed to create notification" },
      { status: 500 }
    );
  }
}
