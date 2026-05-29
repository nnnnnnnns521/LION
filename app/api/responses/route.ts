import { NextRequest, NextResponse } from 'next/server'
import { getAllResponses } from '@/lib/kv'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  if (password !== 'nextforty') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const responses = await getAllResponses()
    return NextResponse.json({ responses })
  } catch (err) {
    console.error('Responses error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    if (message.includes('KV') || message.includes('redis') || message.includes('connect')) {
      return NextResponse.json(
        { error: 'Storage unavailable. Make sure KV env vars are configured.' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
