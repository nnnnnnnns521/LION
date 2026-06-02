'use client'

import { useState, useEffect } from 'react'
import { PredictionResponse } from '@/lib/types'

const QUESTIONS: { key: keyof PredictionResponse['answers']; label: string; emoji: string }[] = [
  { key: 'q1_disappear', label: 'One thing that will completely disappear by 2066', emoji: '🌫️' },
  { key: 'q2_embarrassing', label: 'What currently normal thing will be deeply embarrassing in 40 years?', emoji: '😬' },
  { key: 'q3_headline', label: 'A future headline', emoji: '📰' },
  { key: 'q4_ice_cream_cost', label: 'NYC ice cream cone cost in 2066', emoji: '🍦' },
  { key: 'q5_ai_parenting', label: '% of parenting done by AI by 2045', emoji: '🤖' },
  { key: 'q6_side_hustle', label: "Nicole's most likely side hustle at 67", emoji: '✨' },
  { key: 'q7_at_80', label: 'Nicole at 80 will be...', emoji: '🎂' },
  { key: 'q8_belief', label: 'One thing I genuinely believe will happen in the next 40 years', emoji: '🔮' },
]

type ViewMode = 'by-question' | 'by-guest'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [responses, setResponses] = useState<PredictionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('by-question')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === 'nextforty') { setAuthed(true) }
    else { setError('Incorrect password.') }
  }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    fetch('/api/responses?password=nextforty')
      .then(r => r.json())
      .then(data => {
        if (data.responses) setResponses(data.responses)
        else setError(data.error || 'Failed to load')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [authed])

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/results`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!authed) {
    return (
      <div className="bg-pattern min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-[#C9A227] text-2xl mb-2">★ ❀ ★</div>
            <h1 className="heading-font text-3xl font-bold text-[#C2185B]">Admin Access</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" className="input-field" placeholder="Enter password"
              value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full">Enter ★</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-pattern min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-white text-2xl mb-2">❀ ★ ❀</div>
          <h1 className="heading-font text-4xl font-bold text-white mb-2">Admin View</h1>
          <p className="text-white/80 text-lg">
            {loading ? 'Loading...' : `${responses.length} of ~25 responses submitted`}
          </p>
        </div>

        <div className="card mb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <p className="heading-font font-semibold text-[#C2185B]">Shareable Results Link</p>
            <p className="text-gray-500 text-sm">/results — public but obscure</p>
          </div>
          <button onClick={copyLink} className="btn-secondary whitespace-nowrap">
            {copied ? '✓ Copied!' : 'Copy shareable link'}
          </button>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setViewMode('by-question')}
            className={viewMode === 'by-question' ? 'btn-primary px-5 py-2 rounded-lg text-sm' : 'btn-secondary px-5 py-2 rounded-lg text-sm'}
          >
            By Question
          </button>
          <button
            onClick={() => setViewMode('by-guest')}
            className={viewMode === 'by-guest' ? 'btn-primary px-5 py-2 rounded-lg text-sm' : 'btn-secondary px-5 py-2 rounded-lg text-sm'}
          >
            By Guest
          </button>
        </div>

        {error && <div className="card mb-6"><p className="text-red-600">{error}</p></div>}
        {loading && <div className="text-center text-white text-lg py-10">Loading responses...</div>}

        {/* By Question view */}
        {!loading && viewMode === 'by-question' && (
          <div className="space-y-6">
            {QUESTIONS.map(q => {
              const answers = responses
                .map((r, idx) => ({ val: r.answers[q.key], other: r.answers.q7_at_80_other, guestNum: responses.length - idx }))
                .filter(({ val }) => val !== undefined && val !== '' && val !== null)
              if (answers.length === 0) return null
              return (
                <div key={q.key} className="card">
                  <div className="flex items-start gap-3 mb-4 pb-3 border-b border-[#C9A227]/20">
                    <span className="text-2xl">{q.emoji}</span>
                    <h2 className="heading-font text-xl font-bold text-[#C2185B] leading-tight">{q.label}</h2>
                  </div>
                  <div className="space-y-3">
                    {answers.map(({ val, other, guestNum }, i) => {
                      const display =
                        q.key === 'q4_ice_cream_cost' ? `$${val}` :
                        q.key === 'q5_ai_parenting' ? `${val}%` :
                        q.key === 'q7_at_80' && val === 'Other' && other ? `Other: ${other}` :
                        String(val)
                      return (
                        <div key={i} className="flex gap-3 items-start border-l-2 border-[#C9A227]/30 pl-3 py-1">
                          <span className="text-[#C9A227] text-xs mt-1 shrink-0 font-semibold">Guest #{guestNum}</span>
                          <p className="text-gray-800 text-lg leading-relaxed">{display}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* By Guest view */}
        {!loading && viewMode === 'by-guest' && (
          <div className="space-y-6">
            {responses.map((r, idx) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="heading-font text-2xl font-bold text-[#C2185B]">
                    Guest #{responses.length - idx}
                  </h2>
                  <span className="text-gray-400 text-sm">
                    {new Date(r.timestamp).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })}
                  </span>
                </div>
                <div className="space-y-4">
                  {QUESTIONS.map(q => {
                    const val = r.answers[q.key]
                    if (val === undefined || val === '' || val === null) return null
                    return (
                      <div key={q.key}>
                        <p className="text-[#C9A227] font-semibold text-sm mb-1">{q.emoji} {q.label}</p>
                        <p className="text-gray-800 text-lg leading-relaxed">
                          {q.key === 'q4_ice_cream_cost' ? `$${val}` :
                           q.key === 'q5_ai_parenting' ? `${val}%` : String(val)}
                          {q.key === 'q7_at_80' && r.answers.q7_at_80 === 'Other' && r.answers.q7_at_80_other
                            ? `: ${r.answers.q7_at_80_other}` : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && responses.length === 0 && (
          <div className="card text-center"><p className="text-gray-500 text-lg">No responses yet. Share the link!</p></div>
        )}

        <div className="text-center mt-8 text-white/40 text-xs pb-6">★ To the Next 40 ★</div>
      </div>
    </div>
  )
}
