import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    _id: String,
    name: { type: String, required: true },
    ratePerUnit: { type: Number, min: 0, default: 0 },
    bookingVersion: { type: Number, default: 0 },
    billingCode: { type: String, default: "97153" },
  },
  { timestamps: true },
);
export default (mongoose.models.Clinic as Model<
  InferSchemaType<typeof schema>
>) || mongoose.model("Clinic", schema);
