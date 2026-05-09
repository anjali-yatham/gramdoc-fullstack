import Consultation from '../models/Consultation.js'
import Doctor from '../models/Doctor.js'
import Prescription from '../models/Prescription.js'
import User from '../models/User.js'

export async function getQueue(req, res) {
  try {
    let query = {}
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id })
      if (!doctor) return res.json([])
      query = { doctor: doctor._id, status: { $in: ['waiting','active'] } }
    } else {
      query = { patient: req.user.id, status: { $in: ['waiting','active'] } }
    }
    const consultations = await Consultation.find(query)
      .populate('doctor')
      .populate('patient')
      .sort({ createdAt: 1 })
    res.json(consultations)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getConsultations(req, res) {
  try {
    const consultations = await Consultation.find({
      doctor: req.user.id
    })
      .populate('patient', 'name phone village')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(consultations)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function saveQueue(req, res) {
  try {
    const { queue } = req.body
    const UserData = (await import('../models/UserData.js')).default
    await UserData.findOneAndUpdate(
      { user: req.user.id, key: 'gd_queue' },
      { user: req.user.id, key: 'gd_queue', data: queue },
      { upsert: true, new: true }
    )
    res.json({ success: true, queue })
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function startConsultation(req, res) {
  try {
    const { doctorId } = req.body
    const doctor = await Doctor.findById(doctorId)
    if (!doctor || !doctor.isAvailable) return res.status(400).json({ message: 'Doctor not available' })
    const consultation = await Consultation.create({
      patient: req.user.id, doctor: doctorId,
      status: 'active', startedAt: new Date(),
      roomId: `room_${Date.now()}`
    })
    res.status(201).json(consultation)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function endConsultation(req, res) {
  try {
    const c = await Consultation.findById(req.params.id)
    if (!c) return res.status(404).json({ message: 'Not found' })
    c.status = 'completed'; c.endedAt = new Date()
    await c.save()
    res.json(c)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function searchPatients(req, res) {
  try {
    const { q } = req.query
    if (!q) return res.json([])
    
    const doctor = await Doctor.findOne({ user: req.user.id })
    if (!doctor) return res.status(403).json({ message: 'Forbidden' })

    // Find prescriptions by this doctor where patient name matches
    const prescriptions = await Prescription.find({ doctor: doctor._id })
      .populate({
        path: 'patient',
        match: { name: { $regex: q, $options: 'i' } }
      })
      .sort({ createdAt: -1 })
    
    // Filter out ones that didn't match the populate match
    const matches = prescriptions.filter(p => p.patient).map(p => ({
      ...p.toObject(),
      patientName: p.patient.name,
      patientId: p.patient._id
    }))

    res.json(matches)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}
