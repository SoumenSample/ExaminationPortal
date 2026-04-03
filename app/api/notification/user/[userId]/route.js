import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const userId = resolvedParams?.userId;

    if (!userId) {
      return Response.json(
        { message: "User id is required" },
        { status: 400 }
      );
    }

    // Fetch notifications for the user
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 });

    return Response.json(notifications);
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return Response.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
