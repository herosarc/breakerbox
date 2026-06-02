import { describe, expect, it } from 'vitest'

import { searchPanel } from './search'
import type { Breaker, Item } from './types'

const breakers: Breaker[] = [
  {
    id: 'b6',
    panelId: 'p1',
    startSlot: 6,
    pole: 'single',
    amperage: 20,
    kind: 'standard',
    label: 'Refrigerator',
    state: 'on',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'b10',
    panelId: 'p1',
    startSlot: 10,
    pole: 'single',
    amperage: 20,
    kind: 'gfci',
    label: 'Kitchen Counter',
    state: 'on',
    createdAt: 0,
    updatedAt: 0,
  },
]

const items: Item[] = [
  { id: 'i1', breakerId: 'b10', panelId: 'p1', name: 'Microwave', kind: 'appliance', room: 'Kitchen', createdAt: 0, updatedAt: 0 },
  { id: 'i2', breakerId: 'b6', panelId: 'p1', name: 'Refrigerator', kind: 'appliance', room: 'Kitchen', createdAt: 0, updatedAt: 0 },
]

describe('searchPanel', () => {
  it('returns nothing for an empty query', () => {
    expect(searchPanel('   ', breakers, items)).toEqual([])
  })

  it('matches a device by name', () => {
    const hits = searchPanel('microwave', breakers, items)
    expect(hits[0]?.breaker.id).toBe('b10')
    expect(hits[0]?.items.some((i) => i.name === 'Microwave')).toBe(true)
  })

  it('matches a breaker label by subsequence', () => {
    const hits = searchPanel('rfgrt', breakers, items) // subsequence of "Refrigerator"
    expect(hits.some((h) => h.breaker.id === 'b6')).toBe(true)
  })

  it('matches by room and ranks exact matches first', () => {
    const hits = searchPanel('Kitchen Counter', breakers, items)
    expect(hits[0]?.breaker.id).toBe('b10')
  })
})
