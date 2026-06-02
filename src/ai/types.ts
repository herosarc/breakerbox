/** Mirrors the proxy's PanelDraft contract (server/src/schema.ts). */
import type { CircuitKind, PoleType } from '@/domain/types'

export interface DraftBreaker {
  startSlot: number
  pole: PoleType
  amperage: number
  kind: CircuitKind
  label: string
  labelB?: string
}

export interface PanelDraft {
  name?: string
  mainAmps?: number
  slotCount: number
  columns: 1 | 2
  breakers: DraftBreaker[]
  notes?: string
}

export interface ConsultMessage {
  role: 'user' | 'assistant'
  content: string
}
