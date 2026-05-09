import express from 'express'
import protect from '../middleware/auth.js'
import { getStats } from '../controllers/dashboardController.js'
const r = express.Router()
r.use(protect)
r.get('/stats', getStats)
export default r
