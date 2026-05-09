import express from 'express'
import { triageChat } from '../controllers/triageController.js'
import { optionalProtect } from '../middleware/auth.js'
const r = express.Router()
r.post('/chat', optionalProtect, triageChat)
export default r
