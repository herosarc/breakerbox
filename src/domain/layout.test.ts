import { describe, expect, it } from 'vitest'

import {
  canPlace,
  columnSlots,
  doublePoleSibling,
  occupiedSlots,
  positionLabel,
  slotColumn,
  slotRow,
} from './layout'
import type { Breaker, Panel, PoleType } from './types'

function panel(over: Partial<Panel> = {}): Panel {
  return {
    id: 'p1',
    name: 'Test',
    slotCount: 20,
    columns: 2,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

function breaker(startSlot: number, pole: PoleType = 'single', over: Partial<Breaker> = {}): Breaker {
  return {
    id: `b${startSlot}`,
    panelId: 'p1',
    startSlot,
    pole,
    amperage: 20,
    kind: 'standard',
    label: `Breaker ${startSlot}`,
    state: 'on',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

describe('slot geometry', () => {
  it('assigns odd slots to the left bus, even to the right', () => {
    expect(slotColumn(1)).toBe('left')
    expect(slotColumn(2)).toBe('right')
    expect(slotColumn(3)).toBe('left')
  })

  it('pairs slots 2k-1 and 2k on the same row', () => {
    expect(slotRow(1)).toBe(0)
    expect(slotRow(2)).toBe(0)
    expect(slotRow(3)).toBe(1)
    expect(slotRow(4)).toBe(1)
  })

  it('orders each column top to bottom', () => {
    expect(columnSlots(panel({ slotCount: 6 }), 'left')).toEqual([1, 3, 5])
    expect(columnSlots(panel({ slotCount: 6 }), 'right')).toEqual([2, 4, 6])
  })
})

describe('breaker occupancy', () => {
  it('single and tandem fill one slot, double spans the same column', () => {
    expect(occupiedSlots(breaker(5, 'single'))).toEqual([5])
    expect(occupiedSlots(breaker(5, 'tandem'))).toEqual([5])
    expect(occupiedSlots(breaker(1, 'double'))).toEqual([1, 3])
    expect(doublePoleSibling(1)).toBe(3)
  })

  it('labels positions, ranging double-pole', () => {
    expect(positionLabel(breaker(5, 'single'))).toBe('5')
    expect(positionLabel(breaker(1, 'double'))).toBe('1–3')
  })
})

describe('canPlace', () => {
  it('accepts a valid double-pole breaker', () => {
    expect(canPlace(panel(), [], { startSlot: 1, pole: 'double' }).ok).toBe(true)
  })

  it('rejects a slot outside the panel', () => {
    const res = canPlace(panel({ slotCount: 12 }), [], { startSlot: 14, pole: 'single' })
    expect(res.ok).toBe(false)
  })

  it("rejects a double-pole whose sibling runs off the panel", () => {
    // slot 19 -> sibling 21, beyond a 20-slot panel
    const res = canPlace(panel({ slotCount: 20 }), [], { startSlot: 19, pole: 'double' })
    expect(res.ok).toBe(false)
  })

  it('rejects collisions with an existing breaker', () => {
    const existing = [breaker(1, 'double')] // occupies 1 and 3
    const res = canPlace(panel(), existing, { startSlot: 3, pole: 'single' })
    expect(res.ok).toBe(false)
  })

  it('ignores the breaker being edited', () => {
    const existing = [breaker(3, 'single', { id: 'self' })]
    const res = canPlace(panel(), existing, { startSlot: 3, pole: 'single' }, 'self')
    expect(res.ok).toBe(true)
  })
})
