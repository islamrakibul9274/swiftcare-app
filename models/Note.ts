import mongoose, { Schema, Document } from "mongoose";

export interface INote extends Document {
  clientName: string;
  rbtName: string;
  rbtId: string;
  duration: string;
  summary: string;
  status: "Pending Review" | "Approved";
  date: Date;
  behaviors: Array<{ name: string; type: string; count: number }>; // <-- NEW FIELD
}

const NoteSchema: Schema = new Schema({
  clientName: { type: String, required: true },
  rbtName: { type: String, required: true },
  rbtId: { type: String, required: true },
  duration: { type: String, required: true },
  summary: { type: String, required: true },
  status: { type: String, enum: ["Pending Review", "Approved"], default: "Pending Review" },
  date: { type: Date, default: Date.now },
  // Tell Mongoose how to store the behavior data
  behaviors: [{ 
    name: { type: String }, 
    type: { type: String }, 
    count: { type: Number } 
  }]
});

export default mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);