import { useNavigate } from 'react-router-dom'
export default function Pending() {
  const nav = useNavigate()
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)', fontFamily:'var(--font-body)' }}>
      <div style={{ background:'#fff', borderRadius:20, border:'0.5px solid var(--sandstone)', padding:'48px 40px', textAlign:'center', maxWidth:420 }}>
        <div style={{ fontSize:48, marginBottom:20 }}>⏳</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:26, color:'var(--forest)', marginBottom:10 }}>Application Submitted!</h2>
        <p style={{ fontSize:13, color:'var(--warm-gray)', lineHeight:1.7, marginBottom:28 }}>
          Thank you for applying to GramDoc. Our team will verify your medical credentials within <strong>24 hours</strong>. You'll receive an email once your account is activated.
        </p>
        <div style={{ background:'var(--mint-pale)', borderRadius:12, padding:'14px 18px', marginBottom:28 }}>
          <p style={{ fontSize:12, color:'#3B6D11', lineHeight:1.6 }}>📋 Make sure your registration number is valid. We verify all doctors with the Medical Council of India.</p>
        </div>
        <button onClick={()=>nav('/')} style={{ background:'var(--forest)', color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Back to Home</button>
      </div>
    </div>
  )
}
