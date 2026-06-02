/**
 * Core domain types for the electrical "digital twin".
 *
 * The model mirrors a real North American load center: a panel has a fixed
 * number of numbered slots arranged in two columns. By convention odd numbers
 * run down the left bus bar and even numbers down the right, with slot N and
 * N+1 sitting on the same physical row. A breaker occupies one or more slots.
 */

/** How many physical slots a breaker fills and how it is wired. */
export type PoleType =
  | 'single' // 1 slot, one ~120V circuit
  | 'double' // 2 stacked slots on one bus, one 240V circuit (handles are tied)
  | 'tandem' // 1 slot, two independent 120V circuits (half-height / "twin")

/** Protection / role of a circuit; drives color + label treatment. */
export type CircuitKind =
  | 'standard'
  | 'gfci'
  | 'afci'
  | 'gfci_afci'
  | 'main'
  | 'subfeed'
  | 'spare'

/** Position of a switch handle. */
export type SwitchState = 'on' | 'off'

/** Kind of device connected to a circuit. */
export type ItemKind =
  | 'outlet'
  | 'light'
  | 'switch'
  | 'appliance'
  | 'hardwired'
  | 'hvac'
  | 'other'

export interface Panel {
  id: string
  name: string
  location?: string
  mainAmps?: number
  /** Total numbered slots (e.g. 20, 30, 40). */
  slotCount: number
  /** Standard residential panels are 2 columns. */
  columns: 1 | 2
  /** Manufacturer/model for flavor, e.g. "Square D Homeline". */
  brand?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Breaker {
  id: string
  panelId: string
  /** 1-based number of the top-most slot this breaker occupies. */
  startSlot: number
  pole: PoleType
  /** Handle rating in amps (15, 20, 30, 40, 50, ...). */
  amperage: number
  kind: CircuitKind
  label: string
  /**
   * For tandem breakers, the second circuit's label (the breaker fills one
   * slot but feeds two circuits). Undefined for single/double.
   */
  labelB?: string
  /** Current physical handle position. Tied handles move together. */
  state: SwitchState
  /** Optional accent color override (hex). */
  color?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Item {
  id: string
  breakerId: string
  /** Denormalized for fast per-panel queries. */
  panelId: string
  /** For tandem breakers: which circuit (a = primary, b = secondary). */
  circuit?: 'a' | 'b'
  name: string
  kind: ItemKind
  room?: string
  notes?: string
  /** Local file URI of a reference photo, if any. */
  photoUri?: string
  createdAt: number
  updatedAt: number
}
