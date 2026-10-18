import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    clinicId: String,
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    clientName: { type: String, required: true },
    noteId: { type: Schema.Types.ObjectId, ref: "Note", required: true },
    sourceKey: String,
    dateOfService: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    units: { type: Number, min: 0, default: 0 },
    ratePerUnit: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["Pending Submission", "Submitted", "Paid", "Denied"],
      default: "Pending Submission",
    },
    billingCode: { type: String, default: "97153" },
    requiresReview: { type: Boolean, default: true },
    payerReference: { type: String, default: "" },
    updatedBy: String,
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ clinicId: 1, status: 1, dateOfService: -1 });
schema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);
export type ClaimRecord = InferSchemaType<typeof schema>;
export default (mongoose.models.Claim as Model<ClaimRecord>) ||
  mongoose.model("Claim", schema);
