import Anthropic from '@anthropic-ai/sdk'

import {
  PANEL_DRAFT_SCHEMA,
  type ConsultRequest,
  type PanelDraft,
  type ScanRequest,
} from './schema.js'

// Resolves ANTHROPIC_API_KEY from the environment. Never hardcode the key.
const client = new Anthropic()

const MODEL = 'claude-opus-4-8'

const SCAN_SYSTEM = `You are an expert electrician digitizing a residential or light-commercial electrical panel from a photo or pasted notes.

Read the panel labels and breaker handles and produce a structured layout:
- North American panels are two columns: odd slot numbers (1,3,5…) run down the left bus, even (2,4,6…) down the right. Slots 2k-1 and 2k share a physical row.
- A 240V breaker is "double" pole and occupies two slots on the SAME column, so its top slot is N and its sibling is N+2 (e.g. 1 & 3). Set startSlot to the TOP slot only.
- A "tandem" breaker fills one physical slot but feeds two circuits; put the second circuit's name in labelB.
- Everything else is "single".
- Infer amperage from the handle number (15/20/30/40/50…). If a handle is blank/unused, label it "Spare" with kind "spare".
- Classify kind from labels/markings: GFCI, AFCI, both, or standard.

Be faithful to what you can actually read. If the image is partially illegible, fill in what you can and explain assumptions and uncertainty in "notes". Do not invent circuits that aren't visible. Set slotCount to the panel's total slot capacity if visible, otherwise the highest slot you mapped rounded up to an even number.`

const CONSULT_SYSTEM = `You are a knowledgeable, safety-first virtual electrician helping a homeowner understand and work with their electrical panel. You explain clearly and practically, in plain language.

Hard rules:
- Lead with safety. Electricity can kill. Anything involving opening the panel, touching wiring, or working on energized circuits should be done by a licensed electrician.
- For tasks behind the dead-front (panel cover), wiring changes, aluminum wiring, water damage, burning smells, scorch marks, or repeated tripping: tell the user to STOP and call a licensed electrician.
- You may help with: identifying which breaker controls what, safely switching breakers on/off, resetting GFCI outlets, understanding circuit types and amperage, planning (what an electrician would need to do), and general code-awareness (note that local codes and a permit may apply).
- Never give step-by-step instructions for working inside the panel or on live wiring.
- Always close with a brief reminder that this is general information, not a substitute for a licensed electrician, and that local codes apply.

Be concise and concrete. Use the user's panel context when provided.`

/** Run the vision scan and return a validated PanelDraft. */
export async function scanPanel(req: ScanRequest): Promise<PanelDraft> {
  const userBlocks: Anthropic.ContentBlockParam[] = [
    {
      type: 'image',
      source: { type: 'base64', media_type: req.mediaType, data: req.image },
    },
  ]
  if (req.notes?.trim()) {
    userBlocks.push({ type: 'text', text: `Additional notes from the user:\n${req.notes.trim()}` })
  }
  userBlocks.push({
    type: 'text',
    text: 'Digitize this panel into the structured layout. Map every visible breaker.',
  })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: [{ type: 'text', text: SCAN_SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { format: { type: 'json_schema', schema: PANEL_DRAFT_SCHEMA } },
    messages: [{ role: 'user', content: userBlocks }],
  })

  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text
  if (!text) throw new Error('Model returned no structured output.')
  return JSON.parse(text) as PanelDraft
}

/**
 * Stream an electrician consultation. Returns the SDK stream so the route can
 * forward text deltas as Server-Sent Events. Adaptive thinking lets the model
 * reason about safety before answering; only the visible text is streamed.
 */
export function consultStream(req: ConsultRequest): ReturnType<typeof client.messages.stream> {
  const messages: Anthropic.MessageParam[] = []
  for (const m of req.history ?? []) {
    messages.push({ role: m.role, content: m.content })
  }
  const grounding = req.panelSummary?.trim()
    ? `Here is the user's panel for context:\n${req.panelSummary.trim()}\n\nQuestion: ${req.question}`
    : req.question
  messages.push({ role: 'user', content: grounding })

  return client.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: [{ type: 'text', text: CONSULT_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages,
  })
}
