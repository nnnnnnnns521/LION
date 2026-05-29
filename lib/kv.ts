import { kv } from '@vercel/kv'
import { PredictionResponse } from './types'

export async function saveResponse(response: PredictionResponse): Promise<void> {
  await kv.set(`response:${response.id}`, response)
  await kv.rpush('responses:index', response.id)
}

export async function getAllResponses(): Promise<PredictionResponse[]> {
  const ids = await kv.lrange<string>('responses:index', 0, -1)
  if (!ids || ids.length === 0) return []

  const responses = await Promise.all(
    ids.map((id) => kv.get<PredictionResponse>(`response:${id}`))
  )

  return responses
    .filter((r): r is PredictionResponse => r !== null)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((r, index, arr) => ({ ...r, guestNumber: arr.length - index }))
}

export async function getResponseCount(): Promise<number> {
  const ids = await kv.lrange('responses:index', 0, -1)
  return ids?.length ?? 0
}
