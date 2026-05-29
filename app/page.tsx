'use client'

import { useState } from 'react'
import { PredictionAnswers } from '@/lib/types'

const DEADLINE = new Date('2026-06-06T22:00:00-04:00') // 10pm ET June 6, 2026

const AT_80_OPTIONS = [
  'Arguing with her AI assistant about why it doesn\'t understand her vision',
  'Running the Nantucket triathlon (been training since 2026)',
  'Finally keeping plants alive',
  'Hosting her luxury retreat brand\'s 10th anniversary season',
  'On three boards and somehow joining a fourth',
  'Launching yet another company ("This one\'s different, I mean it")',
  'Other',
]

function Divider() {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="gold-divider flex-1" />
      <span className="text-[#C9A227] text-lg">❀</span>
      <div className="gold-divider flex-1" />
    </div>
  )
}

function QuestionLabel({ num, text }: { num: number; text: string }) {
  return (
    <label className="block mb-2">
      <span className="text-[#C9A227] font-semibold text-sm mr-2">★ {num}.</span>
      <span className="heading-font text-lg font-semibold text-gray-800">{text}</span>
    </label>
  )
}

export default function GuestFormPage() {
  const now = new Date()
  const isPastDeadline = now >= DEADLINE

  const [answers, setAnswers] = useState<PredictionAnswers>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showOther, setShowOther] = useState(false)

  function handleChange(field: keyof PredictionAnswers, value: string | number) {
    setAnswers(prev => ({ ...prev, [field]: value }))
  }

  function hasAtLeastOne(): boolean {
    return Object.values(answers).some(v => v !== undefined && v !== '' && v !== null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasAtLeastOne()) {
      setError('Please answer at least one question before submitting.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-pattern min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-white text-2xl mb-2">❀ ★ ❀</div>
          <h1 className="heading-font text-5xl md:text-6xl font-bold text-white mb-3 leading-tight">
            To the Next 40
          </h1>
          <p className="text-white/90 text-xl heading-font italic">
            Nicole&apos;s Birthday Predictions
          </p>
          <div className="text-white/70 text-sm mt-3 font-light">
            Predictions close June 6, 2026 at 10:00pm ET
          </div>
        </div>

        {isPastDeadline ? (
          <div className="card text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="heading-font text-3xl font-bold text-[#F72585] mb-3">
              The predictions are in!
            </h2>
            <p className="text-gray-600 text-lg">
              Thank you to everyone who submitted. See you in 40 years. 🥂
            </p>
          </div>
        ) : submitted ? (
          <div className="card text-center">
            <div className="text-5xl mb-4">🥂</div>
            <h2 className="heading-font text-3xl font-bold text-[#F72585] mb-3">
              Your predictions are locked in.
            </h2>
            <p className="text-gray-600 text-lg">
              See you in 40 years.
            </p>
            <div className="mt-6 text-[#C9A227] text-xl">★ ❀ ★</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-0">
            <div className="card">
              <p className="text-gray-600 text-sm text-center italic mb-1">
                All questions are optional — answer as many or as few as you like.
              </p>
            </div>

            <div className="mt-6 card">
              <QuestionLabel num={1} text="One thing that will completely disappear by 2066" />
              <textarea
                className="input-field mt-1"
                placeholder="Think big..."
                value={answers.q1_disappear ?? ''}
                onChange={e => handleChange('q1_disappear', e.target.value)}
                rows={3}
              />
            </div>

            <Divider />

            <div className="card">
              <QuestionLabel num={2} text="What currently normal thing will be deeply embarrassing in 40 years?" />
              <textarea
                className="input-field mt-1"
                placeholder="Something we all do today that future generations will cringe at..."
                value={answers.q2_embarrassing ?? ''}
                onChange={e => handleChange('q2_embarrassing', e.target.value)}
                rows={3}
              />
            </div>

            <Divider />

            <div className="card">
              <QuestionLabel num={3} text="Write a future headline" />
              <p className="text-gray-400 text-xs italic mb-2 ml-5">
                e.g. &ldquo;Millennials Refuse To Retire&rdquo; · &ldquo;AI Therapist Wins Nobel Prize&rdquo; · &ldquo;Nicole Silver Opens Luxury Eco Retreat&rdquo;
              </p>
              <textarea
                className="input-field mt-1"
                placeholder="Your headline here..."
                value={answers.q3_headline ?? ''}
                onChange={e => handleChange('q3_headline', e.target.value)}
                rows={2}
              />
            </div>

            <Divider />

            <div className="card">
              <QuestionLabel num={4} text="NYC ice cream cone cost in 2066: $____" />
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#C9A227] font-bold text-lg">$</span>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  value={answers.q4_ice_cream_cost ?? ''}
                  onChange={e => handleChange('q4_ice_cream_cost', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <Divider />

            <div className="card">
              <QuestionLabel num={5} text="% of parenting done by AI by 2045: ___%" />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  min={0}
                  max={100}
                  value={answers.q5_ai_parenting ?? ''}
                  onChange={e => handleChange('q5_ai_parenting', parseInt(e.target.value))}
                />
                <span className="text-[#C9A227] font-bold text-lg">%</span>
              </div>
            </div>

            <Divider />

            <div className="card">
              <QuestionLabel num={6} text="Nicole's most likely side hustle at 67" />
              <textarea
                className="input-field mt-1"
                placeholder="Be specific..."
                value={answers.q6_side_hustle ?? ''}
                onChange={e => handleChange('q6_side_hustle', e.target.value)}
                rows={3}
              />
            </div>

            <Divider />

            <div className="card">
              <QuestionLabel num={7} text="Nicole at 80 will be..." />
              <div className="mt-2 space-y-2">
                {AT_80_OPTIONS.map(option => (
                  <label key={option} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="q7_at_80"
                      value={option}
                      checked={answers.q7_at_80 === option}
                      onChange={() => {
                        handleChange('q7_at_80', option)
                        setShowOther(option === 'Other')
                        if (option !== 'Other') {
                          handleChange('q7_at_80_other', '')
                        }
                      }}
                      className="mt-1 accent-[#F72585]"
                    />
                    <span className="text-gray-700 group-hover:text-[#F72585] transition-colors text-sm leading-relaxed">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
              {showOther && (
                <input
                  type="text"
                  className="input-field mt-3"
                  placeholder="Describe your vision..."
                  value={answers.q7_at_80_other ?? ''}
                  onChange={e => handleChange('q7_at_80_other', e.target.value)}
                />
              )}
            </div>

            <Divider />

            <div className="card">
              <QuestionLabel num={8} text="One thing I genuinely believe will happen in the next 40 years" />
              <textarea
                className="input-field mt-1"
                placeholder="Your honest prediction..."
                value={answers.q8_belief ?? ''}
                onChange={e => handleChange('q8_belief', e.target.value)}
                rows={3}
              />
            </div>

            <div className="mt-8 text-center">
              {error && (
                <p className="text-red-600 mb-4 text-sm bg-red-50 rounded-lg p-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-lg px-10 py-4 rounded-xl shadow-lg"
              >
                {submitting ? 'Locking in your predictions...' : 'Submit My Predictions ★'}
              </button>
              <p className="text-white/60 text-xs mt-4">
                ❀ Your predictions are stored safely for the big reveal ❀
              </p>
            </div>
          </form>
        )}

        <div className="text-center mt-8 text-white/40 text-xs pb-6">
          ★ To the Next 40 ★
        </div>
      </div>
    </div>
  )
}
