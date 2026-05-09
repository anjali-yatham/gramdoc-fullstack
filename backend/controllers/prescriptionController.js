import Prescription from '../models/Prescription.js'
import Doctor from '../models/Doctor.js'

const SEED_RX = (patientId) => ([{
  patient: patientId,
  doctor: '000000000000000000000001',
  diagnosis: 'Acute Viral Fever with mild dehydration',
  advice: 'Rest well, drink plenty of fluids. Avoid spicy food for 3 days. Return if fever persists beyond 3 days.',
  followUpDate: new Date(Date.now() + 7*24*60*60*1000),
  qrCode: 'RX-2025-001-QR',
  medicines: [
    { name:'Paracetamol 500mg', dosage:'1 tablet', duration:'5 days', timing:'3 times a day after meals', notes:'For fever and pain' },
    { name:'ORS Sachet',        dosage:'1 sachet in 1L water', duration:'3 days', timing:'After every loose motion', notes:'For rehydration' },
    { name:'Cetirizine 10mg',   dosage:'1 tablet', duration:'3 days', timing:'Once at night before sleep', notes:'For cold symptoms' },
  ]
}])

export async function getPrescriptions(req, res) {
  try {
    let rxs = await Prescription.find({ patient: req.user.id }).sort({ createdAt: -1 })
    res.json(rxs)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getPrescription(req, res) {
  try {
    const rx = await Prescription.findById(req.params.id)
    if (!rx) return res.status(404).json({ message: 'Not found' })
    res.json(rx)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function createPrescription(req, res) {
  try {
    const {
      patientId, diagnosis, medicines,
      advice, followUpDate, qrCode
    } = req.body

    const doctor = await Doctor.findOne({
      user: req.user.id
    })
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found'
      })
    }

    const prescription = await Prescription.create({
      patient: patientId || req.user.id,
      doctor: doctor._id,
      diagnosis,
      medicines,
      advice,
      followUpDate: followUpDate
        ? new Date(followUpDate)
        : null,
      qrCode: qrCode || `RX-${Date.now()}`
    })

    res.status(201).json(prescription)
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}
