import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    clinicId: { type: String, required: true },
    technician: { type: Schema.Types.ObjectId, ref: "User", required: true },
    supervisor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    date: { type: Date, required: true },
    minutes: { type: Number, required: true, min: 1, max: 480 },
    observation: { type: String, maxlength: 2000 },
  },
  { timestamps: true },
);
schema.index({ clinicId: 1, supervisor: 1, date: -1 });
export default (mongoose.models.Supervision as Model<
  InferSchemaType<typeof schema>
>) || mongoose.model("Supervision", schema);
