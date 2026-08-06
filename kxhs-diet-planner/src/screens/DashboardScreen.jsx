import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../App'

const MOOD_MAP = {
  happy:    { emoji: '😄', color: '#38ef7d', label: 'Happy' },
  energetic:{ emoji: '⚡', color: '#ffd166', label: 'Energetic' },
  neutral:  { emoji: '😐', color: '#4cc9f0', label: 'Neutral' },
  anxious:  { emoji: '😰', color: '#ff8c69', label: 'Anxious' },
  sad:      { emoji: '😔', color: '#ff6b9d', label: 'Sad' },
}

const BMI_META = {
  Underweight: { color: '#4cc9f0', bg: 'rgba(76,201,240,0.1)', icon: '⚖️' },
  Normal:      { color: '#38ef7d', bg: 'rgba(56,239,125,0.1)', icon: '✅' },
  Overweight:  { color: '#ffd166', bg: 'rgba(255,209,102,0.1)', icon: '⚠️' },
  Obese:       { color: '#ff6b9d', bg: 'rgba(255,107,157,0.1)', icon: '🔴' },
}

function WaterTracker({ goalMl }) {
  const cups = 8
  const mlPerCup = goalMl / cups
  const [filled, setFilled] = useState(0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span>💧</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Water Goal</span>
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-info)' }}>
          {filled * mlPerCup}ml / {goalMl}ml
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Array.from({ length: cups }).map((_, i) => (
          <button
            key={i}
            id={`water-cup-${i}`}
            onClick={() => setFilled(i < filled ? i : i + 1)}
            style={{
              width: 36, height: 44,
              borderRadius: '4px 4px 8px 8px',
              border: `2px solid ${i < filled ? 'var(--color-info)' : 'var(--border-glass)'}`,
              background: i < filled
                ? 'linear-gradient(180deg, rgba(76,201,240,0.3) 0%, rgba(76,201,240,0.6) 100%)'
                : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {i < filled && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '60%',
                background: 'linear-gradient(180deg, transparent 0%, rgba(76,201,240,0.4) 100%)',
              }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function MealSection({ meal_plan }) {
  const [open, setOpen] = useState(false)
  if (!meal_plan) return null

  const meals = [
    { icon: '🌅', label: 'Breakfast', val: meal_plan.breakfast },
    { icon: '☀️', label: 'Lunch',     val: meal_plan.lunch },
    { icon: '🌙', label: 'Dinner',    val: meal_plan.dinner },
    { icon: '🍎', label: 'Snacks',    val: meal_plan.snacks },
  ]

  return (
    <div>
      <button
        style={{
          display: 'flex', width: '100%', justifyContent: 'space-between',
          alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer',
          marginBottom: open ? 'var(--space-md)' : 0,
        }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span>🥗</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Today's Meal Plan
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', transition: 'transform var(--transition-fast)', transform: open ? 'rotate(180deg)' : 'none', fontSize: '1.2rem' }}>
          ⌄
        </span>
      </button>

      {open && (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {meals.map(m => (
            <div key={m.label} style={{
              display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
              padding: 'var(--space-sm) 0',
              borderBottom: '1px solid var(--border-glass)',
            }}>
              <span style={{ flexShrink: 0, fontSize: '1.25rem' }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: '0.2rem' }}>{m.label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{m.val}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardScreen({ sessionId, profile, analysisData, navigate, SCREENS }) {
  const [data, setData] = useState(analysisData)
  const [loading, setLoading] = useState(!analysisData)
  const [tipIdx, setTipIdx] = useState(0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙'

  useEffect(() => {
    if (data) return
    async function load() {
      try {
        const result = await apiGet(`/dashboard/${sessionId}`)
        setData({
          bmi: result.profile?.bmi,
          bmi_category: result.profile?.bmi_category,
          daily_calories: result.profile?.daily_calories,
          wellness_score: result.profile?.wellness_score,
          mood: result.today_mood?.mood,
          meal_plan: result.meal_plan,
          tips: result.tips,
          motivation: result.motivation,
          water_goal_ml: result.water_goal_ml ?? 2000,
        })
      } catch {}
      setLoading(false)
    }
    load()
  }, [sessionId, data])

  useEffect(() => {
    if (!data?.tips?.length) return
    const t = setInterval(() => setTipIdx(i => (i + 1) % data.tips.length), 5000)
    return () => clearInterval(t)
  }, [data?.tips])

  const mood = MOOD_MAP[data?.mood] ?? MOOD_MAP.neutral
  const bmiMeta = BMI_META[data?.bmi_category] ?? BMI_META.Normal
  const waterGoal = data?.water_goal_ml ?? (profile?.weight_kg ? Math.round(profile.weight_kg * 33) : 2000)

  if (loading) {
    return (
      <div className="screen" style={{ background: 'var(--bg-primary)', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" style={{ opacity: 0.5 }} />
      <div className="orb orb-2" style={{ opacity: 0.4 }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-xl) var(--space-lg) 0' }}>

          {/* Header */}
          <div className="animate-fade-up" style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {greetEmoji} {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h2 style={{ color: 'var(--text-primary)' }}>{greeting}! 👋</h2>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-full)',
                background: `${mood.color}1a`, border: `2px solid ${mood.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
              }}>
                {mood.emoji}
              </div>
            </div>
          </div>

          {/* Today's mood strip */}
          <div className="glass-card animate-fade-up delay-1" style={{
            padding: 'var(--space-md) var(--space-lg)',
            marginBottom: 'var(--space-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: `linear-gradient(135deg, ${mood.color}12 0%, rgba(255,255,255,0.03) 100%)`,
            borderColor: `${mood.color}30`,
          }}>
            <div>
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: '0.2rem' }}>Today's Mood</p>
              <p style={{ fontWeight: 600, color: mood.color, fontFamily: 'var(--font-display)' }}>
                {mood.emoji} {mood.label}
              </p>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => navigate(SCREENS.CHAT)}
              style={{ fontSize: '0.8rem' }}
            >
              Talk to AI →
            </button>
          </div>

          {/* BMI + Calories cards */}
          <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="glass-card" style={{ padding: 'var(--space-lg)', background: `linear-gradient(135deg, ${bmiMeta.bg} 0%, rgba(255,255,255,0.02) 100%)` }}>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>BMI {bmiMeta.icon}</p>
              <p style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: bmiMeta.color, lineHeight: 1 }}>{data?.bmi ?? '--'}</p>
              <span style={{ fontSize: '0.7rem', color: bmiMeta.color }}>{data?.bmi_category}</span>
            </div>
            <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Daily Target 🔥</p>
              <p style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-accent)', lineHeight: 1 }}>{data?.daily_calories ?? '--'}</p>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal/day</span>
            </div>
          </div>

          {/* Meal Plan */}
          <div className="glass-card animate-fade-up delay-3" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <MealSection meal_plan={data?.meal_plan} />
          </div>

          {/* Water Tracker */}
          <div className="glass-card animate-fade-up delay-4" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <WaterTracker goalMl={waterGoal} />
          </div>

          {/* AI Wellness Tip */}
          {data?.tips?.length > 0 && (
            <div className="glass-card animate-fade-up delay-5" style={{
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-md)',
              background: 'linear-gradient(135deg, rgba(124,111,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
              borderColor: 'rgba(124,111,255,0.2)',
            }}>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
                💡 AI Wellness Tip
              </p>
              <p key={tipIdx} className="animate-fade-in" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {data.tips[tipIdx]}
              </p>
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'var(--space-sm)' }}>
                {data.tips.map((_, i) => (
                  <div key={i} style={{
                    width: i === tipIdx ? 20 : 6, height: 6,
                    borderRadius: 3,
                    background: i === tipIdx ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
                    transition: 'width var(--transition-normal)',
                    cursor: 'pointer',
                  }} onClick={() => setTipIdx(i)} />
                ))}
              </div>
            </div>
          )}

          {/* Chat CTA */}
          <div className="animate-fade-up" style={{ marginBottom: 'var(--space-lg)' }}>
            <button
              id="chat-cta-btn"
              className="btn btn-block"
              onClick={() => navigate(SCREENS.CHAT)}
              style={{
                background: 'linear-gradient(135deg, rgba(255,107,157,0.15) 0%, rgba(124,111,255,0.15) 100%)',
                border: '1px solid rgba(255,107,157,0.2)',
                color: 'var(--text-primary)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.75rem' }}>💬</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>Chat with AI</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>Diet advice, recipes & support</div>
                </div>
              </div>
              <span style={{ color: 'var(--color-accent)' }}>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-item active" id="nav-dashboard">
          <span className="nav-icon">🏠</span>
          Home
        </button>
        <button className="nav-item" id="nav-chat" onClick={() => navigate(SCREENS.CHAT)}>
          <span className="nav-icon">💬</span>
          Chat
        </button>
        <button className="nav-item" id="nav-progress" onClick={() => navigate(SCREENS.PROGRESS)}>
          <span className="nav-icon">📈</span>
          Progress
        </button>
      </nav>
    </div>
  )
}
