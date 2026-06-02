import { describe, expect, it } from 'vitest'

import { canPlace, occupiedSlots } from './layout'
import { buildDemoHome } from './seed'
import type { Breaker } from './types'

describe('buildDemoHome', () => {
  const demo = buildDemoHome()

  it('produces a 20-slot, 2-column panel', () => {
    expect(demo.panel.slotCount).toBe(20)
    expect(demo.panel.columns).toBe(2)
  })

  it('gives every breaker and item a unique id', () => {
    const ids = [...demo.breakers.map((b) => b.id), ...demo.items.map((i) => i.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places every breaker without collisions and within the panel', () => {
    const placed: Breaker[] = []
    for (const b of demo.breakers) {
      const res = canPlace(demo.panel, placed, { startSlot: b.startSlot, pole: b.pole })
      expect(res, `breaker "${b.label}" at slot ${b.startSlot}`).toMatchObject({ ok: true })
      // also assert occupied slots stay in range
      for (const slot of occupiedSlots(b)) {
        expect(slot).toBeGreaterThanOrEqual(1)
        expect(slot).toBeLessThanOrEqual(demo.panel.slotCount)
      }
      placed.push(b)
    }
  })

  it('maps every item to a real breaker on the same panel', () => {
    const breakerIds = new Set(demo.breakers.map((b) => b.id))
    for (const item of demo.items) {
      expect(breakerIds.has(item.breakerId)).toBe(true)
      expect(item.panelId).toBe(demo.panel.id)
    }
  })

  it('includes the documented mix of 240V and tandem breakers', () => {
    expect(demo.breakers.some((b) => b.pole === 'double')).toBe(true)
    expect(demo.breakers.some((b) => b.pole === 'tandem')).toBe(true)
    expect(demo.items.length).toBeGreaterThanOrEqual(20)
  })
})
