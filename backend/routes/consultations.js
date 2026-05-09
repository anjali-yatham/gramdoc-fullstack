import express from 'express'
import protect from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import {
  getQueue,
  getConsultations,
  saveQueue,
  startConsultation,
  endConsultation,
  searchPatients
} from '../controllers/consultationController.js'
const r = express.Router()
r.use(protect)

r.get('/', getConsultations) // both can read (usually filtered in controller)
r.get('/my-consultations', requireRole('patient'), getConsultations) 
r.post('/queue', requireRole('doctor'), saveQueue)
r.get('/queue', requireRole('doctor'), getQueue)
r.get('/search', requireRole('doctor'), searchPatients)
r.post('/start', requireRole('doctor'), startConsultation)
r.post('/:id/end', requireRole('doctor'), endConsultation)
export default r
