/**
 * Global persisted store for panels, breakers, and items.
 *
 * Persistence uses AsyncStorage so the entire digital twin survives app
 * restarts offline. Photos are stored on the filesystem and referenced by URI
 * (strings), so the serialized state stays small.
 *
 * Handle-tie mechanics: a 240V line is modeled as a single `double` breaker
 * occupying two slots, so flipping it is inherently one action — the tied
 * handles can never disagree. Tandems are one physical unit feeding two
 * circuits and toggle together as well.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { canPlace } from '../domain/layout'
import { buildDemoHome } from '../domain/seed'
import type { Breaker, Item, Panel, SwitchState } from '../domain/types'
import { genId, now } from '../domain/util'

type PanelInput = Omit<Panel, 'id' | 'createdAt' | 'updatedAt'>
type BreakerInput = Omit<Breaker, 'id' | 'createdAt' | 'updatedAt' | 'state'> & {
  state?: SwitchState
}
type ItemInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>

export type PlaceResult = { ok: true; breaker: Breaker } | { ok: false; reason: string }

interface StoreState {
  panels: Panel[]
  breakers: Breaker[]
  items: Item[]
  activePanelId: string | null
  hydrated: boolean

  // panels
  createPanel: (input: PanelInput) => Panel
  updatePanel: (id: string, patch: Partial<PanelInput>) => void
  deletePanel: (id: string) => void
  setActivePanel: (id: string | null) => void

  // breakers
  addBreaker: (input: BreakerInput) => PlaceResult
  updateBreaker: (id: string, patch: Partial<BreakerInput>) => void
  deleteBreaker: (id: string) => void
  toggleBreaker: (id: string) => void
  setAllBreakers: (panelId: string, state: SwitchState) => void
  /** Practice mode: trip a random energized breaker. Returns its id, or null. */
  tripRandom: (panelId: string) => string | null

  // items
  addItem: (input: ItemInput) => Item
  updateItem: (id: string, patch: Partial<ItemInput>) => void
  deleteItem: (id: string) => void

  // bulk
  loadDemo: () => string
  resetAll: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      panels: [],
      breakers: [],
      items: [],
      activePanelId: null,
      hydrated: false,

      createPanel: (input) => {
        const ts = now()
        const panel: Panel = { ...input, id: genId('panel'), createdAt: ts, updatedAt: ts }
        set((s) => ({ panels: [...s.panels, panel], activePanelId: panel.id }))
        return panel
      },

      updatePanel: (id, patch) =>
        set((s) => ({
          panels: s.panels.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)),
        })),

      deletePanel: (id) =>
        set((s) => ({
          panels: s.panels.filter((p) => p.id !== id),
          breakers: s.breakers.filter((b) => b.panelId !== id),
          items: s.items.filter((i) => i.panelId !== id),
          activePanelId: s.activePanelId === id ? null : s.activePanelId,
        })),

      setActivePanel: (id) => set({ activePanelId: id }),

      addBreaker: (input) => {
        const panel = get().panels.find((p) => p.id === input.panelId)
        if (!panel) return { ok: false, reason: 'Panel not found.' }
        const siblingBreakers = get().breakers.filter((b) => b.panelId === input.panelId)
        const check = canPlace(panel, siblingBreakers, input)
        if (!check.ok) return check
        const ts = now()
        const breaker: Breaker = {
          ...input,
          state: input.state ?? 'on',
          id: genId('brk'),
          createdAt: ts,
          updatedAt: ts,
        }
        set((s) => ({ breakers: [...s.breakers, breaker] }))
        return { ok: true, breaker }
      },

      updateBreaker: (id, patch) =>
        set((s) => ({
          breakers: s.breakers.map((b) =>
            b.id === id ? { ...b, ...patch, updatedAt: now() } : b,
          ),
        })),

      deleteBreaker: (id) =>
        set((s) => ({
          breakers: s.breakers.filter((b) => b.id !== id),
          items: s.items.filter((i) => i.breakerId !== id),
        })),

      toggleBreaker: (id) =>
        set((s) => ({
          breakers: s.breakers.map((b) =>
            b.id === id ? { ...b, state: b.state === 'on' ? 'off' : 'on', updatedAt: now() } : b,
          ),
        })),

      setAllBreakers: (panelId, state) =>
        set((s) => ({
          breakers: s.breakers.map((b) =>
            b.panelId === panelId ? { ...b, state, updatedAt: now() } : b,
          ),
        })),

      tripRandom: (panelId) => {
        const candidates = get().breakers.filter((b) => b.panelId === panelId && b.state === 'on')
        if (candidates.length === 0) return null
        const target = candidates[Math.floor(Math.random() * candidates.length)]
        set((s) => ({
          breakers: s.breakers.map((b) =>
            b.id === target.id ? { ...b, state: 'off', updatedAt: now() } : b,
          ),
        }))
        return target.id
      },

      addItem: (input) => {
        const ts = now()
        const item: Item = { ...input, id: genId('item'), createdAt: ts, updatedAt: ts }
        set((s) => ({ items: [...s.items, item] }))
        return item
      },

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now() } : i)),
        })),

      deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      loadDemo: () => {
        const { panel, breakers, items } = buildDemoHome()
        set((s) => ({
          panels: [...s.panels, panel],
          breakers: [...s.breakers, ...breakers],
          items: [...s.items, ...items],
          activePanelId: panel.id,
        }))
        return panel.id
      },

      resetAll: () =>
        set({ panels: [], breakers: [], items: [], activePanelId: null }),
    }),
    {
      name: 'breakerbox-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        panels: s.panels,
        breakers: s.breakers,
        items: s.items,
        activePanelId: s.activePanelId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
