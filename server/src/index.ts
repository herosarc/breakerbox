import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'

import { consultStream, scanPanel } from './anthropic.js'
import type { ConsultRequest, ScanRequest } from './schema.js'

const app = express()
// Panel photos are sent base64-encoded; allow a generous body size.
app.use(express.json({ limit: '12mb' }))
app.use(cors())

const PORT = Number(process.env.PORT ?? 8787)
const SHARED_SECRET = process.env.PROXY_SHARED_SECRET ?? ''

/** Optional bearer-token gate so the proxy isn't open to the world. */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!SHARED_SECRET) return next() // auth disabled (local dev)
  const header = req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token !== SHARED_SECRET) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) })
})

app.post('/v1/scan', requireAuth, async (req: Request, res: Response) => {
  const body = req.body as Partial<ScanRequest>
  if (!body?.image || !body.mediaType) {
    res.status(400).json({ error: 'image and mediaType are required' })
    return
  }
  try {
    const draft = await scanPanel(body as ScanRequest)
    res.json(draft)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'scan failed'
    console.error('scan_failed', message)
    res.status(502).json({ error: message })
  }
})

app.post('/v1/consult', requireAuth, async (req: Request, res: Response) => {
  const body = req.body as Partial<ConsultRequest>
  if (!body?.question?.trim()) {
    res.status(400).json({ error: 'question is required' })
    return
  }

  // Stream tokens to the client as Server-Sent Events.
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = consultStream(body as ConsultRequest)
    stream.on('text', (delta: string) => {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`)
    })
    await stream.finalMessage()
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'consult failed'
    console.error('consult_failed', message)
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
})

app.listen(PORT, () => {
  console.log(`BreakerBox AI proxy listening on :${PORT}`)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set — requests will fail.')
  }
})
