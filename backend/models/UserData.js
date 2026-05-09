import mongoose from 'mongoose'
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  key: String,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true })
s.index({ user: 1, key: 1 }, { unique: true })
export default mongoose.model('UserData', s)
