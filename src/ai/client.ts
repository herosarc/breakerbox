/**
 * Thin client for the BreakerBox AI proxy.
 *
 * The proxy URL is injected at build time via EXPO_PUBLIC_AI_PROXY_URL. When it
 * is unset the AI features are considered "not configured" and the UI shows
 * setup guidance instead of failing — the offline digital twin works without it.
 */
import type { ConsultMessage, PanelDraft } from './types'

const BASE_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL?.replace(/\/$/, '') ?? ''
const TOKEN = process.env.EXPO_PUBLIC_AI_PROXY_TOKEN ?? ''

export function isAiConfigured(): boolean {
  return BASE_URL.length > 0
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  return headers
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI proxy is not configured (EXPO_PUBLIC_AI_PROXY_URL is unset).')
    this.name = 'AiNotConfiguredError'
  }
}

/** Send a panel photo (and/or notes) and get back a draft layout. */
export async function scanPanel(input: {
  image?: string
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp'
  notes?: string
}): Promise<PanelDraft> {
  if (!isAiConfigured()) throw new AiNotConfiguredError()
  const res = await fetch(`${BASE_URL}/v1/scan`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Scan failed (${res.status}). ${detail}`)
  }
  return (await res.json()) as PanelDraft
}

/**
 * Ask the virtual electrician. The proxy streams Server-Sent Events; in v1 we
 * read the full response and concatenate the text deltas (live token streaming
 * is a future enhancement — RN fetch has limited stream-body support).
 */
export async function consult(input: {
  question: string
  panelSummary?: string
  history?: ConsultMessage[]
}): Promise<string> {
  if (!isAiConfigured()) throw new AiNotConfiguredError()
  const res = await fetch(`${BASE_URL}/v1/consult`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Consult failed (${res.status}). ${detail}`)
  }

  const raw = await res.text()
  let answer = ''
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue
    const payload = trimmed.slice(5).trim()
    if (payload === '[DONE]') break
    try {
      const obj = JSON.parse(payload) as { delta?: string; error?: string }
      if (obj.error) throw new Error(obj.error)
      if (obj.delta) answer += obj.delta
    } catch {
      // ignore keep-alive / non-JSON lines
    }
  }
  return answer.trim()
}
