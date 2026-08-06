import { useState } from 'react'

const MOODS = [
  { id: 'happy',    emoji: '😄', label: 'Happy',    score: 5, color: '#38ef7d' },
  { id: 'energetic',emoji: '⚡', label: 'Energetic', score: 4, color: '#ffd166' },
  { id: 'neutral',  emoji: '😐', label: 'Neutral',  score: 3, color: '#4cc9f0' },
  { id: 'anxious',  emoji: '😰', label: 'Anxious',  score: 2, color: '#ff8c69' },
  { id: 'sad',      emoji: '😔', label: 'Sad',      score: 1, color: '#ff6b9d' },
]

const GOALS = [
  { id: 'lose',     emoji: '🔥', label: 'Lose Weight',  sub: 'Burn fat, get lean' },
  { id: 'maintain', emoji: '⚖️', label: 'Maintain',     sub: 'Stay balanced' },
  { id: 'gain',     emoji: '💪', label: 'Gain Weight',  sub: 'Build muscle mass' },
]

const STEPS = ['Age', 'Height', 'Weight', 'Goal', 'Mood']

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    age: 25,
    height_cm: 170,
    weight_kg: 70,
    goal: '',
    height_unit: 'cm',
    weight_unit: 'kg',
  })
  const [selectedMood, setSelectedMood] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const progress = ((step) / STEPS.length) * 100

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function ftToCm(ft, inch = 0) { return Math.round(ft * 30.48 + inch * 2.54) }
  function lbsToKg(lbs) { return +(lbs * 0.453592).toFixed(1) }

  async function finish() {
    if (!selectedMood) return
    setSubmitting(true)
    const formData = {
      age: form.age,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      goal: form.goal,
    }
    const moodData = {
      mood: selectedMood.id,
      mood_score: selectedMood.score,
    }
    await onComplete(formData, moodData)
    setSubmitting(false)
  }

  return (
    <div className="screen" style={{ background: 'var(--bg-secondary)' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="screen-content">
        {/* Header */}
        <div style={{ paddingTop: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              Step {step + 1} of {STEPS.length}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              {STEPS[step]}
            </span>
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Steps */}
        <div style={{ flex: 1 }}>
          {/* Step 0: Age */}
          {step === 0 && (
            <div className="animate-fade-up">
              <h2 style={{ marginBottom: '0.5rem' }}>How old are you? 🎂</h2>
              <p style={{ marginBottom: 'var(--space-2xl)' }}>Your age helps us personalize your nutrition plan.</p>

              <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{
                  fontSize: '6rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                  marginBottom: 'var(--space-xl)',
                }}>
                  {form.age}
                </div>
                <input
                  id="age-slider"
                  type="range"
                  min={13} max={90} step={1}
                  value={form.age}
                  onChange={e => update('age', +e.target.value)}
                  className="slider"
                  style={{ marginBottom: 'var(--space-md)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <span>13</span><span>years old</span><span>90</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Height */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h2 style={{ marginBottom: '0.5rem' }}>Your height 📏</h2>
              <p style={{ marginBottom: 'var(--space-xl)' }}>Used to calculate your BMI accurately.</p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-lg)' }}>
                {['cm', 'ft'].map(u => (
                  <button key={u} onClick={() => update('height_unit', u)}
                    className={`btn btn-sm ${form.height_unit === u ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}>
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{
                  fontSize: '5rem', fontWeight: 900, fontFamily: 'var(--font-display)',
                  background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: 'var(--space-md)',
                }}>
                  {form.height_unit === 'cm'
                    ? `${form.height_cm}`
                    : `${Math.floor(form.height_cm / 30.48)}'${Math.round((form.height_cm % 30.48) / 2.54)}"`}
                  <span style={{ fontSize: '1.5rem', opacity: 0.6 }}> {form.height_unit}</span>
                </div>
                <input type="range" min={120} max={220} step={1}
                  value={form.height_cm}
                  onChange={e => update('height_cm', +e.target.value)}
                  className="slider" style={{ marginBottom: 'var(--space-md)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <span>120cm</span><span>220cm</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Weight */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h2 style={{ marginBottom: '0.5rem' }}>Your weight ⚖️</h2>
              <p style={{ marginBottom: 'var(--space-xl)' }}>We'll track your progress over time.</p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-lg)' }}>
                {['kg', 'lbs'].map(u => (
                  <button key={u} onClick={() => update('weight_unit', u)}
                    className={`btn btn-sm ${form.weight_unit === u ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}>
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{
                  fontSize: '5rem', fontWeight: 900, fontFamily: 'var(--font-display)',
                  background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: 'var(--space-md)',
                }}>
                  {form.weight_unit === 'kg'
                    ? `${form.weight_kg}`
                    : `${Math.round(form.weight_kg / 0.453592)}`}
                  <span style={{ fontSize: '1.5rem', opacity: 0.6 }}> {form.weight_unit}</span>
                </div>
                <input type="range"
                  min={form.weight_unit === 'kg' ? 30 : 66}
                  max={form.weight_unit === 'kg' ? 200 : 440}
                  step={form.weight_unit === 'kg' ? 0.5 : 1}
                  value={form.weight_unit === 'kg' ? form.weight_kg : Math.round(form.weight_kg / 0.453592)}
                  onChange={e => {
                    const v = +e.target.value
                    update('weight_kg', form.weight_unit === 'kg' ? v : lbsToKg(v))
                  }}
                  className="slider" style={{ marginBottom: 'var(--space-md)' }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <div className="animate-fade-up">
              <h2 style={{ marginBottom: '0.5rem' }}>What's your goal? 🎯</h2>
              <p style={{ marginBottom: 'var(--space-xl)' }}>Your goal shapes your daily calorie target and meal plan.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {GOALS.map((g, i) => (
                  <button
                    key={g.id}
                    id={`goal-${g.id}`}
                    onClick={() => update('goal', g.id)}
                    className={`animate-fade-up delay-${i + 1}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-lg)',
                      padding: 'var(--space-lg)',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${form.goal === g.id ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                      background: form.goal === g.id
                        ? 'rgba(124, 111, 255, 0.12)'
                        : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-normal)',
                      textAlign: 'left',
                      boxShadow: form.goal === g.id ? '0 0 24px var(--color-primary-glow)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '2.5rem' }}>{g.emoji}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{g.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>{g.sub}</div>
                    </div>
                    {form.goal === g.id && (
                      <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontSize: '1.5rem' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Mood */}
          {step === 4 && (
            <div className="animate-fade-up">
              <h2 style={{ marginBottom: '0.5rem' }}>How are you feeling? 💭</h2>
              <p style={{ marginBottom: 'var(--space-xl)' }}>Your current mood helps us tailor support and advice.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: 'var(--space-xl)' }}>
                {MOODS.map((m, i) => (
                  <button
                    key={m.id}
                    id={`mood-${m.id}`}
                    onClick={() => setSelectedMood(m)}
                    className={`animate-scale-in delay-${i + 1}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.875rem 0.5rem',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${selectedMood?.id === m.id ? m.color : 'var(--border-glass)'}`,
                      background: selectedMood?.id === m.id
                        ? `${m.color}1a`
                        : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-normal)',
                      boxShadow: selectedMood?.id === m.id ? `0 0 20px ${m.color}44` : 'none',
                    }}
                  >
                    <span style={{
                      fontSize: '2rem',
                      transform: selectedMood?.id === m.id ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform var(--transition-normal)',
                    }}>
                      {m.emoji}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: selectedMood?.id === m.id ? m.color : 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>

              {selectedMood && (
                <div className="glass-card animate-scale-in" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    You're feeling <strong style={{ color: selectedMood.color }}>{selectedMood.label}</strong> — we'll personalize your plan accordingly 💙
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-lg)' }}>
          {step > 0 && (
            <button className="btn btn-ghost" style={{ flex: '0 0 auto' }} onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <button
            id={step === STEPS.length - 1 ? 'finish-onboarding-btn' : 'next-step-btn'}
            className="btn btn-primary btn-block"
            style={{ flex: 1 }}
            disabled={
              (step === 3 && !form.goal) ||
              (step === 4 && !selectedMood) ||
              submitting
            }
            onClick={() => {
              if (step < STEPS.length - 1) setStep(s => s + 1)
              else finish()
            }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                Saving...
              </span>
            ) : step === STEPS.length - 1 ? (
              '✨ Analyze My Profile'
            ) : (
              'Continue →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
