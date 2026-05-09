import mongoose from 'mongoose'
const s = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  status: { type: String, enum: ['waiting','active','completed','cancelled'], default: 'waiting' },
  urgency: { type: String, enum: ['low','medium','high'], default: 'low' },
  symptoms: [String], notes: String, startedAt: Date, endedAt: Date, roomId: String
}, { timestamps: true })
export default mongoose.model('Consultation', s)
