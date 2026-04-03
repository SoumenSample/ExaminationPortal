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

const existingModel = mongoose.models.Item

if (existingModel && !existingModel.schema.path("ageGroupCategory")) {
  existingModel.schema.add({
    ageGroupCategory: {
      type: String,
      enum: ["8-12", "13-16", "17-22"],
    },
  })
}

export default existingModel || mongoose.model("Item", itemSchema)