'use client'

import { useEffect, useState } from 'react'
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

export default function ResultsPage() {
  const [responses, setResponses] = useState<PredictionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/responses?password=nextforty')
      .then(r => r.json())
      .then(data => {
        if (data.responses) setResponses(data.responses)
        else setError(data.error || 'Failed to load')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-pattern min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-white text-2xl mb-2">❀ ★ ❀</div>
          <h1 className="heading-font text-5xl font-bold text-white mb-3">To the Next 40</h1>
          <p className="text-white/90 text-xl heading-font italic">Nicole's Birthday Predictions</p>
          <p className="text-white/60 text-sm mt-2">{responses.length} predictions submitted</p>
        </div>

        {loading && (
          <div className="card text-center py-10 text-gray-500">Loading predictions...</div>
        )}
        {error && (
          <div className="card text-center py-10 text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-10">
            {QUESTIONS.map((q, qi) => {
              const answers = responses
                .map(r => ({
                  val: r.answers[q.key],
                  other: r.answers.q7_at_80_other,
                }))
                .filter(({ val }) => val !== undefined && val !== '' && val !== null)

              if (answers.length === 0) return null

              return (
                <div key={q.key}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="gold-divider flex-1" />
                    <span className="text-[#C9A227] text-lg">★</span>
                    <div className="gold-divider flex-1" />
                  </div>
                  <div className="card">
                    <div className="flex items-start gap-3 mb-5">
                      <span className="text-2xl">{q.emoji}</span>
                      <h2 className="heading-font text-xl font-bold text-[#F72585] leading-tight">
                        {q.label}
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {answers.map(({ val, other }, i) => {
                        const display =
                          q.key === 'q4_ice_cream_cost' ? `$${val}` :
                          q.key === 'q5_ai_parenting' ? `${val}%` :
                          q.key === 'q7_at_80' && val === 'Other' && other
                            ? `Other: ${other}` :
                          String(val)
                        return (
                          <div
                            key={i}
                            className="flex gap-3 items-start border-l-2 border-[#C9A227]/30 pl-3 py-1"
                          >
                            <span className="text-[#C9A227] text-xs mt-1 shrink-0">
                              Guest #{responses.findIndex(r => {
                                const v = r.answers[q.key]
                                return v !== undefined && v !== '' && v !== null
                              } ) + i + 1}
                            </span>
                            <p className="text-gray-800 leading-relaxed">{display}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center mt-12 pb-8">
          <div className="text-[#C9A227] text-3xl mb-2">❀ ★ ❀</div>
          <p className="text-white/70 heading-font italic text-lg">See you in 40 years. 🥂</p>
        </div>
      </div>
    </div>
  )
}
