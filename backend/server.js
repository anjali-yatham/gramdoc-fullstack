import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import doctorRoutes from './routes/doctors.js'
import consultationRoutes from './routes/consultations.js'
import prescriptionRoutes from './routes/prescriptions.js'
import triageRoutes from './routes/triage.js'
import dashboardRoutes from './routes/dashboard.js'
import ashaRoutes from './routes/asha.js'
import UserData from './models/UserData.js'
import protect from './middleware/auth.js'

dotenv.config()
const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost:5173')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json())

// Sync endpoints
app.post('/api/sync', protect, async (req, res) => {
  try {
    const { key, data } = req.body
    await UserData.findOneAndUpdate(
      { user: req.user.id, key },
      { user: req.user.id, key, data },
      { upsert: true, new: true }
    )
    res.json({ success: true })
  } catch(e) { res.status(500).json({ message: e.message }) }
})

app.get('/api/sync/:key', protect, async (req, res) => {
  try {
    const record = await UserData.findOne({ 
      user: req.user.id, 
      key: req.params.key 
    })
    res.json(record?.data || null)
  } catch(e) { res.status(500).json({ message: e.message }) }
})

// Routes
app.use('/api/auth',          authRoutes)
app.use('/api/doctors',       doctorRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/triage',        triageRoutes)
app.use('/api/dashboard',     dashboardRoutes)
app.use('/api/asha',          ashaRoutes)

const server = http.createServer(app)
const io = new Server(server, {
  cors: { 
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true 
  }
})

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id)
  
  socket.on('join_consultation', (roomId) => {
    socket.join(roomId)
    console.log(`👤 User ${socket.id} joined room ${roomId}`)
  })
  
  socket.on('send_message', (data) => {
    // data: { roomId, message, sender, timestamp }
    io.to(data.roomId).emit('receive_message', data)
  })

  socket.on('disconnect', () => {
    console.log('👋 User disconnected')
  })
})

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'GramDoc API' }))

const PORT = process.env.PORT || 4000
const MONGO = process.env.MONGO_URI || ''

mongoose.connect(MONGO)
  .then(() => { 
    console.log('MongoDB connected'); 
    server.listen(PORT, () => console.log(`GramDoc API (with Sockets) running on port ${PORT}`)) 
  })
  .catch(err => { console.error('DB error:', err); process.exit(1) })
