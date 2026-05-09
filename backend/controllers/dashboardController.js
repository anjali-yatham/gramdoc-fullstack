export async function getStats(req, res) {
  try {
    res.json({
      doctorsOnline: 12,
      patientsToday: 342,
      avgWaitMinutes: 4,
      consultationsThisMonth: 1284,
      upcomingFollowUp: { date: new Date(Date.now() + 7*24*60*60*1000).toISOString(), doctor: 'Dr. Priya Sharma', type: 'Follow-up' },
      recentPrescriptions: 2,
      healthTip: 'Drink at least 8 glasses of water daily. Staying hydrated helps prevent many common illnesses.'
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}
