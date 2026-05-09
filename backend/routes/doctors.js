import express from 'express'
import { 
  getDoctors, 
  getDoctor, 
  updateDoctorProfile,
  updateAvailability, 
  getSchedule, 
  saveSchedule, 
  getEarnings, 
  getAnalytics,
  verifyDoctor
} from '../controllers/doctorController.js'
import protect from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'

const r = express.Router()

r.get('/', getDoctors)
r.patch('/:id', protect, updateDoctorProfile)
r.post('/availability', protect, requireRole('doctor'), updateAvailability)
r.post('/verify', protect, verifyDoctor)
r.get('/schedule', protect, requireRole('doctor'), getSchedule)
r.post('/schedule', protect, requireRole('doctor'), saveSchedule)
r.get('/earnings', protect, requireRole('doctor'), getEarnings)
r.get('/analytics', protect, requireRole('doctor'), getAnalytics)
r.get('/:id', getDoctor)

export default r
