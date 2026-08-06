import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../App'

const MOOD_MAP = {
  happy:     { emoji: '😄', color: '#38ef7d' },
  energetic: { emoji: '⚡', color: '#ffd166' },
  neutral:   { emoji: '😐', color: '#4cc9f0' },
  anxious:   { emoji: '😰', color: '#ff8c69' },
  sad:       { emoji: '😔', color: '#ff6b9d' },
}

function WeightChart({ history }) {
  if (!history?.length) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
      <span style={{ fontSize: '3rem' }}>📊</span>
      <p style={{ marginTop: 'var(--space-sm)' }}>Check in daily to see your progress chart</p>
    </div>
  )

  const values = history.map(h => h.weight_kg)
  const min = Math.min(...values) - 2
  const max = Math.max(...values) + 2
  const range = max - min || 1
  const W = 320, H = 120

  const pts = values.map((v, i) => ({
    x: (i / Math.max(values.length - 1, 1)) * (W - 20) + 10,
    y: H - ((v - min) / range) * (H - 20) - 10,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M ${pts[0]?.x},${H} ` + pts.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${pts[pts.length - 1]?.x},${H} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#chartGrad)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 6px var(--color-primary))' }}
        />
        {pts.map((p, i) => (
          <circle
            key={i} cx={p.x} cy={p.y} r={4}
            fill="var(--color-primary)"
            stroke="var(--bg-primary)"
            strokeWidth="2"
          />
        ))}
      </svg>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Start</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Now</span>
      </div>
    </div>
  )
}

export default function ProgressScreen({ sessionId, profile, navigate, SCREENS }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkinWeight, setCheckinWeight] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkinDone, setCheckinDone] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet(`/progress/${sessionId}`)
        setData(result)
      } catch {
        setData({ weight_history: [], mood_history: [], streak: 0, start_weight: null, current_weight: null })
      }
      setLoading(false)
    }
    load()
  }, [sessionId])

  async function handleCheckin() {
    const w = parseFloat(checkinWeight)
    if (!w || w < 20 || w > 300) return
    setChecking(true)
    try {
      await apiPost('/checkin', { session_id: sessionId, weight_kg: w })
      setCheckinDone(true)
      setCheckinWeight('')
      // Refresh
      const result = await apiGet(`/progress/${sessionId}`)
      setData(result)
    } catch {}
    setChecking(false)
  }

  const weightChange = data?.current_weight && data?.start_weight
    ? +(data.current_weight - data.start_weight).toFixed(1)
    : null

  if (loading) {
    return (
      <div className="screen" style={{ background: 'var(--bg-primary)', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" style={{ opacity: 0.4 }} />
      <div className="orb orb-2" style={{ opacity: 0.3 }} />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-xl) var(--space-lg) 0' }}>

          <div className="animate-fade-up" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2>Your Progress 📈</h2>
            <p style={{ marginTop: '0.25rem' }}>Track your wellness journey over time</p>
          </div>

          {/* Streak + Stats */}
          <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}>
                🔥 {data?.streak ?? 0}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>Day Streak</div>
            </div>
            <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                {data?.current_weight ?? profile?.weight_kg ?? '--'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>kg Now</div>
            </div>
            <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: weightChange === null ? 'var(--text-muted)' : weightChange < 0 ? 'var(--color-success)' : weightChange > 0 ? 'var(--color-accent)' : 'var(--color-info)' }}>
                {weightChange === null ? '—' : weightChange > 0 ? `+${weightChange}` : weightChange}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>kg Change</div>
            </div>
          </div>

          {/* Weight Chart */}
          <div className="glass-card animate-fade-up delay-2" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              ⚖️ Weight History
            </h3>
            <WeightChart history={data?.weight_history} />
          </div>

          {/* Daily Check-in */}
          <div className="glass-card animate-fade-up delay-3" style={{
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-md)',
            background: checkinDone
              ? 'linear-gradient(135deg, rgba(56,239,125,0.1) 0%, rgba(255,255,255,0.02) 100%)'
              : 'var(--gradient-card)',
            borderColor: checkinDone ? 'rgba(56,239,125,0.3)' : 'var(--border-glass)',
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              📋 Daily Check-in
            </h3>

            {checkinDone ? (
              <div className="animate-bounce-in text-center" style={{ padding: 'var(--space-md)' }}>
                <span style={{ fontSize: '2.5rem' }}>✅</span>
                <p style={{ marginTop: '0.5rem', color: 'var(--color-success)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  Check-in recorded!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                <input
                  id="checkin-weight-input"
                  type="number"
                  className="input-field"
                  placeholder="Weight in kg"
                  value={checkinWeight}
                  onChange={e => setCheckinWeight(e.target.value)}
                  step="0.1"
                  min="20" max="300"
                  style={{ flex: 1 }}
                />
                <button
                  id="checkin-submit-btn"
                  className="btn btn-success"
                  onClick={handleCheckin}
                  disabled={!checkinWeight || checking}
                  style={{ flexShrink: 0 }}
                >
                  {checking ? (
                    <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : '✓ Log'}
                </button>
              </div>
            )}
          </div>

          {/* Mood History */}
          <div className="glass-card animate-fade-up delay-4" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              💭 Mood History
            </h3>
            {!data?.mood_history?.length ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-md)' }}>
                No mood entries yet. Start chatting to log your mood!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.mood_history.slice(0, 10).map((entry, i) => {
                  const m = MOOD_MAP[entry.mood] ?? MOOD_MAP.neutral
                  const date = new Date(entry.recorded_at * 1000)
                  return (
                    <div key={i} className={`animate-slide-right delay-${Math.min(i + 1, 5)}`} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                      padding: 'var(--space-sm) 0',
                      borderBottom: i < data.mood_history.length - 1 ? '1px solid var(--border-glass)' : 'none',
                    }}>
                      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{m.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: m.color, fontSize: '0.875rem', fontFamily: 'var(--font-display)' }}>
                          {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <div key={s} style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: s <= entry.mood_score ? m.color : 'rgba(255,255,255,0.1)',
                          }} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-item" id="nav-dashboard-from-progress" onClick={() => navigate(SCREENS.DASHBOARD)}>
          <span className="nav-icon">🏠</span>
          Home
        </button>
        <button className="nav-item" id="nav-chat-from-progress" onClick={() => navigate(SCREENS.CHAT)}>
          <span className="nav-icon">💬</span>
          Chat
        </button>
        <button className="nav-item active" id="nav-progress">
          <span className="nav-icon">📈</span>
          Progress
        </button>
      </nav>
    </div>
  )
}
