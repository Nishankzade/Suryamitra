'use client'
// src/app/login/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || `Login failed (${res.status})`)
        setLoading(false)
        return
      }

      if (!data.success) {
        setError('Login did not succeed. Please try again.')
        setLoading(false)
        return
      }

      // Full page redirect — forces browser to send new cookie to middleware
      window.location.replace('/dashboard')

    } catch (err: any) {
      setError('Network error: ' + (err?.message || 'Please check your connection'))
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--deep-sky)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,184,0,0.03) 1px, transparent 1px), linear-gradient(90deg,rgba(255,184,0,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />
      <div style={{
        position: 'fixed', top: '-200px', right: '-200px',
        width: '600px', height: '600px', borderRadius: '50%', zIndex: 0,
        background: 'radial-gradient(circle, rgba(255,184,0,0.1) 0%, transparent 65%)',
        animation: 'float 4s ease-in-out infinite',
      }} />

      {/* Left panel — hidden on mobile */}
      <div style={{
        width: '45%', minWidth: '320px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 40px', position: 'relative', zIndex: 1,
        borderRight: '1px solid var(--border)',
      }} className="hidden-mobile">

        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.4,
          background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,184,0,0.05) 20deg, transparent 40deg, transparent 80deg, rgba(255,107,0,0.04) 100deg, transparent 120deg, transparent 160deg, rgba(255,184,0,0.05) 180deg, transparent 200deg, transparent 240deg, rgba(255,107,0,0.04) 260deg, transparent 280deg, transparent 320deg, rgba(255,184,0,0.05) 340deg, transparent 360deg)',
          animation: 'spin-slow 25s linear infinite',
        }} />

        <motion.div style={{
          width: '220px', height: '260px', position: 'relative', marginBottom: '32px',
          filter: 'drop-shadow(0 20px 50px rgba(255,184,0,0.4)) drop-shadow(0 0 30px rgba(0,245,255,0.15))',
        }} animate={{ y: [0, -14, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          <img src="/mascot.png" alt="SuryaMitra" style={{ width: '100%', height: 'auto' }} />
        </motion.div>

        <h1 style={{
          fontFamily: '"Baloo 2", cursive', fontSize: '36px', fontWeight: 800,
          color: 'var(--sun-yellow)', textAlign: 'center', marginBottom: '12px',
          textShadow: '0 0 30px rgba(255,184,0,0.4)',
        }}>
          SuryaMitra AI
        </h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', maxWidth: '320px', lineHeight: 1.7, fontSize: '15px' }}>
          India's smartest AI guide for government schemes, solar subsidies, and energy policies
        </p>

        <motion.div style={{
          display: 'flex', gap: '32px', marginTop: '40px',
          padding: '20px 32px', background: 'rgba(255,184,0,0.06)',
          border: '1px solid var(--border)', borderRadius: '16px',
        }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          {[{ num: '500+', label: 'Schemes' }, { num: '28+', label: 'States' }, { num: '24/7', label: 'Available' }].map(s => (
            <motion.div key={s.label} style={{ textAlign: 'center' }}
              whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <div style={{ fontFamily: '"Baloo 2",cursive', fontSize: '24px', fontWeight: 800, color: 'var(--sun-yellow)' }}>{s.num}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right panel - login form */}
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px,5vw,40px) clamp(16px,4vw,24px)', position: 'relative', zIndex: 1,
      }}>
        <motion.div style={{ width: '100%', maxWidth: '420px' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

          <motion.div style={{ justifyContent: 'center', marginBottom: '24px' }} className="show-mobile"
            animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <img src="/mascot.png" alt="SuryaMitra" style={{ width: '100px', filter: 'drop-shadow(0 12px 28px rgba(255,184,0,0.5)) drop-shadow(0 0 20px rgba(0,245,255,0.2))' }} />
          </motion.div>

          <h2 style={{ fontFamily: '"Baloo 2",cursive', fontSize: '30px', fontWeight: 800, marginBottom: '8px' }}>
            Welcome back! 👋
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '32px' }}>
            Login to talk to SuryaMitra
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--muted)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>📧</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px',
                    background: 'var(--surface2)', border: '1.5px solid var(--border)',
                    borderRadius: '12px', color: 'var(--text)', fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif', outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--muted)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px 44px 13px 42px',
                    background: 'var(--surface2)', border: '1.5px solid var(--border)',
                    borderRadius: '12px', color: 'var(--text)', fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif', outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    background: 'rgba(255,82,82,0.12)', border: '1px solid rgba(255,82,82,0.3)',
                    borderRadius: '10px', padding: '12px 14px', marginBottom: '18px',
                    fontSize: '13px', color: '#FF5252', display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--sun-orange), var(--sun-yellow))',
                border: 'none', borderRadius: '12px', color: 'white',
                fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: '"Baloo 2", cursive', letterSpacing: '0.5px',
                transition: 'all 0.25s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,0,0.35)',
              }}
            >
              {loading ? '⏳ Logging in...' : '🌞 Login to SuryaMitra'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--muted)' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--sun-yellow)', fontWeight: 600, textDecoration: 'none' }}>
              Register here →
            </Link>
          </p>

          <motion.div style={{
            marginTop: '20px', padding: '12px 16px',
            background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)',
            borderRadius: '10px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center',
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            🇮🇳 Supports Hindi, English, Marathi, Gujarati & more
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
