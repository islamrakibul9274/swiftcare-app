import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "BCBA", "RBT"], required: true },
    clinicName: { type: String, required: true },
    clinicId: String,
    active: { type: Boolean, default: true },
    forcePasswordChange: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
    credential: { type: String, default: "" },
    credentialExpiresAt: Date,
    notificationPreferences: { type: Boolean, default: true },
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ clinicId: 1, role: 1, active: 1 });
export type UserRecord = InferSchemaType<typeof schema>;
export default (mongoose.models.User as Model<UserRecord>) ||
  mongoose.model("User", schema);
