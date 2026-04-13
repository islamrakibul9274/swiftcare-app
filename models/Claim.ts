import mongoose, { Schema, Document } from "mongoose";

export interface IClaim extends Document {
  clientName: string;
  noteId: mongoose.Types.ObjectId;
  dateOfService: Date;
  amount: number;
  status: "Pending Submission" | "Submitted" | "Paid" | "Denied";
  billingCode: string;
}

const ClaimSchema: Schema = new Schema({
  clientName: { type: String, required: true },
  noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  dateOfService: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["Pending Submission", "Submitted", "Paid", "Denied"], 
    default: "Pending Submission" 
  },
  billingCode: { type: String, default: "97153" }, // Standard ABA Therapy Billing Code
});

export default mongoose.models.Claim || mongoose.model<IClaim>("Claim", ClaimSchema);