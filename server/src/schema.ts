/**
 * Shared contract between the app and the AI proxy.
 *
 * The scan endpoint returns a PanelDraft — a best-effort interpretation of a
 * photographed panel that the user reviews and confirms before it becomes real
 * breakers. The JSON Schema below is handed to Claude via structured outputs
 * (`output_config.format`) so the model is constrained to this exact shape.
 */

export interface DraftBreaker {
  startSlot: number
  pole: 'single' | 'double' | 'tandem'
  amperage: number
  kind: 'standard' | 'gfci' | 'afci' | 'gfci_afci' | 'spare'
  label: string
  labelB?: string
}

export interface PanelDraft {
  name?: string
  mainAmps?: number
  slotCount: number
  columns: 1 | 2
  breakers: DraftBreaker[]
  /** Model's note on legibility / assumptions, surfaced to the user. */
  notes?: string
}

/**
 * JSON Schema for structured outputs. Every object sets
 * additionalProperties:false (required by the API) and lists required keys.
 */
export const PANEL_DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    mainAmps: { type: 'integer' },
    slotCount: { type: 'integer' },
    columns: { type: 'integer', enum: [1, 2] },
    notes: { type: 'string' },
    breakers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          startSlot: { type: 'integer' },
          pole: { type: 'string', enum: ['single', 'double', 'tandem'] },
          amperage: { type: 'integer' },
          kind: {
            type: 'string',
            enum: ['standard', 'gfci', 'afci', 'gfci_afci', 'spare'],
          },
          label: { type: 'string' },
          labelB: { type: 'string' },
        },
        required: ['startSlot', 'pole', 'amperage', 'kind', 'label'],
        additionalProperties: false,
      },
    },
  },
  required: ['slotCount', 'columns', 'breakers'],
  additionalProperties: false,
} as const

export interface ConsultMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ConsultRequest {
  question: string
  /** Optional plain-text summary of the user's panel for grounding. */
  panelSummary?: string
  history?: ConsultMessage[]
}

export interface ScanRequest {
  /** Base64-encoded image data (no data: prefix). */
  image: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
  /** Optional free-text notes the user pasted instead of / alongside a photo. */
  notes?: string
}
