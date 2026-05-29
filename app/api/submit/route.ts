import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { saveResponse } from '@/lib/kv'
import { PredictionResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
    }

    const hasAtLeastOne = Object.values(answers).some(
      v => v !== undefined && v !== '' && v !== null
    )
    if (!hasAtLeastOne) {
      return NextResponse.json({ error: 'Please answer at least one question.' }, { status: 400 })
    }

    const id = uuidv4()
    const response: PredictionResponse = {
      id,
      answers,
      timestamp: new Date().toISOString(),
    }

    await saveResponse(response)

    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error('Submit error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    if (message.includes('KV') || message.includes('redis') || message.includes('connect')) {
      return NextResponse.json(
        { error: 'Storage unavailable. Make sure KV env vars are configured.' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
