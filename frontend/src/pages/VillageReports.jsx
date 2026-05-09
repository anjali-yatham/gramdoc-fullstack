import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api, safeParse } from '../utils/api'
import { toast } from 'react-hot-toast'

const spring = { type: 'spring', stiffness: 90, damping: 18 }

const sectionVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: i => ({
    y: 0, opacity: 1,
    transition: { ...spring, delay: i * 0.15 }
  })
}


const DISEASE_COLORS = {
  'Viral Fever': '#7bcaa4',
  'Hypertension': '#c4653a',
  'Chest pain': '#A32D2D',
  'Skin allergy': '#854F0B',
  'Child fever': '#0C447C',
  'Cough and Cold': '#1d9e75',
  'Malaria': '#6b3fa0'
}

function CountUp({ end, prefix = '' }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const duration = 1500
    const frameRate = 16
    const increment = end / (duration / frameRate)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, frameRate)
    
    return () => clearInterval(timer)
  }, [end])
  
  return <span>{prefix}{count.toLocaleString()}</span>
}

export default function VillageReports() {
  const user = api.getUser() || {}
  const [analytics, setAnalytics] = useState(null)
  const historyStr = localStorage.getItem('gd_prescription_history')
  const history = safeParse(historyStr, [])
  const myPrescriptions = history.filter(rx => rx.doctorName === user?.name || rx.doctor?.name === user?.name)

  useEffect(() => {
    let mounted = true
    api.getAnalytics().then(data => {
      if (mounted && data) setAnalytics(data)
    }).catch(() => {
      if (mounted) setAnalytics(null)
    })
    return () => { mounted = false }
  }, [])

  function getWeekRange() {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString('en-IN', {
      day:'numeric', month:'short'
    })} - ${end.toLocaleDateString('en-IN', {
      day:'numeric', month:'short', year:'numeric'
    })}`
  }

  let totalConsultations = 0, uniqueVillages = 0, prescriptionsIssued = 0, travelCostSaved = null, diseaseCounts = {}, villageData = [], growthLabel = 'No recent patients', topDiseases = [], maxDiseaseCount = 1

  if (myPrescriptions.length > 0) {
    const getVillage = (rx) => {
      if (rx.village) return rx.village;
      if (rx.patientVillage) return rx.patientVillage;
      if (rx.patient?.village) return rx.patient.village;
      if (rx.location) return rx.location;
      return 'Village not recorded';
    };

    totalConsultations = myPrescriptions.length
    uniqueVillages = [...new Set(myPrescriptions.map(getVillage))].length
    prescriptionsIssued = myPrescriptions.filter(rx => rx.medicines?.length > 0).length
    travelCostSaved = analytics?.travelCostSaved ?? null

    diseaseCounts = myPrescriptions.reduce((acc, rx) => {
      const d = rx.diagnosis || 'General'
      acc[d] = (acc[d] || 0) + 1
      return acc
    }, {})

    const vMap = myPrescriptions.reduce((acc, rx) => {
      const v = getVillage(rx)
      const district = rx.district || rx.patientDistrict || 'Rural Region'
      if (!acc[v]) acc[v] = { name: v, patients: 0, diseases: {}, lastVisit: rx.date || rx.createdAt, district: district }
      acc[v].patients += 1
      const d = rx.diagnosis || 'General'
      acc[v].diseases[d] = (acc[v].diseases[d] || 0) + 1
      return acc
    }, {})

    villageData = Object.values(vMap).map(v => {
      const common = Object.keys(v.diseases).reduce((a, b) => v.diseases[a] > v.diseases[b] ? a : b, '')
      return { ...v, illness: common, date: v.lastVisit ? new Date(v.lastVisit).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : '' }
    }).sort((a,b) => b.patients - a.patients).slice(0,5)

    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const recentConsults = myPrescriptions.filter(rx => new Date(rx.createdAt) > oneWeekAgo).length
    growthLabel = recentConsults > 0 ? `+${recentConsults} this week` : 'No recent patients'

    topDiseases = Object.entries(diseaseCounts).sort((a,b) => b[1] - a[1]).slice(0, 5)
    maxDiseaseCount = topDiseases.length ? topDiseases[0][1] : 1
  }

  if (analytics?.totalConsultations !== undefined) {
    totalConsultations = analytics.totalConsultations
  }
  if (analytics?.diseases?.length) {
    topDiseases = analytics.diseases.map(d => [d.name, d.count])
    maxDiseaseCount = Math.max(1, ...topDiseases.map(([, count]) => count))
  }

  const WEEK_DATA = [
    { day: 'Sun', count: 0 },
    { day: 'Mon', count: 0 },
    { day: 'Tue', count: 0 },
    { day: 'Wed', count: 0 },
    { day: 'Thu', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Sat', count: 0 }
  ]
  
  // Real week data from prescriptions
  if (myPrescriptions.length > 0) {
     myPrescriptions.forEach(rx => {
       const d = new Date(rx.createdAt || Date.now()).getDay()
       WEEK_DATA[d].count += 1
     })
  }
  const currentDayName = new Date().toLocaleDateString('en-IN', { weekday: 'short' })
  const maxWeekCount = Math.max(1, ...WEEK_DATA.map(d => d.count))

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, fontFamily: "'Mukta', sans-serif" }}>
      
      {/* SECTION 1 - TOP STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {/* Card 1 */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants} whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e8d5bc', transition: 'box-shadow 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: '#0f3d2a', margin: 0, lineHeight: 1 }}>
              <CountUp end={totalConsultations} />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7bcaa4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👥</div>
          </div>
          <div style={{ fontSize: 11, color: '#6b5e50', marginTop: 12 }}>Total Consultations</div>
          <div style={{ fontSize: 10, color: '#1d9e75', fontWeight: 700, marginTop: 4 }}>{growthLabel}</div>
        </motion.div>

        {/* Card 2 */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants} whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e8d5bc', transition: 'box-shadow 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: '#0f3d2a', margin: 0, lineHeight: 1 }}>
              <CountUp end={uniqueVillages} />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#c4653a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗺️</div>
          </div>
          <div style={{ fontSize: 11, color: '#6b5e50', marginTop: 12 }}>Villages Covered</div>
          <div style={{ fontSize: 10, color: '#6b5e50', marginTop: 4 }}>Across {user?.state || 'Rural Regions'}</div>
        </motion.div>

        {/* Card 3 */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants} whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e8d5bc', transition: 'box-shadow 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: '#0f3d2a', margin: 0, lineHeight: 1 }}>
              <CountUp end={prescriptionsIssued} />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f3d2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📋</div>
          </div>
          <div style={{ fontSize: 11, color: '#6b5e50', marginTop: 12 }}>Prescriptions Issued</div>
          <div style={{ fontSize: 10, color: '#6b5e50', marginTop: 4 }}>Digital delivery</div>
        </motion.div>

        {/* Card 4 */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={sectionVariants} whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
          style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e8d5bc', transition: 'box-shadow 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: '#0f3d2a', margin: 0, lineHeight: 1.2 }}>
              {travelCostSaved !== null ? <CountUp prefix="₹" end={travelCostSaved} /> : 'N/A'}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7bcaa4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💚</div>
          </div>
          <div style={{ fontSize: 11, color: '#6b5e50', marginTop: 12 }}>Travel Cost Saved</div>
          <div style={{ fontSize: 10, color: '#6b5e50', marginTop: 4 }}>For rural patients</div>
        </motion.div>
      </div>

      {/* SECTION 2 - TWO COLUMN ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Left Chart */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={sectionVariants} 
          style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e8d5bc' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: '#0f3d2a', margin: 0 }}>Consultations ({getWeekRange()})</div>
          <div style={{ fontSize: 11, color: '#6b5e50', marginBottom: 24 }}>Daily patient count</div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, padding: '0 10px' }}>
            {WEEK_DATA.map((d, i) => {
              const isToday = d.day === currentDayName
              const h = (d.count / maxWeekCount) * 100
              return (
                <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: h }} transition={{ ...spring, delay: 0.6 + i * 0.05 }}
                    style={{ width: 32, borderRadius: '6px 6px 0 0', background: isToday ? '#7bcaa4' : 'rgba(15,61,42,0.2)' }}
                  />
                  <div style={{ fontSize: 9, color: '#6b5e50' }}>{d.day}</div>
                  <div style={{ fontSize: 10, color: '#0f3d2a', fontWeight: 700 }}>{d.count}</div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Right Chart */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={sectionVariants} 
          style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e8d5bc' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: '#0f3d2a', margin: 0 }}>Top Diseases</div>
          <div style={{ fontSize: 11, color: '#6b5e50', marginBottom: 20 }}>By patient count in {new Date().toLocaleDateString('en-IN', { month: 'long' })}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topDiseases.length > 0 ? (
              topDiseases.map(([name, count], i) => {
                const color = DISEASE_COLORS[name] || '#1d9e75'
                const w = (count / maxDiseaseCount) * 100 + '%'
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: '#0f3d2a', fontWeight: 700, width: 130, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ flex: 1, background: '#e8d5bc', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: w }} transition={{ ...spring, delay: 0.7 + i * 0.1 }}
                        style={{ height: '100%', background: color, borderRadius: 4 }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: '#0f3d2a', fontWeight: 700, width: 20, textAlign: 'right' }}>{count}</div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '24px 12px', textAlign: 'center', border: '1px dashed #e8d5bc', borderRadius: 12, fontSize: 12, color: '#6b5e50' }}>
                No disease trends available yet
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* SECTION 3 - VILLAGE COVERAGE TABLE */}
      <motion.div custom={6} initial="hidden" animate="visible" variants={sectionVariants} 
        style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e8d5bc', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: '#0f3d2a', margin: 0 }}>Village Coverage</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div 
              onClick={() => {
                const html = `
                  <html>
                    <head>
                      <title>GramDoc Village Health Report</title>
                      <style>
                        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Mukta:wght@200;300;400;500;600;700;800&display=swap');
                        body { font-family: 'Mukta', sans-serif; color: #0f3d2a; padding: 40px; line-height: 1.5; background: #fff; }
                        .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f3d2a; padding-bottom: 20px; margin-bottom: 40px; }
                        .report-title { font-family: 'Fraunces', serif; font-style: italic; font-size: 32px; color: #0f3d2a; margin: 0; }
                        .meta { font-size: 14px; color: #6b5e50; }
                        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { background: #fdf6ec; padding: 20px; border-radius: 12px; border: 1px solid #e8d5bc; }
                        .stat-val { font-family: 'Fraunces', serif; font-size: 28px; font-weight: bold; color: #0f3d2a; }
                        .stat-label { font-size: 12px; color: #6b5e50; text-transform: uppercase; margin-top: 4px; }
                        .section { margin-bottom: 40px; }
                        .section-title { font-family: 'Fraunces', serif; font-style: italic; font-size: 20px; color: #0f3d2a; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                        table { width: 100%; border-collapse: collapse; }
                        th { text-align: left; font-size: 12px; color: #6b5e50; padding: 12px; border-bottom: 2px solid #eee; }
                        td { padding: 12px; font-size: 14px; border-bottom: 1px solid #eee; }
                        .footer { margin-top: 60px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div>
                          <h1 class="report-title">GramDoc Village Health Report</h1>
                          <div class="meta">Region: ${user?.state || 'Rural Bharat'} · Range: ${getWeekRange()}</div>
                        </div>
                        <div style="text-align: right;">
                          <div class="meta">Generated: ${new Date().toLocaleString()}</div>
                          <div class="meta">By: Dr. ${user?.name || 'GramDoc System'}</div>
                        </div>
                      </div>

                      <div class="stats-grid">
                        <div class="stat-card"><div class="stat-val">${totalConsultations}</div><div class="stat-label">Consultations</div></div>
                        <div class="stat-card"><div class="stat-val">${uniqueVillages}</div><div class="stat-label">Villages</div></div>
                        <div class="stat-card"><div class="stat-val">${prescriptionsIssued}</div><div class="stat-label">Prescriptions</div></div>
                        <div class="stat-card"><div class="stat-val">₹${travelCostSaved !== null ? Number(travelCostSaved).toLocaleString() : 'N/A'}</div><div class="stat-label">Savings</div></div>
                      </div>

                      <div class="section">
                        <h2 class="section-title">Top Disease Trends</h2>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                          ${topDiseases.map(([name, count]) => `
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                              <div style="font-weight: 600;">${name}</div>
                              <div style="background: #e8f5ee; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${Math.round((count/totalConsultations)*100)}% coverage (${count} patients)</div>
                            </div>
                          `).join('')}
                        </div>
                      </div>

                      <div class="section">
                        <h2 class="section-title">Village Coverage Details</h2>
                        <table>
                          <thead>
                            <tr><th>Village</th><th>District</th><th>Common Illness</th><th>Patients</th><th>Status</th></tr>
                          </thead>
                          <tbody>
                            ${villageData.map(v => `
                              <tr>
                                <td style="font-weight: 600;">${v.name}</td>
                                <td>${v.district}</td>
                                <td>${v.illness}</td>
                                <td>${v.patients}</td>
                                <td>${v.patients > 10 ? 'High' : 'Active'}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </div>

                      <div class="footer">
                        GramDoc Rural Health Systems · Empowering Villages via Telemedicine · www.gramdoc.in
                      </div>
                    </body>
                  </html>
                `;
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `GramDoc-Village-Report-${new Date().toISOString().split('T')[0]}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success('Report downloaded!');
              }}
              style={{ fontSize: 11, color: '#1d9e75', fontWeight: 600, cursor: 'pointer' }}
            >
              Download Full Report ↓
            </div>
            <div style={{ fontSize: 11, color: '#6b5e50' }}>{user?.state || 'Rural Bharat'}</div>
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #e8d5bc', fontSize: 10, color: '#6b5e50', fontWeight: 700, textTransform: 'uppercase' }}>
            <div>VILLAGE</div>
            <div>PATIENTS</div>
            <div>COMMON ILLNESS</div>
            <div>LAST VISIT</div>
            <div>COVERAGE</div>
          </div>
          
          {villageData.length > 0 ? villageData.map((v, i) => {
            const coverage = v.patients > 10 ? 'High' : v.patients >= 5 ? 'Medium' : 'Low'
            const badgeBg = coverage === 'High' ? '#7bcaa4' : coverage === 'Medium' ? '#f59e0b' : '#e8d5bc'
            const badgeCol = coverage === 'High' ? '#0f3d2a' : coverage === 'Medium' ? '#fff' : '#6b5e50'
            const dotCol = DISEASE_COLORS[v.illness] || '#c4653a'
            
            return (
              <motion.div key={v.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.08 }} whileHover={{ backgroundColor: '#f7f3ed' }}
                style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr', gap: 10, padding: '12px 10px', margin: '0 -10px', borderRadius: 8, borderBottom: '0.5px solid rgba(232,213,188,0.3)', alignItems: 'center', transition: 'background-color 0.15s' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{v.name}</div>
                  <div style={{ fontSize: 10, color: '#6b5e50' }}>{v.district}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f3d2a' }}>{v.patients}</div>
                  <div style={{ fontSize: 10, color: '#6b5e50' }}>patients</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotCol }} />
                  <div style={{ fontSize: 12, color: '#6b5e50' }}>{v.illness}</div>
                </div>
                <div style={{ fontSize: 12, color: '#6b5e50' }}>{v.date}</div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badgeBg, color: badgeCol }}>{coverage}</span>
                </div>
              </motion.div>
            )
          }) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', border: '2px dashed #e8d5bc', borderRadius: 16, marginTop: 20 }}>
               <div style={{ fontSize: 40, marginBottom: 12 }}>🌏</div>
               <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: '#0f3d2a' }}>No village data available</div>
               <div style={{ fontSize: 12, color: '#6b5e50', marginTop: 4 }}>Start consulting patients to see your impact data</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* SECTION 4 - IMPACT SUMMARY */}
      <motion.div custom={7} initial="hidden" animate="visible" variants={sectionVariants} 
        style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f3d2a 0%, #1d5c3a 50%, #0f3d2a 100%)', borderRadius: 16, padding: 28 }}>
        
        {/* Decorative orb */}
        <motion.div 
          animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: -50, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(123,202,164,0.1)', pointerEvents: 'none' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 22, color: '#ffffff', margin: '0 0 8px' }}>🌿 Your Impact</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Building rural healthcare, one consultation at a time</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 24 }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 42, color: '#7bcaa4', lineHeight: 1 }}>{totalConsultations}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>patients helped</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: '#7bcaa4', lineHeight: 1 }}>{uniqueVillages}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>villages reached</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 24 }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: '#7bcaa4', lineHeight: 1 }}>
                {travelCostSaved !== null ? `₹${Number(travelCostSaved).toLocaleString('en-IN')}` : 'N/A'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>travel cost saved</div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', width: '60%' }} />
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: '#7bcaa4', lineHeight: 1 }}>
                {analytics?.consultationMinutes ? `${analytics.consultationMinutes} minutes` : 'N/A'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>consultation minutes delivered</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, maxWidth: 600, margin: '0 auto' }}>
            Every GramDoc consultation saves rural patients an average of ₹800 in travel costs and 4 hours of lost wages. Thank you for making healthcare accessible. 🙏
          </div>
        </div>
      </motion.div>

    </div>
  )
}
