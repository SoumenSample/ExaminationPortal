import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      default: "admin",
    },
    relatedLink: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
