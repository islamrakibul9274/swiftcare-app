import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const schema = new Schema(
  {
    clinicId: String,
    code: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    dateOfBirth: { type: Date, required: true },
    assignedBCBA: { type: Schema.Types.ObjectId, ref: "User" },
    assignedRBTs: [{ type: Schema.Types.ObjectId, ref: "User" }],
    active: { type: Boolean, default: true },
    authorizationHours: { type: Number, min: 0 },
    authorizationExpiresAt: Date,
    targetBehaviors: [
      {
        name: String,
        type: { type: String, enum: ["decrease", "increase"] },
        measurement: {
          type: String,
          enum: ["frequency", "duration", "interval"],
          default: "frequency",
        },
      },
    ],
    goals: [
      {
        name: { type: String, required: true },
        target: { type: Number, min: 0, required: true },
        masteryCriteria: String,
        direction: {
          type: String,
          enum: ["increase", "decrease"],
          default: "increase",
        },
        phaseDate: Date,
      },
    ],
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.index({ clinicId: 1, assignedBCBA: 1 });
schema.index({ clinicId: 1, assignedRBTs: 1 });
export type ClientRecord = InferSchemaType<typeof schema>;
export default (mongoose.models.Client as Model<ClientRecord>) ||
  mongoose.model("Client", schema);
