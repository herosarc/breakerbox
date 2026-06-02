/**
 * Pre-mapped demo home: a realistic 20-slot Square D-style panel with tandem
 * breakers, 240V double-pole lines, and ~20 appliances mapped across rooms.
 * Used by the "Load Demo Home" onboarding path.
 */
import type { Breaker, CircuitKind, Item, ItemKind, Panel, PoleType } from './types'
import { genId, now } from './util'

interface SeedBreaker {
  startSlot: number
  pole: PoleType
  amperage: number
  kind: CircuitKind
  label: string
  labelB?: string
  items: { name: string; kind: ItemKind; room?: string; circuit?: 'a' | 'b' }[]
}

const DEMO_BREAKERS: SeedBreaker[] = [
  // ----- Left bus (odd slots) -----
  {
    startSlot: 1,
    pole: 'double',
    amperage: 30,
    kind: 'standard',
    label: 'A/C Condenser',
    items: [{ name: 'Central A/C condenser', kind: 'hvac', room: 'Exterior' }],
  },
  {
    startSlot: 5,
    pole: 'double',
    amperage: 50,
    kind: 'standard',
    label: 'EV Charger',
    items: [{ name: 'EV charger (Level 2)', kind: 'appliance', room: 'Garage' }],
  },
  {
    startSlot: 9,
    pole: 'double',
    amperage: 40,
    kind: 'standard',
    label: 'Range / Oven',
    items: [{ name: 'Electric range & oven', kind: 'appliance', room: 'Kitchen' }],
  },
  {
    startSlot: 13,
    pole: 'single',
    amperage: 20,
    kind: 'standard',
    label: 'Washer',
    items: [{ name: 'Washing machine', kind: 'appliance', room: 'Utility' }],
  },
  {
    startSlot: 15,
    pole: 'single',
    amperage: 15,
    kind: 'afci',
    label: 'Bedrooms',
    items: [
      { name: 'Bedroom outlets', kind: 'outlet', room: 'Bedroom' },
      { name: 'Bedroom ceiling lights', kind: 'light', room: 'Bedroom' },
    ],
  },
  {
    startSlot: 17,
    pole: 'single',
    amperage: 15,
    kind: 'standard',
    label: 'Living Room',
    items: [
      { name: 'Living room outlets', kind: 'outlet', room: 'Living Room' },
      { name: 'TV & media center', kind: 'appliance', room: 'Living Room' },
    ],
  },
  {
    startSlot: 19,
    pole: 'tandem',
    amperage: 15,
    kind: 'standard',
    label: 'Office Outlets',
    labelB: 'Office Lights',
    items: [
      { name: 'Office computer & desk', kind: 'outlet', room: 'Office', circuit: 'a' },
      { name: 'Office lighting', kind: 'light', room: 'Office', circuit: 'b' },
    ],
  },

  // ----- Right bus (even slots) -----
  {
    startSlot: 2,
    pole: 'double',
    amperage: 30,
    kind: 'standard',
    label: 'Dryer',
    items: [{ name: 'Clothes dryer', kind: 'appliance', room: 'Utility' }],
  },
  {
    startSlot: 6,
    pole: 'double',
    amperage: 30,
    kind: 'standard',
    label: 'Water Heater',
    items: [{ name: 'Electric water heater', kind: 'appliance', room: 'Utility' }],
  },
  {
    startSlot: 10,
    pole: 'single',
    amperage: 20,
    kind: 'gfci',
    label: 'Kitchen Counter A',
    items: [
      { name: 'Microwave', kind: 'appliance', room: 'Kitchen' },
      { name: 'Coffee maker', kind: 'appliance', room: 'Kitchen' },
    ],
  },
  {
    startSlot: 12,
    pole: 'single',
    amperage: 20,
    kind: 'gfci',
    label: 'Kitchen Counter B',
    items: [
      { name: 'Toaster', kind: 'appliance', room: 'Kitchen' },
      { name: 'Blender / island outlet', kind: 'outlet', room: 'Kitchen' },
    ],
  },
  {
    startSlot: 14,
    pole: 'single',
    amperage: 20,
    kind: 'standard',
    label: 'Refrigerator',
    items: [{ name: 'Refrigerator', kind: 'appliance', room: 'Kitchen' }],
  },
  {
    startSlot: 16,
    pole: 'single',
    amperage: 20,
    kind: 'gfci',
    label: 'Garage',
    items: [
      { name: 'Garage freezer', kind: 'appliance', room: 'Garage' },
      { name: 'Garage door opener', kind: 'appliance', room: 'Garage' },
      { name: 'Peloton bike', kind: 'appliance', room: 'Garage' },
    ],
  },
  {
    startSlot: 18,
    pole: 'single',
    amperage: 20,
    kind: 'gfci',
    label: 'Bathrooms',
    items: [{ name: 'Bathroom outlets', kind: 'outlet', room: 'Bathroom' }],
  },
  {
    startSlot: 20,
    pole: 'single',
    amperage: 15,
    kind: 'standard',
    label: 'Smoke / Hall',
    items: [
      { name: 'Smoke detectors', kind: 'hardwired', room: 'Whole Home' },
      { name: 'Hallway & stair lights', kind: 'light', room: 'Hallway' },
    ],
  },
]

export interface SeedResult {
  panel: Panel
  breakers: Breaker[]
  items: Item[]
}

/** Build a fresh demo panel with unique ids and current timestamps. */
export function buildDemoHome(): SeedResult {
  const ts = now()
  const panel: Panel = {
    id: genId('panel'),
    name: 'Demo Home — Main Panel',
    location: 'Garage, north wall',
    mainAmps: 200,
    slotCount: 20,
    columns: 2,
    brand: 'Square D Homeline',
    notes: 'Sample data. Build your own panel from the home screen.',
    createdAt: ts,
    updatedAt: ts,
  }

  const breakers: Breaker[] = []
  const items: Item[] = []

  for (const sb of DEMO_BREAKERS) {
    const breaker: Breaker = {
      id: genId('brk'),
      panelId: panel.id,
      startSlot: sb.startSlot,
      pole: sb.pole,
      amperage: sb.amperage,
      kind: sb.kind,
      label: sb.label,
      labelB: sb.labelB,
      state: 'on',
      createdAt: ts,
      updatedAt: ts,
    }
    breakers.push(breaker)
    for (const it of sb.items) {
      items.push({
        id: genId('item'),
        breakerId: breaker.id,
        panelId: panel.id,
        circuit: it.circuit,
        name: it.name,
        kind: it.kind,
        room: it.room,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }

  return { panel, breakers, items }
}
