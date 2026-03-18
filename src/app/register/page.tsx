'use client'
// src/app/register/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal'
]

const OCCUPATIONS = [
  { value: 'farmer', label: '🌾 Farmer / Kisan' },
  { value: 'homeowner', label: '🏠 Homeowner' },
  { value: 'student', label: '📚 Student' },
  { value: 'business', label: '💼 Small Business Owner' },
  { value: 'salaried', label: '👔 Salaried Employee' },
  { value: 'homemaker', label: '🏡 Homemaker' },
  { value: 'retired', label: '🌅 Retired' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 2-step form
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    mobile: '', state: '', occupation: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  function nextStep() {
    if (!form.name.trim()) return setError('Please enter your name')
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    if (!/[A-Z]/.test(form.password)) return setError('Password needs at least one uppercase letter')
    if (!/[0-9]/.test(form.password)) return setError('Password needs at least one number')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    setError('')
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Registration failed')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px 13px 42px',
    background: 'var(--surface2)', border: '1.5px solid var(--border)',
    borderRadius: '12px', color: 'var(--text)', fontSize: '14px',
    fontFamily: 'Poppins,sans-serif', outline: 'none', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--deep-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,184,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,184,0,0.03) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
      <div style={{ position: 'fixed', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,184,0,0.08) 0%,transparent 65%)', zIndex: 0 }} />

      <motion.div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

        {/* Header */}
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <motion.img src="/mascot.png" alt="SuryaMitra" style={{ width: '56px', filter: 'drop-shadow(0 8px 16px rgba(255,184,0,0.4))' }}
            animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <div>
            <h2 style={{ fontFamily: '"Baloo 2",cursive', fontSize: '26px', fontWeight: 800 }}>Create Account</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Join SuryaMitra — it's free!</p>
          </div>
        </motion.div>

        {/* Step indicator */}
        <motion.div style={{ display: 'flex', gap: '8px', marginBottom: '28px', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {[1, 2].map(s => (
            <motion.div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, transition: 'all 0.3s',
                background: step >= s ? 'linear-gradient(135deg,var(--sun-orange),var(--sun-yellow))' : 'var(--surface2)',
                border: step >= s ? 'none' : '1px solid var(--border)',
                color: step >= s ? 'white' : 'var(--muted)',
              }} whileTap={{ scale: 0.95 }}>{s >= step && step !== s ? '✓' : s}</motion.div>
              <span style={{ fontSize: '13px', color: step === s ? 'var(--sun-yellow)' : 'var(--muted)', fontWeight: step === s ? 600 : 400 }}>
                {s === 1 ? 'Account Info' : 'Your Profile'}
              </span>
              {s === 1 && <div style={{ width: '30px', height: '2px', background: step > 1 ? 'var(--sun-orange)' : 'var(--border)', borderRadius: '1px', transition: 'background 0.3s' }} />}
            </motion.div>
          ))}
        </motion.div>

        <motion.div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', backdropFilter: 'blur(12px)' }}
          layout initial={{ borderRadius: 20 }} animate={{ borderRadius: 20 }}>
          <form onSubmit={step === 1 ? (e => { e.preventDefault(); nextStep() }) : handleSubmit}>

            {step === 1 && (
              <>
                {/* Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '7px', color: 'var(--muted)' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>👤</span>
                    <input type="text" placeholder="Your full name" value={form.name} onChange={e => update('name', e.target.value)} required style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '7px', color: 'var(--muted)' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>📧</span>
                    <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '7px', color: 'var(--muted)' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>🔒</span>
                    <input type={showPass ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={e => update('password', e.target.value)} required style={{ ...inputStyle, paddingRight: '44px' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>{showPass ? '🙈' : '👁️'}</button>
                  </div>
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '7px', color: 'var(--muted)' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>🔑</span>
                    <input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Mobile */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '7px', color: 'var(--muted)' }}>Mobile Number <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>📱</span>
                    <input type="tel" placeholder="10-digit mobile number" value={form.mobile} onChange={e => update('mobile', e.target.value)} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </div>
                </div>

                {/* State */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '7px', color: 'var(--muted)' }}>Your State <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(for personalized schemes)</span></label>
                  <select value={form.state} onChange={e => update('state', e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '14px', appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                    <option value="">Select your state...</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Occupation */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--muted)' }}>Occupation <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                    {OCCUPATIONS.map(o => (
                      <motion.button key={o.value} type="button" onClick={() => update('occupation', o.value)}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{
                          padding: '9px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'Poppins, sans-serif', textAlign: 'left',
                          transition: 'all 0.2s',
                          background: form.occupation === o.value ? 'rgba(255,107,0,0.15)' : 'var(--surface2)',
                          border: form.occupation === o.value ? '1.5px solid var(--sun-orange)' : '1px solid var(--border)',
                          color: form.occupation === o.value ? 'var(--sun-yellow)' : 'var(--text)',
                        }}>
                        {o.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(255,82,82,0.12)', border: '1px solid rgba(255,82,82,0.3)', borderRadius: '10px', padding: '11px 14px', marginBottom: '16px', fontSize: '13px', color: '#FF5252' }}>
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg,var(--sun-orange),var(--sun-yellow))',
                border: 'none', borderRadius: '12px', color: 'white',
                fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: '"Baloo 2",cursive',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,0,0.35)',
              }}>
              {loading ? '⏳ Creating...' : step === 1 ? 'Continue →' : '🌞 Create My Account'}
            </motion.button>

            {step === 2 && (
              <motion.button type="button" onClick={() => setStep(1)}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', marginTop: '10px', fontFamily: 'Poppins,sans-serif' }}>
                ← Back
              </motion.button>
            )}
          </form>
        </motion.div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--sun-yellow)', fontWeight: 600, textDecoration: 'none' }}>Login →</Link>
        </p>
      </motion.div>
    </div>
  )
}
