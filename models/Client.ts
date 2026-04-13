import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  assignedBCBA: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // The specific behaviors to track in the mobile app
  targetBehaviors: [{
    name: String,
    type: { type: String, enum: ['decrease', 'increase'] } // e.g., decrease tantrums, increase requests
  }]
}, { timestamps: true });

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);