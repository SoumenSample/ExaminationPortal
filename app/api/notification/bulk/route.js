import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();

    const { recipientIds, title, message, type, relatedLink } =
      await req.json();

    if (!recipientIds || !Array.isArray(recipientIds) || !title || !message) {
      return Response.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify all recipients exist
    const users = await User.find({ _id: { $in: recipientIds } });
    if (users.length !== recipientIds.length) {
      return Response.json(
        { message: "One or more users not found" },
        { status: 404 }
      );
    }

    const notifications = recipientIds.map((id) => ({
      recipientId: id,
      title,
      message,
      type: type || "info",
      relatedLink,
      createdBy: "admin",
    }));

    const result = await Notification.insertMany(notifications);

    return Response.json(
      {
        message: `${result.length} notifications created`,
        count: result.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return Response.json(
      { message: "Failed to create notifications" },
      { status: 500 }
    );
  }
}
