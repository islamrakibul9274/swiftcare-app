import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const auditSchema = new Schema(
  {
    clinicId: { type: String, required: true },
    actorId: { type: String, required: true },
    actorName: String,
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: String,
    outcome: { type: String, default: "success" },
  },
  { timestamps: true },
);
auditSchema.index({ clinicId: 1, createdAt: -1 });
export const AuditEvent =
  (mongoose.models.AuditEvent as Model<InferSchemaType<typeof auditSchema>>) ||
  mongoose.model("AuditEvent", auditSchema);
const tokenSchema = new Schema(
  {
    digest: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, enum: ["INVITE", "RESET"], required: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: true },
);
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AccountToken =
  (mongoose.models.AccountToken as Model<
    InferSchemaType<typeof tokenSchema>
  >) || mongoose.model("AccountToken", tokenSchema);
const bucketSchema = new Schema({
  _id: String,
  hits: { type: Number, default: 0 },
  expiresAt: Date,
});
bucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RateBucket =
  (mongoose.models.RateBucket as Model<InferSchemaType<typeof bucketSchema>>) ||
  mongoose.model("RateBucket", bucketSchema);
const loginSchema = new Schema({
  _id: String,
  userId: { type: String, required: true },
  lastActivity: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});
loginSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const LoginSession =
  (mongoose.models.LoginSession as Model<
    InferSchemaType<typeof loginSchema>
  >) || mongoose.model("LoginSession", loginSchema);
