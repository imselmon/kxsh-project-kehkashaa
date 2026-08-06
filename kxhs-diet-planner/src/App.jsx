import { useState, useEffect } from 'react'
import './index.css'
import LandingScreen from './screens/LandingScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import DashboardScreen from './screens/DashboardScreen'
import ChatScreen from './screens/ChatScreen'
import ProgressScreen from './screens/ProgressScreen'

// ── API base: points to blaze-backend ──
// We are pointing directly to the deployed backend URL now.
const API_BASE = 'https://nutrimind-backend.scattrhq.workers.dev/api'

export async function apiPost(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function apiGet(path) {
  const r = await fetch(`${API_BASE}${path}`)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

// Screens enum
const SCREENS = {
  LANDING: 'landing',
  ONBOARDING: 'onboarding',
  ANALYSIS: 'analysis',
  DASHBOARD: 'dashboard',
  CHAT: 'chat',
  PROGRESS: 'progress',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING)
  const [sessionId, setSessionId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nutrimind_session')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSessionId(parsed.sessionId)
        setProfile(parsed.profile)
        setScreen(SCREENS.DASHBOARD)
      } catch {}
    }
  }, [])

  function saveSession(sid, prof) {
    localStorage.setItem('nutrimind_session', JSON.stringify({ sessionId: sid, profile: prof }))
  }

  async function handleGuestLogin() {
    try {
      const { session_id } = await apiPost('/session', {})
      setSessionId(session_id)
      setScreen(SCREENS.ONBOARDING)
    } catch (e) {
      console.error(e)
      // For local dev without backend, create a mock session
      const mockId = crypto.randomUUID()
      setSessionId(mockId)
      setScreen(SCREENS.ONBOARDING)
    }
  }

  async function handleOnboardingComplete(formData, moodData) {
    try {
      const result = await apiPost('/onboard', { session_id: sessionId, ...formData })
      await apiPost('/mood', { session_id: sessionId, ...moodData })
      setProfile({ ...formData, ...result })
      saveSession(sessionId, { ...formData, ...result })
      setScreen(SCREENS.ANALYSIS)
    } catch (e) {
      console.error('Onboard error:', e)
      // fallback: compute locally
      const h = formData.height_cm / 100
      const bmi = +(formData.weight_kg / (h * h)).toFixed(1)
      const prof = { ...formData, bmi }
      setProfile(prof)
      saveSession(sessionId ?? 'local', prof)
      setScreen(SCREENS.ANALYSIS)
    }
  }

  async function handleAnalysisDone(data) {
    setAnalysisData(data)
    setScreen(SCREENS.DASHBOARD)
  }

  function navigate(s) { setScreen(s) }

  const sharedProps = { sessionId, profile, navigate, SCREENS }

  return (
    <div id="app-root">
      {screen === SCREENS.LANDING && (
        <LandingScreen onGuestLogin={handleGuestLogin} />
      )}
      {screen === SCREENS.ONBOARDING && (
        <OnboardingScreen {...sharedProps} onComplete={handleOnboardingComplete} />
      )}
      {screen === SCREENS.ANALYSIS && (
        <AnalysisScreen {...sharedProps} onDone={handleAnalysisDone} onAnalysisData={setAnalysisData} />
      )}
      {screen === SCREENS.DASHBOARD && (
        <DashboardScreen {...sharedProps} analysisData={analysisData} dashboardData={dashboardData} setDashboardData={setDashboardData} />
      )}
      {screen === SCREENS.CHAT && (
        <ChatScreen {...sharedProps} />
      )}
      {screen === SCREENS.PROGRESS && (
        <ProgressScreen {...sharedProps} />
      )}
    </div>
  )
}
