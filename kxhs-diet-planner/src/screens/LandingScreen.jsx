import { useEffect, useRef } from 'react'

export default function LandingScreen({ onGuestLogin }) {
  const heroRef = useRef(null)

  // Parallax on mouse move
  useEffect(() => {
    const handler = (e) => {
      if (!heroRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      heroRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div className="screen" style={{ background: 'var(--gradient-hero)' }}>
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="screen-content" style={{ justifyContent: 'center', gap: '0' }}>

        {/* Floating emoji cluster */}
        <div ref={heroRef} style={{ textAlign: 'center', marginBottom: '2rem', transition: 'transform 0.1s ease' }}>
          <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '0.5rem', filter: 'drop-shadow(0 0 30px rgba(124,111,255,0.4))' }}>
            🥗
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '2.5rem' }}>
            <span style={{ animationDelay: '0.2s' }} className="animate-bounce-in">🧠</span>
            <span style={{ animationDelay: '0.4s' }} className="animate-bounce-in">💪</span>
            <span style={{ animationDelay: '0.6s' }} className="animate-bounce-in">✨</span>
          </div>
        </div>

        {/* Logo & tagline */}
        <div className="text-center animate-fade-up" style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(124, 111, 255, 0.12)',
            border: '1px solid rgba(124, 111, 255, 0.2)',
            borderRadius: 'var(--radius-full)',
            padding: '0.375rem 1rem',
            marginBottom: '1.25rem',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
              ✦ AI-Powered Wellness
            </span>
          </div>

          <h1 style={{
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            fontWeight: 900,
          }}>
            NutriMind
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            maxWidth: '340px',
            margin: '0 auto',
          }}>
            Your personal diet planner & mental health companion — powered by AI
          </p>
        </div>

        {/* Feature pills */}
        <div className="animate-fade-up delay-2" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: 'var(--space-2xl)',
        }}>
          {['🎯 BMI Tracker', '🥦 Meal Plans', '💬 AI Chat', '😊 Mood Log', '📈 Progress'].map(f => (
            <span key={f} className="chip active" style={{ cursor: 'default' }}>{f}</span>
          ))}
        </div>

        {/* CTAs */}
        <div className="animate-fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <button
            id="guest-login-btn"
            className="btn btn-primary btn-lg btn-block"
            onClick={onGuestLogin}
            style={{ fontSize: '1.05rem' }}
          >
            ⚡ Continue as Guest
          </button>

          <button
            id="sign-in-btn"
            className="btn btn-ghost btn-lg btn-block"
            onClick={() => {
              // Show coming soon toast
              const el = document.getElementById('toast')
              if (el) { el.style.opacity = '1'; setTimeout(() => { el.style.opacity = '0' }, 3000) }
            }}
          >
            Sign In
          </button>
        </div>

        {/* Disclaimer */}
        <p className="animate-fade-up delay-4" style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: 'var(--space-xl)',
        }}>
          No account required to get started. Guest sessions are private.
        </p>
      </div>

      {/* Toast */}
      <div id="toast" style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(30, 28, 60, 0.95)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-full)',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)',
        backdropFilter: 'blur(20px)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        zIndex: 9999,
        whiteSpace: 'nowrap',
      }}>
        🔐 Sign In coming soon! Use Guest for now.
      </div>
    </div>
  )
}
