const fs = require('fs');
let c = fs.readFileSync('src/pages/Auth.jsx', 'utf-8');
let after = c.substring(c.indexOf('// ─── Animated Waveform'));

const correctTop = `import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ladyDoctor from '../assets/lady_doctor.png'

import { LANGS } from '../utils/translations'

`;

fs.writeFileSync('src/pages/Auth.jsx', correctTop + after, 'utf-8');
console.log('Fixed imports');
