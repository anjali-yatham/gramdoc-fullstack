import mongoose from 'mongoose'
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  regNumber: { type: String, required: true, unique: true },
  specialization: { type: String, required: true },
  experience: { type: Number, default: 0 },
  languages: [String],
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  waitMinutes: { type: Number, default: 5 },
  isAvailable: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  avatar: String,
  schedule: {
    morning: { type: Boolean, default: true },
    afternoon: { type: Boolean, default: true },
    evening: { type: Boolean, default: false },
    maxPatients: { type: Number, default: 20 },
    duration: { type: Number, default: 15 }
  }
}, { timestamps: true })
export default mongoose.model('Doctor', s)
