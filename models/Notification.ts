import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    sourceKey: String,
    clinicId: { type: String, required: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: String,
    href: { type: String, required: true },
    readAt: Date,
  },
  { timestamps: true },
);
schema.index({ clinicId: 1, userId: 1, createdAt: -1 });
schema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);
export default (mongoose.models.Notification as Model<
  InferSchemaType<typeof schema>
>) || mongoose.model("Notification", schema);
