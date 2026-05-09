import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, safeParse } from '../utils/api'
import { socket, joinRoom, sendMessage } from '../utils/socket'
import toast from 'react-hot-toast'

export default function ConsultationCall() {
  const navigate = useNavigate()
  const currentUser = api.getUser() || {}
  const isDoctor = currentUser?.role === 'doctor' || !currentUser?.role

  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [msg, setMsg] = useState('')
  const [chatMsgs, setChatMsgs] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [camActive, setCamActive] = useState(false)
  const [camError, setCamError] = useState(false)
  const chatEndRef = useRef(null)
  const videoRef = useRef(null)
  const autoReplyTimeoutRef = useRef(null)

  // Other-person data
  const activePatient = safeParse(localStorage.getItem('gd_active_patient') || localStorage.getItem('active_patient'), {})
  const activeDoctor = safeParse(localStorage.getItem('gd_doctor'), {})
  const triageData = safeParse(localStorage.getItem('triage_results') || localStorage.getItem('gd_triage'), {})
  const consultationId = localStorage.getItem('gd_consultation_id') || localStorage.getItem('consultationId')

  useEffect(() => {
      const triageSummary = localStorage.getItem('gd_triage_summary')
      const mlResults = safeParse(localStorage.getItem('gd_ml_results'), [])
      const initialMessages = []

      if (triageSummary) {
        let fullReport = triageSummary
        if (mlResults.length > 0) {
          fullReport += `\nML Prediction: ${mlResults[0].name} (${(mlResults[0].probability * 100).toFixed(0)}%)`
        }

        initialMessages.push({
          from: 'system',
          text: fullReport,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTriageSummary: true
        })
      }


      const symptoms = triageData.symptoms || triageData.summary || ""
      const greeting = isDoctor
        ? "Namaste! I am reviewing your symptoms now."
        : symptoms
          ? `Namaste! I can see you have: ${symptoms}. How are you feeling now?`
          : "Namaste! How can I help you today?"

      initialMessages.push({
        from: 'doctor',
        name: isDoctor ? 'You' : (activeDoctor.name || 'Dr. Rajesh Kumar'),
        text: greeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInitial: true
      })

      setChatMsgs(initialMessages)

      // Join Socket Room
      if (consultationId) {
        joinRoom(consultationId)
      }

      // Listen for messages
      socket.on('receive_message', (data) => {
        if (data.senderId !== socket.id) {
          setIsTyping(false)
          if (autoReplyTimeoutRef.current) {
            clearTimeout(autoReplyTimeoutRef.current)
            autoReplyTimeoutRef.current = null
          }
          setChatMsgs(prev => [...prev, {
            from: data.sender === 'doctor' ? 'doctor' : 'patient',
            name: data.senderName,
            text: data.message,
            time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        }
      })

      const timer = setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)

      return () => {
        clearInterval(timer)
        socket.off('receive_message')
        if (autoReplyTimeoutRef.current) {
          clearTimeout(autoReplyTimeoutRef.current)
          autoReplyTimeoutRef.current = null
        }
      }
  }, [consultationId])


  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs, isTyping])

  const handleEndCall = async () => {
    try {
      setIsEnded(true)
      if (consultationId) {
        await api.endConsultation(consultationId)
      }
      toast.success('Consultation ended')

      if (isDoctor) {
        const triage = safeParse(localStorage.getItem('gd_triage') || localStorage.getItem('triage_results'), {})
        localStorage.setItem('gd_post_consultation', JSON.stringify({
          patientName: activePatient.name || 'Patient',
          patientAge: activePatient.age || '',
          symptoms: triage.symptoms || activePatient.symptom || 'General consultation',
          doctorName: currentUser?.name || 'Doctor',
          date: new Date().toLocaleDateString('en-IN'),
          mode: 'write'
        }))
      } else {
        const triage = safeParse(localStorage.getItem('gd_triage') || localStorage.getItem('triage_results'), {})
        const patientName = currentUser?.name || 'Patient'
        const existingHistory = safeParse(localStorage.getItem('gd_prescription_history'), [])
        const diagnosisText = triage.summary || triage.symptoms || 'Consultation completed'
        const pendingRx = {
          _id: `PENDING-${consultationId || Date.now()}`,
          consultationId: consultationId || null,
          createdAt: new Date().toISOString(),
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          doctorName: activeDoctor?.name || 'Doctor',
          doctor: { name: activeDoctor?.name || 'Doctor', specialization: activeDoctor?.specialization || 'Consultant' },
          patientName,
          diagnosis: diagnosisText,
          diagnosis_en: diagnosisText,
          diagnosis_hi: diagnosisText,
          diagnosis_te: diagnosisText,
          medicines: [],
          advice: 'Awaiting doctor prescription submission.',
          status: 'pending_doctor_prescription'
        }
        const filteredHistory = Array.isArray(existingHistory)
          ? existingHistory.filter(rx => rx.consultationId !== pendingRx.consultationId || !pendingRx.consultationId)
          : []
        localStorage.setItem('gd_prescription_history', JSON.stringify([pendingRx, ...filteredHistory]))
        localStorage.setItem('gd_prescription_final', JSON.stringify(pendingRx))

        localStorage.removeItem('gd_booked_appointment')
        toast('Consultation ended. Prescription status updated.', { icon: '📝' })
      }

      navigate('/app/prescriptions')
    } catch (err) {
      setIsEnded(false)
      setStatusText(err?.message || 'Could not end consultation. Please retry.')
      toast.error(err?.message || 'Could not end consultation. Please retry.')
    }
  }

  const sendMsg = () => {
    if (!msg.trim() || isEnded) return

    const myRole = isDoctor ? 'doctor' : 'patient'
    const myName = isDoctor ? 'Doctor' : (currentUser.name || 'Patient')
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    setChatMsgs(prev => [...prev, { from: myRole, name: 'You', text: msg, time }])
    
    socket.emit('send_message', {
      roomId: consultationId,
      message: msg,
      sender: myRole,
      senderName: myName,
      senderId: socket.id,
      timestamp: new Date().toISOString()
    })

    setMsg('')

    if (!isDoctor) {
      setIsTyping(true)
      if (autoReplyTimeoutRef.current) clearTimeout(autoReplyTimeoutRef.current)
      autoReplyTimeoutRef.current = setTimeout(() => {
        setChatMsgs(prev => [...prev, {
          from: 'doctor',
          name: activeDoctor.name || 'Doctor',
          text: 'Thanks, I am reviewing your message now.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
        setIsTyping(false)
      }, 1200)
    }
  }

  const toggleRealCamera = () => {
    if (camActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      setCamActive(false);
      setCamOff(false);
      setCamError(false);
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: true })
      .then(stream => {
        setCamActive(true);
        setCamOff(false);
        setCamError(false);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      })
      .catch(err => {
        console.log('Camera not available:', err);
        setCamActive(false);
        setCamOff(true);
        setCamError(true);
        toast('Camera not available — using virtual display', { icon: '📹' });
      });
  }

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ height: 'calc(100vh - 104px)', display: 'flex', gap: 20, maxWidth: 1400, margin: '0 auto', paddingBottom: 20 }}>
      {/* VIDEO AREA (65%) */}
      <div style={{ flex: 0.65, background: '#0a1a0f', borderRadius: 24, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Large center — OTHER person */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a1f10 0%, #0f3d2a 50%, #0a1f10 100%)', position: 'relative' }}>
          
          {/* Animated noise/grain effect */}
          <motion.div
            animate={{ opacity: [0.95, 1, 0.95] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")', zIndex: 0, mixBlendMode: 'overlay' }}
          />

          <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7bcaa4' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7bcaa4' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7bcaa4' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid #7bcaa4' }} />
            </div>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Good</span>
          </div>

          <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>
            HD 720p
          </div>

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <motion.div
              animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0px rgba(123,202,164,0)', '0 0 30px rgba(123,202,164,0.3)', '0 0 0px rgba(123,202,164,0)'] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ width: 120, height: 120, borderRadius: '50%', background: '#0f3d2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, color: '#7bcaa4', margin: '0 auto 20px', border: '4px solid rgba(123,202,164,0.4)' }}
            >
              {isDoctor ? (activePatient.name?.[0]?.toUpperCase() || 'P') : '👨‍⚕️'}
            </motion.div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 600, fontFamily: 'Fraunces', fontStyle: 'italic' }}>{isDoctor ? activePatient.name || 'Patient' : activeDoctor.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 8 }}>Connecting via GramDoc Secure Call</div>
          </div>
        </div>

        {/* Timer & Live Indicator */}
        <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '6px 16px', borderRadius: 20, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4d' }} />
            {formatTime(elapsed)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,77,77,0.1)', padding: '2px 8px', borderRadius: 10 }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4d4d' }} />
            <span style={{ color: '#ff4d4d', fontSize: 9, fontWeight: 800, letterSpacing: '0.05em' }}>LIVE</span>
          </div>
        </div>

        {/* PIP — current user (ME) */}
        <div style={{ position: 'absolute', bottom: 100, right: 24, width: 140, height: 180, borderRadius: 16, background: 'linear-gradient(135deg, #0a1f10 0%, #0f3d2a 50%, #0a1f10 100%)', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 10 }}>
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
             <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ background: '#A32D2D', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>LIVE</motion.div>
          </div>
          {camError ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 24, marginBottom: 4 }}>📷</span>
              <span style={{ fontSize: 11, color: '#6b5e50', lineHeight: 1.2 }}>Click the camera icon in your browser address bar and allow camera access, then refresh</span>
            </div>
          ) : camActive ? (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          ) : camOff ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 24 }}>📹</div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#c4653a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20 }}>
                {(currentUser.name || 'U')[0]}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8 }}>{isDoctor ? 'You (Dr.)' : 'You'}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ padding: '24px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'center', gap: 16 }}>
          <ControlBtn icon={muted ? '🔇' : '🎙️'} label={muted ? 'Unmute' : 'Mute'} active={muted} onClick={() => setMuted(!muted)} />
          <ControlBtn icon={camActive ? '📷' : '📹'} label={camActive ? 'Stop Cam' : 'Start Cam'} active={camActive} onClick={toggleRealCamera} />
          <ControlBtn icon="📞" label="End Call" danger onClick={handleEndCall} />
          <ControlBtn icon="⚙️" label="Settings" onClick={() => toast.info('Video settings coming soon...')} />
        </div>
      </div>

      {/* CHAT PANEL (35%) */}
      <div style={{ flex: 0.35, background: '#fff', borderRadius: 24, border: '1px solid #e8d5bc', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ background: '#0f3d2a', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Chat with {isDoctor ? activePatient.name : activeDoctor.name}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>Secure encrypted consultation</div>
          </div>
          <div style={{ fontSize: 18 }}>💬</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, background: '#fdf6ec' }}>
          {chatMsgs.map((m, i) => {
            if (m.isTriageSummary) {
              return (
                <div key={i} style={{ width: '100%', marginBottom: 12 }}>
                  <div style={{ color: '#7bcaa4', fontSize: 10, fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>🤖 AI Triage Summary</div>
                  <div style={{
                    background: 'rgba(123,202,164,0.1)',
                    border: '1px solid rgba(123,202,164,0.3)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#0f3d2a',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4
                  }}>
                    {m.text}
                  </div>
                </div>
              )
            }

            const isMyMsg = isDoctor ? m.from === 'doctor' : m.from === 'patient'
            return (
              <div key={i} style={{ alignSelf: isMyMsg ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: 10, color: '#6b5e50', marginBottom: 4, textAlign: isMyMsg ? 'right' : 'left', fontWeight: 600 }}>{m.name}</div>
                <div style={{
                  background: isMyMsg ? '#0f3d2a' : '#fff',
                  color: isMyMsg ? '#fff' : '#1a1a1a',
                  padding: '10px 14px',
                  borderRadius: isMyMsg ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: 13,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: isMyMsg ? 'none' : '1px solid #e8d5bc'
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.3)', marginTop: 4, textAlign: isMyMsg ? 'right' : 'left' }}>{m.time}</div>
              </div>
            )

          })}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '10px 14px', borderRadius: '16px 16px 16px 2px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e8d5bc', display: 'flex', gap: 4 }}>
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ width: 4, height: 4, borderRadius: '50%', background: '#666' }} />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: 4, height: 4, borderRadius: '50%', background: '#666' }} />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: 4, height: 4, borderRadius: '50%', background: '#666' }} />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #e8d5bc', display: 'flex', flexDirection: 'column', gap: 10, background: '#fff' }}>
          {statusText && <div style={{ fontSize: 11, color: '#A32D2D', fontWeight: 600, textAlign: 'center' }}>{statusText}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              disabled={isEnded}
              placeholder={isEnded ? (statusText || "Consultation ended") : "Type a message..."}
              style={{ flex: 1, border: '1px solid #e8d5bc', borderRadius: 12, padding: '10px 16px', fontSize: 13, outline: 'none', background: isEnded ? '#f5f5f5' : '#fff' }}
            />
            <button
              onClick={sendMsg}
              disabled={isEnded}
              style={{
                width: 40, height: 40, borderRadius: '50%', background: isEnded ? '#ccc' : '#0f3d2a',
                color: '#fff', border: 'none', cursor: isEnded ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all 0.2s'
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlBtn({ icon, label, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: danger ? '#A32D2D' : active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, width: 64, height: 64,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', cursor: 'pointer', gap: 4, transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 9, opacity: 0.7 }}>{label}</span>
    </button>
  )
}
