import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    amount: Number,
    type: {
      type: String,
      enum: ["inward", "outward"],
    },
  },
  { timestamps: true }
)

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema)