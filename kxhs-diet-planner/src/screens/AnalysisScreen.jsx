import { useEffect, useState } from 'react'
import { apiPost } from '../App'

const LOADING_MESSAGES = [
  'Calculating your BMI…',
  'Estimating daily calories…',
  'Computing wellness score…',
  'Crafting your meal plan…',
  'Generating AI suggestions…',
]

function WellnessRing({ score }) {
  const radius = 60
  const circ = 2 * Math.PI * radius
  const filled = (score / 100) * circ

  const color = score >= 75 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-accent)'

  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
      <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '2.25rem', fontWeight: 900, fontFamily: 'var(--font-display)', color }}>{score}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Wellness</span>
      </div>
    </div>
  )
}

export default function AnalysisScreen({ sessionId, profile, onDone }) {
  const [loading, setLoading] = useState(true)
  const [msgIndex, setMsgIndex] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function analyze() {
      try {
        const result = await apiPost('/analyze', { session_id: sessionId })
        setData(result)
        setLoading(false)
      } catch (e) {
        // Fallback: compute locally from profile
        const h = (profile?.height_cm ?? 170) / 100
        const bmi = +((profile?.weight_kg ?? 70) / (h * h)).toFixed(1)
        let category = 'Normal'
        if (bmi < 18.5) category = 'Underweight'
        else if (bmi >= 25 && bmi < 30) category = 'Overweight'
        else if (bmi >= 30) category = 'Obese'

        const localData = {
          bmi,
          bmi_category: category,
          daily_calories: 2000,
          wellness_score: 72,
          mood: 'neutral',
          meal_plan: {
            breakfast: 'Oats with berries and a boiled egg',
            lunch: 'Grilled chicken salad with olive oil dressing',
            dinner: 'Baked salmon with steamed broccoli and quinoa',
            snacks: 'Greek yogurt with almonds',
          },
          tips: [
            'Drink 8 glasses of water daily',
            'Walk for 30 minutes after dinner',
            'Get 7–8 hours of sleep for recovery',
          ],
          motivation: 'Every healthy choice is a step closer to your best self! 🌟',
        }
        setData(localData)
        setLoading(false)
      }
    }
    // Minimum loading time for UX
    setTimeout(analyze, 2500)
  }, [sessionId, profile])

  const bmiColor = !data ? 'var(--color-primary)'
    : data.bmi < 18.5 ? 'var(--color-info)'
    : data.bmi < 25   ? 'var(--color-success)'
    : data.bmi < 30   ? 'var(--color-warning)'
    : 'var(--color-accent)'

  return (
    <div className="screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="screen-content" style={{ justifyContent: loading ? 'center' : 'flex-start' }}>
        {loading ? (
          /* Loading state */
          <div className="animate-fade-in text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xl)' }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <div style={{
                position: 'absolute', inset: 0,
                border: '3px solid rgba(124,111,255,0.15)',
                borderTop: '3px solid var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 12,
                border: '2px solid rgba(255,107,157,0.15)',
                borderBottom: '2px solid var(--color-accent)',
                borderRadius: '50%',
                animation: 'spin 1.5s linear infinite reverse',
              }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                🧬
              </div>
            </div>

            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>AI is analyzing you</h2>
              <p key={msgIndex} className="animate-fade-in" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                {LOADING_MESSAGES[msgIndex]}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-primary)',
                  animation: `typing-dot 1.4s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        ) : (
          /* Results */
          <div style={{ paddingTop: 'var(--space-xl)' }}>
            <div className="animate-fade-up text-center" style={{ marginBottom: 'var(--space-xl)' }}>
              <span style={{ fontSize: '3rem' }}>🎉</span>
              <h2 style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>Your AI Analysis</h2>
              <p>Here's your personalized wellness snapshot</p>
            </div>

            {/* Wellness Ring */}
            <div className="glass-card animate-scale-in delay-1" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
              <WellnessRing score={data.wellness_score} />
              <p style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {data.motivation}
              </p>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div className="glass-card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: bmiColor }}>{data.bmi}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BMI</div>
                <span className="badge" style={{
                  background: `${bmiColor}1a`, color: bmiColor,
                  border: `1px solid ${bmiColor}33`, marginTop: '0.5rem', fontSize: '0.65rem',
                }}>
                  {data.bmi_category}
                </span>
              </div>

              <div className="glass-card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}>{data.daily_calories}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily kcal</div>
                <span className="badge badge-accent" style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>Target</span>
              </div>
            </div>

            {/* Tips */}
            {data.tips?.length > 0 && (
              <div className="glass-card animate-fade-up delay-3" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💡 Quick Tips
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {data.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="animate-fade-up delay-4" style={{ paddingBottom: 'var(--space-lg)' }}>
              <button
                id="go-to-dashboard-btn"
                className="btn btn-primary btn-lg btn-block"
                onClick={() => onDone(data)}
              >
                🚀 Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
