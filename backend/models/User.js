import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
const s = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, sparse: true, trim: true },
  email: { type: String, sparse: true, trim: true, lowercase: true },
  password: String,
  role: { type: String, enum: ['patient','doctor','asha','pharmacy'], default: 'patient' },
  village: String, district: String, state: String,
  language: { type: String, default: 'en' },
  otp: String, otpExpiry: Date,
  lastTriage: {
    urgency: { type: String, enum: ['high', 'medium', 'low'] },
    symptoms: [String],
    summary: String,
    doctorType: String,
    updatedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true })
s.pre('save', async function() {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10)
  }
})
s.methods.matchPassword = function(p) { return bcrypt.compare(p, this.password) }
export default mongoose.model('User', s)
