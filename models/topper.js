import mongoose from "mongoose"

const itemSchema = new mongoose.Schema(
  {
    name: String,
    year: String,
    ageGroupCategory: {
      type: String,
      enum: ["8-12", "13-16", "17-22"],
    },
    description: String,
    image: String,
  },
  { timestamps: true }
)

export default mongoose.models.Item ||
  mongoose.model("Item", itemSchema)