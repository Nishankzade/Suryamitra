'use client'
// src/app/dashboard/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

const QUICK_ASKS = [
  { icon: '☀️', title: 'Solar Subsidy', q: 'PM Surya Ghar mein 3kW ke liye kitni subsidy milegi?' },
  { icon: '🌾', title: 'PM Kisan', q: 'PM Kisan Samman Nidhi ke liye apply kaise karein?' },
  { icon: '🏠', title: 'PM Awas', q: 'PM Awas Yojana urban mein kitna subsidy milta hai?' },
  { icon: '🏥', title: 'Ayushman', q: 'Ayushman Bharat card kaise banwayein?' },
  { icon: '💰', title: 'MUDRA Loan', q: 'MUDRA loan ke liye eligibility kya hai?' },
  { icon: '⚡', title: 'Free Bijli', q: 'Free bijli scheme kya hai aur kaise milegi?' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) setUser(d.user)
        else window.location.href = '/login'
      })
      .catch(() => { window.location.href = '/login' })
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  function startChat(q?: string) {
    if (q) {
      sessionStorage.setItem('firstMessage', q)
    }
    router.push('/chat')
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Suprabhat' : hour < 17 ? 'Namaskar' : 'Shubh Sandhya'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--deep-sky)', position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,184,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,184,0,0.03) 1px,transparent 1px)', backgroundSize: '50px 50px', zIndex: 0 }} />

      {/* NAVBAR */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,22,40,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <img src="/mascot.png" alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span style={{ fontFamily: '"Baloo 2",cursive', fontSize: 'clamp(16px,4vw,20px)', fontWeight: 800, color: 'var(--sun-yellow)' }}>SuryaMitra AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && <span style={{ fontSize: '13px', color: 'var(--muted)' }}>👤 {user.name}</span>}
          <button onClick={logout}
            style={{ background: 'none', border: '1px solid var(--border)', padding: '7px 16px', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s' }}
            onMouseOver={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,82,82,0.5)'; (e.target as HTMLButtonElement).style.color = '#FF5252' }}
            onMouseOut={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.target as HTMLButtonElement).style.color = 'var(--muted)' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(24px,5vw,50px) clamp(16px,4vw,24px)', position: 'relative', zIndex: 1 }}>

        {/* WELCOME HERO */}
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px,4vw,28px)', marginBottom: 'clamp(32px,5vw,48px)', flexWrap: 'wrap' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <motion.img src="/mascot.png" alt="SuryaMitra" style={{ width: 'clamp(80px,20vw,120px)', filter: 'drop-shadow(0 16px 40px rgba(255,184,0,0.5)) drop-shadow(0 0 25px rgba(0,245,255,0.15))' }}
            animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
          <div>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '6px' }}>🌞 {greeting}!</p>
            <h1 style={{ fontFamily: '"Baloo 2",cursive', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '12px' }}>
              Welcome back,<br />
              <span style={{ color: 'var(--sun-yellow)' }}>{user?.name || 'Friend'}!</span>
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6 }}>
              I'm ready to help you find the best government schemes and solar subsidies for you.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
              <motion.button onClick={() => startChat()} style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg,var(--sun-orange),var(--sun-yellow))',
                border: 'none', borderRadius: '12px', color: 'white',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                fontFamily: '"Baloo 2",cursive', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(255,107,0,0.35)',
              }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                ☀️ Start Chatting Now →
              </motion.button>
              <motion.button onClick={() => startChat('Surya Mittra Quiz khelna hai')} style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #FF5252, #FF1744)',
                border: 'none', borderRadius: '12px', color: 'white',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                fontFamily: '"Baloo 2",cursive', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(255,82,82,0.35)',
              }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                🎮 Play Quiz Game
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* QUICK ASK GRID */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: '"Baloo 2",cursive', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Popular Topics</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Click any topic to start instantly</p>
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap: '14px' }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            initial="hidden" animate="visible">
            {QUICK_ASKS.map((q, i) => (
              <motion.button key={q.title} onClick={() => startChat(q.q)}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(255,107,0,0.12)', borderColor: 'var(--sun-orange)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '16px', padding: '20px', textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'Poppins,sans-serif',
                }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{q.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px', color: 'var(--text)' }}>{q.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{q.q}</div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* INFO CARDS */}
        <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden" animate="visible">
          {[
            { icon: '🌐', title: 'All Languages', desc: 'Hindi, English, Marathi & more' },
            { icon: '🔊', title: 'Voice Answers', desc: 'Mascot speaks every response' },
            { icon: '💾', title: 'Chat History', desc: 'All your chats saved safely' },
            { icon: '📱', title: 'Mobile Ready', desc: 'Works on any device' },
          ].map(c => (
            <motion.div key={c.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -2, borderColor: 'rgba(255,184,0,0.3)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{c.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{c.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
