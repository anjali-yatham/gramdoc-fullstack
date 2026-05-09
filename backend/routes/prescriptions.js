import express from 'express'
import protect from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import { createPrescription, getPrescriptions, getPrescription } from '../controllers/prescriptionController.js'
const r = express.Router()
r.use(protect)
r.post('/', requireRole('doctor'), createPrescription)
r.get('/', getPrescriptions)
r.get('/:id', getPrescription)
export default r
