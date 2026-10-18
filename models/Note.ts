import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    clinicId: String,
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    sourceKey: String,
    clientName: { type: String, required: true },
    rbtName: { type: String, required: true },
    rbtId: { type: String, required: true },
    duration: { type: String, required: true },
    durationMinutes: { type: Number, min: 0, default: 0 },
    summary: { type: String, required: true, maxlength: 12000 },
    aiGenerated: { type: Boolean, default: false },
    authorReviewed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Draft", "Pending Review", "Changes Requested", "Approved"],
      default: "Pending Review",
    },
    date: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    revision: { type: Number, default: 0 },
    comments: [
      {
        authorId: String,
        authorName: String,
        message: String,
        at: { type: Date, default: Date.now },
      },
    ],
    behaviors: [
      {
        name: String,
        type: { type: String },
        count: { type: Number, min: 0 },
        durationSeconds: { type: Number, min: 0 },
        intervals: { type: Number, min: 0 },
        opportunities: { type: Number, min: 0 },
      },
    ],
  },
  { timestamps: true },
);
schema.index({ clinicId: 1, clientId: 1, date: -1 });
schema.index({ clinicId: 1, rbtId: 1, status: 1 });
schema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);
export type NoteRecord = InferSchemaType<typeof schema>;
export default (mongoose.models.Note as Model<NoteRecord>) ||
  mongoose.model("Note", schema);
