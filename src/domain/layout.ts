/**
 * Panel geometry helpers.
 *
 * North American load-center numbering: slot 1 top-left, slot 2 top-right,
 * slot 3 second-row-left, and so on. Odd numbers run down the left bus bar,
 * even numbers down the right. Slots 2k-1 and 2k share a physical row.
 *
 * A double-pole breaker spans two slots on the *same* column, which means its
 * lower slot is `startSlot + 2` (the next row down on that bus), NOT startSlot
 * + 1 (which is the other column).
 */
import type { Breaker, Panel } from './types'

export type Column = 'left' | 'right'

/** Which bus column a slot sits on. Odd = left, even = right. */
export function slotColumn(slot: number): Column {
  return slot % 2 === 1 ? 'left' : 'right'
}

/** 0-based physical row of a slot. Slots 1 & 2 are row 0, 3 & 4 are row 1. */
export function slotRow(slot: number): number {
  return Math.floor((slot - 1) / 2)
}

/** Number of physical rows in the panel. */
export function rowCount(panel: Panel): number {
  return panel.columns === 2 ? Math.ceil(panel.slotCount / 2) : panel.slotCount
}

/** The lower slot tied to a double-pole breaker whose top is `startSlot`. */
export function doublePoleSibling(startSlot: number): number {
  return startSlot + 2
}

/** Every physical slot number a breaker occupies. */
export function occupiedSlots(breaker: Breaker): number[] {
  if (breaker.pole === 'double') {
    return [breaker.startSlot, doublePoleSibling(breaker.startSlot)]
  }
  // single + tandem each fill exactly one physical slot
  return [breaker.startSlot]
}

/** Ordered slot numbers for one column, top to bottom. */
export function columnSlots(panel: Panel, column: Column): number[] {
  const slots: number[] = []
  for (let s = 1; s <= panel.slotCount; s++) {
    if (panel.columns === 1 || slotColumn(s) === column) slots.push(s)
  }
  return slots
}

/** Map of slot number -> breaker occupying it (for fast rendering/lookup). */
export function slotOccupancy(breakers: Breaker[]): Map<number, Breaker> {
  const map = new Map<number, Breaker>()
  for (const b of breakers) {
    for (const slot of occupiedSlots(b)) map.set(slot, b)
  }
  return map
}

/** True if a slot number is valid for the panel layout. */
export function isValidSlot(panel: Panel, slot: number): boolean {
  return Number.isInteger(slot) && slot >= 1 && slot <= panel.slotCount
}

/**
 * Validate that a breaker can be placed without colliding with existing ones.
 * Pass the breaker's own id when editing so it does not collide with itself.
 */
export function canPlace(
  panel: Panel,
  breakers: Breaker[],
  candidate: Pick<Breaker, 'startSlot' | 'pole'>,
  ignoreId?: string,
): { ok: true } | { ok: false; reason: string } {
  const wanted =
    candidate.pole === 'double'
      ? [candidate.startSlot, doublePoleSibling(candidate.startSlot)]
      : [candidate.startSlot]

  for (const slot of wanted) {
    if (!isValidSlot(panel, slot)) {
      return { ok: false, reason: `Slot ${slot} is outside this panel.` }
    }
  }

  if (candidate.pole === 'double' && slotColumn(candidate.startSlot) !== slotColumn(wanted[1])) {
    return { ok: false, reason: 'A double-pole breaker must span two slots on the same column.' }
  }

  const occupancy = slotOccupancy(breakers.filter((b) => b.id !== ignoreId))
  for (const slot of wanted) {
    const taken = occupancy.get(slot)
    if (taken) {
      return { ok: false, reason: `Slot ${slot} is already used by "${taken.label}".` }
    }
  }
  return { ok: true }
}

/** Human-readable position label, e.g. "1" or "1–3" for a double-pole. */
export function positionLabel(breaker: Breaker): string {
  const slots = occupiedSlots(breaker)
  return slots.length > 1 ? `${slots[0]}–${slots[slots.length - 1]}` : `${slots[0]}`
}
