import { useState, useRef, useEffect } from 'react'

const API_BASE = 'https://nutrimind-backend.scattrhq.workers.dev/api'

const QUICK_REPLIES = [
  { id: 'diet',    emoji: '🥗', text: 'Diet advice' },
  { id: 'recipe',  emoji: '🍳', text: 'Healthy recipe' },
  { id: 'mood',    emoji: '💙', text: "I'm feeling low" },
  { id: 'motivate',emoji: '💪', text: 'Motivate me' },
]

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm your NutriMind AI companion 🌿\n\nI'm here to help with diet advice, healthy recipes, mood support, and daily motivation. What's on your mind?",
  id: 'init',
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', padding: '0.75rem 1rem' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-primary)',
          animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className="animate-fade-up" style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 'var(--space-sm)',
      gap: '0.75rem',
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
        }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '0.75rem 1rem',
        borderRadius: isUser
          ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
          : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
        background: isUser
          ? 'linear-gradient(135deg, var(--color-primary), #a855f7)'
          : 'rgba(255,255,255,0.05)',
        border: isUser ? 'none' : '1px solid var(--border-glass)',
        color: isUser ? 'white' : 'var(--text-primary)',
        fontSize: '0.9rem',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        backdropFilter: isUser ? 'none' : 'blur(10px)',
        boxShadow: isUser ? '0 4px 20px rgba(124,111,255,0.3)' : 'none',
      }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
        }}>
          👤
        </div>
      )}
    </div>
  )
}

export default function ChatScreen({ sessionId, navigate, SCREENS }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim(), id: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiMessages = newMessages
        .filter(m => m.id !== 'init')
        .map(({ role, content }) => ({ role, content }))

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, messages: apiMessages }),
      })

      if (!res.ok) throw new Error('API error')

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('text/event-stream')) {
        // Streaming response
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        const aiMsg = { role: 'assistant', content: '', id: Date.now() + 1 }
        setMessages(prev => [...prev, aiMsg])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          // Parse SSE
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6)
              if (raw === '[DONE]') break
              try {
                const parsed = JSON.parse(raw)
                const token = parsed?.response ?? parsed?.choices?.[0]?.delta?.content ?? ''
                accumulated += token
                setMessages(prev =>
                  prev.map(m => m.id === aiMsg.id ? { ...m, content: accumulated } : m)
                )
              } catch {}
            }
          }
        }
      } else {
        // JSON response (non-streaming fallback)
        const data = await res.json()
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content ?? "I'm here to help! 💙",
          id: Date.now() + 1,
        }])
      }
    } catch (e) {
      // Graceful fallback
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having a moment. But remember — every step towards your health goal counts! 💪\n\nPlease try again in a second.",
        id: Date.now() + 1,
      }])
    }
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="orb orb-1" style={{ opacity: 0.3 }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-lg)',
        background: 'rgba(15,15,36,0.8)',
        borderBottom: '1px solid var(--border-glass)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
        maxWidth: 480, width: '100%', margin: '0 auto',
      }}>
        <button
          id="chat-back-btn"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(SCREENS.DASHBOARD)}
          style={{ padding: '0.5rem 0.75rem' }}
        >
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 0 16px var(--color-primary-glow)',
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>NutriMind AI</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        {messages.map(msg => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--space-sm)', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
            }}>🤖</div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
            }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div style={{
        padding: '0 var(--space-lg) var(--space-sm)',
        maxWidth: 480, width: '100%', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {QUICK_REPLIES.map(qr => (
            <button
              key={qr.id}
              id={`quick-reply-${qr.id}`}
              className="chip"
              onClick={() => sendMessage(qr.text)}
              disabled={loading}
            >
              {qr.emoji} {qr.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div style={{
        display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
        padding: 'var(--space-md) var(--space-lg)',
        padding: `var(--space-md) var(--space-lg) max(var(--space-md), env(safe-area-inset-bottom))`,
        background: 'rgba(15,15,36,0.95)',
        borderTop: '1px solid var(--border-glass)',
        backdropFilter: 'blur(20px)',
        maxWidth: 480, width: '100%', margin: '0 auto',
      }}>
        <textarea
          ref={inputRef}
          id="chat-input"
          className="input-field"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            resize: 'none',
            maxHeight: '120px',
            lineHeight: '1.5',
            borderRadius: 'var(--radius-lg)',
          }}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          id="send-message-btn"
          className="btn btn-primary"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0, padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-lg)' }}
        >
          {loading ? (
            <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          ) : '→'}
        </button>
      </div>
    </div>
  )
}
