import { describe, expect, it } from 'vitest'

import { diagnoseOutage } from './diagnostics'
import type { Breaker, Item } from './types'

function breaker(over: Partial<Breaker> = {}): Breaker {
  return {
    id: 'b1',
    panelId: 'p1',
    startSlot: 1,
    pole: 'single',
    amperage: 20,
    kind: 'standard',
    label: 'Test Circuit',
    state: 'on',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

function item(name: string, over: Partial<Item> = {}): Item {
  return {
    id: `i-${name}`,
    breakerId: 'b1',
    panelId: 'p1',
    name,
    kind: 'appliance',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

describe('diagnoseOutage', () => {
  it('flags an off breaker as the likely fix', () => {
    const d = diagnoseOutage(breaker({ state: 'off' }), [])
    expect(d.breakerIsOff).toBe(true)
    expect(d.headline).toMatch(/OFF/)
    expect(d.steps[0]?.kind).toBe('action')
  })

  it('suggests a GFCI reset for a wet-area circuit that is on', () => {
    const b = breaker({ kind: 'gfci' })
    const d = diagnoseOutage(b, [item('Bathroom outlet', { room: 'Bathroom' })])
    expect(d.breakerIsOff).toBe(false)
    expect(d.steps.some((s) => /GFCI/i.test(s.title))).toBe(true)
  })

  it('asks whether other devices on the circuit are also dead', () => {
    const d = diagnoseOutage(breaker(), [item('Lamp'), item('TV')], item('Lamp'))
    expect(d.steps.some((s) => /this circuit/i.test(s.title))).toBe(true)
  })

  it('always closes with a safety / call-a-pro caution', () => {
    const d = diagnoseOutage(breaker(), [item('Lamp')])
    expect(d.steps.some((s) => s.kind === 'warn')).toBe(true)
  })
})
