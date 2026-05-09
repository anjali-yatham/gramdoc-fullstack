import express from 'express'
import protect from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import {
  getAshaDashboard,
  getMyPatients,
  registerPatient,
  bookConsultationForPatient,
  getVillageReport,
  getPregnancyTracker,
  getVaccinationTracker,
  markVaccinationDone,
} from '../controllers/ashaController.js'

const r = express.Router()
r.use(protect)
r.use(requireRole('asha'))

r.get('/dashboard', getAshaDashboard)
r.get('/my-patients', getMyPatients)
r.post('/register-patient', registerPatient)
r.post('/book-consultation', bookConsultationForPatient)
r.get('/village-report', getVillageReport)
r.get('/pregnancy-tracker', getPregnancyTracker)
r.get('/vaccination-tracker', getVaccinationTracker)
r.post('/vaccination/:id/done', markVaccinationDone)
export default r
