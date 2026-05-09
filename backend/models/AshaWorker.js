import mongoose from 'mongoose'

const ashaSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, default: 'Telangana' },
  ashaId: { type: String, unique: true },
  supervisorPHC: String,
  patients: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('AshaWorker', ashaSchema)
