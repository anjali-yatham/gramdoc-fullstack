import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { safeParse } from '../utils/api'
import toast from 'react-hot-toast'

const COLORS = {
  forest: '#0f3d2a',
  mint: '#7bcaa4',
  cream: '#fdf6ec',
  sandstone: '#e8d5bc',
  warmGray: '#6b5e50',
}

const FONTS = {
  display: 'Fraunces, serif',
  body: 'Mukta, sans-serif',
}

export default function PharmacyProfile() {
  const user = safeParse(localStorage.getItem('gramdoc_user'), {})
  
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('gd_pharmacy_profile')
    if (saved) return JSON.parse(saved)
    return {
      pharmacyName: user.name || 'GramDoc Pharmacy',
      ownerName: 'Rajesh Kumar',
      email: user.email || 'pharmacy@gramdoc.com',
      phone: user.phone || '+91 98765 43210',
      address: '123 Main Street, Kondapur',
      pincode: '500084',
      district: 'Hyderabad',
      state: 'Telangana',
      licenseNumber: 'LIC-AP-2024-XXXX',
      memberSince: 'May 2026',
      morningShift: true,
      eveningShift: true,
      sundayOpen: false,
      deliveryAvailable: true,
      deliveryRadius: 5,
      deliveryFee: 20,
      minOrderForFreeDelivery: 500,
      accountHolder: 'Rajesh Kumar',
      accountNumber: '****1234',
      ifscCode: 'SBIN0001234',
      upiId: 'pharmacy@paytm'
    }
  })

  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    localStorage.setItem('gd_pharmacy_profile', JSON.stringify(profile))
  }, [profile])

  const handleSave = () => {
    setEditMode(false)
    toast.success('Profile updated!')
  }

  const initials = profile.pharmacyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: FONTS.body, padding: '32px' }}>
      <h1 style={{ 
        fontFamily: FONTS.display, 
        fontStyle: 'italic', 
        fontSize: 32, 
        color: COLORS.forest,
        marginBottom: 8
      }}>
        👤 Profile
      </h1>
      <p style={{ fontSize: 13, color: COLORS.warmGray, marginBottom: 24 }}>
        Manage your pharmacy information
      </p>

      {/* PROFILE HERO CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 24
        }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2d5fa3, #1a3d6b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 800,
          color: '#fff'
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            fontFamily: FONTS.display, 
            fontStyle: 'italic', 
            fontSize: 24, 
            color: COLORS.forest,
            marginBottom: 8
          }}>
            {profile.pharmacyName}
          </h2>
          <div style={{
            display: 'inline-block',
            background: '#e8f5ee',
            color: COLORS.mint,
            padding: '4px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 8
          }}>
            ✓ GramDoc Verified
          </div>
          <div style={{ fontSize: 13, color: COLORS.warmGray, marginTop: 8 }}>
            License: {profile.licenseNumber}
          </div>
          <div style={{ fontSize: 13, color: COLORS.warmGray }}>
            Member since: {profile.memberSince}
          </div>
        </div>
        <button
          onClick={() => editMode ? handleSave() : setEditMode(true)}
          style={{
            background: editMode ? COLORS.mint : COLORS.forest,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONTS.body
          }}
        >
          {editMode ? '💾 Save Changes' : '✏️ Edit Profile'}
        </button>
      </motion.div>

      {/* DETAILS SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 20 }}>
          Pharmacy Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {[
            { label: 'Pharmacy Name', key: 'pharmacyName' },
            { label: 'Owner Name', key: 'ownerName' },
            { label: 'Email Address', key: 'email' },
            { label: 'Phone Number', key: 'phone' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                type="text"
                value={profile[field.key]}
                onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                disabled={!editMode}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${editMode ? COLORS.mint : COLORS.sandstone}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: FONTS.body,
                  background: editMode ? '#fff' : COLORS.cream,
                  color: COLORS.forest
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
            Full Address
          </label>
          <textarea
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            disabled={!editMode}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: `2px solid ${editMode ? COLORS.mint : COLORS.sandstone}`,
              borderRadius: 10,
              fontSize: 14,
              fontFamily: FONTS.body,
              background: editMode ? '#fff' : COLORS.cream,
              color: COLORS.forest,
              resize: 'none'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
          {[
            { label: 'Pincode', key: 'pincode' },
            { label: 'District', key: 'district' },
            { label: 'State', key: 'state' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                type="text"
                value={profile[field.key]}
                onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                disabled={!editMode}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${editMode ? COLORS.mint : COLORS.sandstone}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: FONTS.body,
                  background: editMode ? '#fff' : COLORS.cream,
                  color: COLORS.forest
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* OPERATING HOURS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 20 }}>
          Operating Hours
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Morning (8 AM - 2 PM)', key: 'morningShift' },
            { label: 'Evening (4 PM - 9 PM)', key: 'eveningShift' },
            { label: 'Sunday', key: 'sundayOpen' },
          ].map(shift => (
            <div key={shift.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: COLORS.forest }}>{shift.label}</span>
              <div
                onClick={() => editMode && setProfile({ ...profile, [shift.key]: !profile[shift.key] })}
                style={{
                  width: 50,
                  height: 26,
                  borderRadius: 13,
                  background: profile[shift.key] ? COLORS.mint : COLORS.sandstone,
                  position: 'relative',
                  cursor: editMode ? 'pointer' : 'default',
                  transition: 'background 0.3s'
                }}
              >
                <motion.div
                  animate={{ x: profile[shift.key] ? 26 : 2 }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 2
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* DELIVERY SETTINGS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 20 }}>
          Delivery Settings
        </h3>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: COLORS.forest }}>Delivery Available</span>
            <div
              onClick={() => editMode && setProfile({ ...profile, deliveryAvailable: !profile.deliveryAvailable })}
              style={{
                width: 50,
                height: 26,
                borderRadius: 13,
                background: profile.deliveryAvailable ? COLORS.mint : COLORS.sandstone,
                position: 'relative',
                cursor: editMode ? 'pointer' : 'default',
                transition: 'background 0.3s'
              }}
            >
              <motion.div
                animate={{ x: profile.deliveryAvailable ? 26 : 2 }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
              Delivery Radius (km)
            </label>
            <input
              type="number"
              value={profile.deliveryRadius}
              onChange={(e) => setProfile({ ...profile, deliveryRadius: parseInt(e.target.value) })}
              disabled={!editMode}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `2px solid ${editMode ? COLORS.mint : COLORS.sandstone}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: FONTS.body,
                background: editMode ? '#fff' : COLORS.cream,
                color: COLORS.forest
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
              Delivery Fee (₹)
            </label>
            <input
              type="number"
              value={profile.deliveryFee}
              onChange={(e) => setProfile({ ...profile, deliveryFee: parseInt(e.target.value) })}
              disabled={!editMode}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `2px solid ${editMode ? COLORS.mint : COLORS.sandstone}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: FONTS.body,
                background: editMode ? '#fff' : COLORS.cream,
                color: COLORS.forest
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
              Min Order for Free Delivery (₹)
            </label>
            <input
              type="number"
              value={profile.minOrderForFreeDelivery}
              onChange={(e) => setProfile({ ...profile, minOrderForFreeDelivery: parseInt(e.target.value) })}
              disabled={!editMode}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `2px solid ${editMode ? COLORS.mint : COLORS.sandstone}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: FONTS.body,
                background: editMode ? '#fff' : COLORS.cream,
                color: COLORS.forest
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* BANK DETAILS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
          Bank Details
        </h3>
        <p style={{ fontSize: 12, color: COLORS.warmGray, marginBottom: 20 }}>
          For GramDoc weekly settlements
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {[
            { label: 'Account Holder Name', key: 'accountHolder' },
            { label: 'Account Number', key: 'accountNumber' },
            { label: 'IFSC Code', key: 'ifscCode' },
            { label: 'UPI ID', key: 'upiId' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                type="text"
                value={profile[field.key]}
                onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                disabled={!editMode}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${editMode ? COLORS.mint : COLORS.sandstone}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: FONTS.body,
                  background: editMode ? '#fff' : COLORS.cream,
                  color: COLORS.forest
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* SUBSCRIPTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 20 }}>
          Subscription Plan
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Basic', price: 'Free', commission: '8%', features: ['Partner listing'] },
            { name: 'Pro', price: '₹299/month', commission: '6%', features: ['Priority listing', 'Analytics'] },
            { name: 'Premium', price: '₹499/month', commission: '5%', features: ['Featured pharmacy', 'Advanced analytics', 'Priority support'] },
          ].map((plan, i) => (
            <div
              key={plan.name}
              style={{
                border: `2px solid ${i === 0 ? COLORS.mint : COLORS.sandstone}`,
                borderRadius: 12,
                padding: 20,
                background: i === 0 ? '#e8f5ee' : '#fff'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.mint, marginBottom: 4 }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 13, color: COLORS.warmGray, marginBottom: 12 }}>
                {plan.commission} commission
              </div>
              <div style={{ fontSize: 12, color: COLORS.warmGray }}>
                {plan.features.map((f, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>• {f}</div>
                ))}
              </div>
              {i === 0 && (
                <div style={{
                  marginTop: 12,
                  padding: '6px 12px',
                  background: COLORS.mint,
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: 'center'
                }}>
                  CURRENT PLAN
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
