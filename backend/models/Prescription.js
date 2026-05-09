import mongoose from 'mongoose'
const med = new mongoose.Schema({ name: String, dosage: String, duration: String, timing: String, notes: String })
const s = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
  medicines: [med], diagnosis: String, advice: String, followUpDate: Date, qrCode: String
}, { timestamps: true })
export default mongoose.model('Prescription', s)
