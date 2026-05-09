import express from 'express'
import { sendOtp, verifyOtp, loginEmail, signup, doctorApply, pharmacyApply } from '../controllers/authController.js'
const r = express.Router()
r.post('/send-otp', sendOtp)
r.post('/verify-otp', verifyOtp)
r.post('/login', loginEmail)
r.post('/signup', signup)
r.post('/doctor-apply', doctorApply)
r.post('/pharmacy-apply', pharmacyApply)
export default r
