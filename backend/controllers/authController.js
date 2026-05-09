import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' })

export async function sendOtp(req, res) {
  try {
    let { phone, role, name } = req.body
    if (!phone || phone.trim().length !== 10) {
      return res.status(400).json({ message: 'Valid 10-digit phone number required' })
    }
    phone = phone.trim()
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    let user = await User.findOne({ phone })
    if (!user) {
      user = new User({ name: name || (role === 'asha' ? 'ASHA Worker' : 'Patient'), phone, role: role || 'patient' })
    } else {
      if (role && user.role !== role) user.role = role
      if (name) user.name = name
    }
    user.otp = otp; user.otpExpiry = new Date(Date.now() + 10 * 60000)
    await user.save()
    
    console.log(`OTP for ${phone}: ${otp}`)
    res.json({ 
      message: 'OTP sent', 
      ...(process.env.NODE_ENV !== 'production' && { otp }) 
    })
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in sendOtp:`, e)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function verifyOtp(req, res) {
  try {
    let { phone, otp } = req.body
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' })
    phone = phone.trim(); otp = otp.trim()

    // Master test OTP for development
    if (process.env.NODE_ENV !== 'production' && otp === '123456') {
      const user = await User.findOne({ phone })
      if (user) {
        return res.json({ token: token(user._id), user: { id: user._id, name: user.name, role: user.role } })
      }
    }

    const user = await User.findOne({ phone })
    if (!user || user.otp !== otp || user.otpExpiry < new Date())
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    user.otp = undefined; user.otpExpiry = undefined
    await user.save()
    res.json({ token: token(user._id), user: { id: user._id, name: user.name, role: user.role } })
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in verifyOtp:`, e)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function loginEmail(req, res) {
  try {
    const { email, password } = req.body
    const emailNorm = email?.trim().toLowerCase()
    if (!emailNorm || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email: emailNorm })
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })
    
    if (!user.password) return res.status(401).json({ message: 'Password not set. Use phone OTP or reset password.' })
    
    const isMatch = await user.matchPassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' })

    res.json({ token: token(user._id), user: { id: user._id, name: user.name, role: user.role } })
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in loginEmail:`, e)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    const emailNorm = email.trim().toLowerCase()
    
    const existingUser = await User.findOne({ email: emailNorm })
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }
      
    const user = await User.create({ name: name.trim(), email: emailNorm, password })
    res.status(201).json({ token: token(user._id), user: { id: user._id, name: user.name, role: user.role } })
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Full error in signup:`, e)
    if (e.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' })
    }
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function doctorApply(req, res) {
  try {
    const { name, email, phone, password, regNumber, specialization, experience } = req.body
    if (!name || !email || !phone || !password || !regNumber || !specialization || experience === undefined) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    const emailNorm = email.trim().toLowerCase()
    const phoneNorm = phone.trim()
    if (phoneNorm.length !== 10) return res.status(400).json({ message: 'Valid 10-digit phone number required' })
    
    const existingUser = await User.findOne({ email: emailNorm })
    if (existingUser) return res.status(400).json({ message: 'Email already registered' })
    
    const { default: Doctor } = await import('../models/Doctor.js')
    const existingDoc = await Doctor.findOne({ regNumber })
    if (existingDoc) return res.status(400).json({ message: 'Registration number already exists' })
    
    const user = await User.create({ name: name.trim(), email: emailNorm, phone: phoneNorm, password, role: 'doctor' })
    await Doctor.create({ 
      user: user._id, 
      name: name.trim(), 
      email: emailNorm, 
      regNumber, 
      specialization, 
      experience: Number(experience) || 0, 
      languages: ['Telugu','Hindi','English'], 
      isVerified: false 
    })
    res.status(201).json({ message: 'Application submitted. Verification within 24 hours.' })
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in doctorApply:`, e)
    const status = e.code === 11000 ? 400 : 500
    let msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    if (e.code === 11000) msg = 'Account or Registration Number already exists'
    res.status(status).json({ message: msg })
  }
}

export async function pharmacyApply(req, res) {
  try {
    const {
      pharmacyName,
      ownerName,
      email,
      phone,
      address,
      licenseNumber,
      password
    } = req.body

    if (!pharmacyName || !email || !password) {
      return res.status(400).json({
        message: 'Pharmacy name, email and password are required'
      })
    }

    const emailNorm = email.trim().toLowerCase()
    const existing = await User.findOne({ email: emailNorm })
    if (existing) {
      return res.status(400).json({
        message: 'Account already exists with this email'
      })
    }

    const user = await User.create({
      name: ownerName || pharmacyName,
      email: emailNorm,
      password,
      phone,
      role: 'pharmacy'
    })

    res.status(201).json({
      message: 'Pharmacy application submitted. Verification within 24 hours.',
      userId: user._id
    })
  } catch (e) {
    console.error('Pharmacy apply error:', e)
    if (e.code === 11000) {
      return res.status(400).json({
        message: 'Email already registered'
      })
    }
    res.status(500).json({
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : e.message
    })
  }
}
