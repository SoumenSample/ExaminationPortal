import mongoose from "mongoose"

const itemSchema = new mongoose.Schema(
  {
    name: String,
    year: String,
    description: String,
    image: String,
  },
  { timestamps: true }
)

export default mongoose.models.Item ||
  mongoose.model("Item", itemSchema)