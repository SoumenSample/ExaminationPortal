import mongoose from "mongoose"

const StaffActivitySchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    activityDate: {
      type: Date,
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    checkIn: {
      type: String,
      default: "",
    },
    checkOut: {
      type: String,
      default: "",
    },
    report: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
)

StaffActivitySchema.index({ staffId: 1, dateKey: 1 }, { unique: true })

export default mongoose.models.StaffActivity || mongoose.model("StaffActivity", StaffActivitySchema)
