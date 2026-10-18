import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    clinicId: String,
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    technician: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    scheduledEnd: Date,
    startedAt: Date,
    endedAt: Date,
    durationMinutes: { type: Number, min: 0, default: 0 },
    behaviorData: [
      {
        behaviorName: String,
        frequency: { type: Number, min: 0, default: 0 },
        durationSeconds: { type: Number, min: 0, default: 0 },
        intervals: { type: Number, min: 0, default: 0 },
        opportunities: { type: Number, min: 0, default: 0 },
      },
    ],
    abcData: [
      { antecedent: String, behavior: String, consequence: String, at: Date },
    ],
    aiDraftedNote: String,
    aiOriginalNote: String,
    aiGenerated: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "APPROVED",
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "SCHEDULED",
    },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);
schema.index({ clinicId: 1, technician: 1, date: 1 });
schema.index({ clinicId: 1, client: 1, date: -1 });
schema.index(
  { clinicId: 1, technician: 1 },
  { unique: true, partialFilterExpression: { status: "IN_PROGRESS" } },
);
export type SessionRecord = InferSchemaType<typeof schema>;
export default (mongoose.models.Session as Model<SessionRecord>) ||
  mongoose.model("Session", schema);
