import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { userId } = params;

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
