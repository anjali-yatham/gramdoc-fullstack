import Doctor from '../models/Doctor.js'

const SEED = [
  { name:'Dr. Priya Sharma', email:'priya@gd.com', regNumber:'MCI-001', specialization:'General Physician', experience:8, languages:['Telugu','Hindi','English'], rating:4.8, reviewCount:234, waitMinutes:3, isAvailable:true, isVerified:true },
  { name:'Dr. Arjun Reddy',  email:'arjun@gd.com', regNumber:'MCI-002', specialization:'Pediatrician',      experience:12, languages:['Telugu','English'], rating:4.9, reviewCount:412, waitMinutes:7, isAvailable:true, isVerified:true },
  { name:'Dr. Meena Iyer',   email:'meena@gd.com', regNumber:'MCI-003', specialization:'Gynaecologist',     experience:15, languages:['Tamil','Telugu','English'], rating:4.7, reviewCount:189, waitMinutes:12, isAvailable:false, isVerified:true },
  { name:'Dr. Suresh Babu',  email:'suresh@gd.com', regNumber:'MCI-004', specialization:'Cardiologist',     experience:20, languages:['Telugu','Hindi'], rating:4.6, reviewCount:301, waitMinutes:18, isAvailable:true, isVerified:true },
]

async function seedIfEmpty() {
  const count = await Doctor.countDocuments()
  if (count === 0) await Doctor.insertMany(SEED)
}

export async function getDoctors(req, res) {
  try {
    await seedIfEmpty()
    const { specialization, available } = req.query
    const query = {}
    if (specialization) query.specialization = specialization
    if (available === 'true') query.isAvailable = true
    const doctors = await Doctor.find({ isVerified: true, ...query }).sort({ isAvailable: -1, rating: -1 })
    res.json(doctors)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getDoctor(req, res) {
  try {
    const doc = await Doctor.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Doctor not found' })
    res.json(doc)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function updateAvailability(req, res) {
  try {
    const { isAvailable } = req.body
    await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { isAvailable },
      { new: true }
    )
    res.json({ success: true, isAvailable })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function updateDoctorProfile(req, res) {
  try {
    const updates = req.body
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { ...updates },
      { new: true }
    )
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found'
      })
    }
    res.json(doctor)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getSchedule(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id })
    res.json(doctor?.schedule || {
      morning: true,
      afternoon: true,
      evening: false,
      maxPatients: 20,
      duration: 15
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function verifyDoctor(req, res) {
  try {
    const { regNumber } = req.body
    if (!regNumber) return res.status(400).json({ message: 'Registration number required' })
    
    // Mocking registry check: if it starts with 'MCI', verify it
    const isMCI = regNumber.startsWith('MCI-') || regNumber.length > 5
    
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { regNumber, isVerified: isMCI },
      { new: true }
    )
    res.json({ success: true, isVerified: doctor.isVerified })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function saveSchedule(req, res) {
  try {
    const schedule = req.body
    await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { schedule },
      { new: true }
    )
    res.json({ success: true, schedule })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getEarnings(req, res) {
  try {
    const Prescription = (await import('../models/Prescription.js')).default
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)
    
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0,0,0,0)

    const doctor = await Doctor.findOne({ user: req.user.id })
    if (!doctor) return res.json({ today:0, week:0, month:0 })

    const todayCount = await Prescription.countDocuments({
      doctor: doctor._id,
      createdAt: { $gte: today }
    })
    const weekCount = await Prescription.countDocuments({
      doctor: doctor._id,
      createdAt: { $gte: startOfWeek }
    })
    const monthCount = await Prescription.countDocuments({
      doctor: doctor._id,
      createdAt: { $gte: startOfMonth }
    })

    const rate = 150
    res.json({
      today: todayCount * rate,
      todayConsults: todayCount,
      week: weekCount * rate,
      weekConsults: weekCount,
      month: monthCount * rate,
      monthConsults: monthCount,
      rate,
      nextPayout: 'Monday, 12 May 2026'
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getAnalytics(req, res) {
  try {
    const Prescription = (await import('../models/Prescription.js')).default
    const doctor = await Doctor.findOne({ user: req.user.id })
    
    const prescriptions = await Prescription.find({ 
      doctor: doctor?._id 
    }).sort({ createdAt: -1 }).limit(100)

    const diagnosisCounts = {}
    prescriptions.forEach(p => {
      if (p.diagnosis) {
        diagnosisCounts[p.diagnosis] = 
          (diagnosisCounts[p.diagnosis] || 0) + 1
      }
    })

    const diseases = Object.entries(diagnosisCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5)

    res.json({
      totalConsultations: prescriptions.length,
      diseases,
      travelCostSaved: prescriptions.length * 800,
      distanceSaved: prescriptions.length * 45,
      patientsHelped: prescriptions.length,
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}
