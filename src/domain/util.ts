/** Small id + time helpers (avoids a uuid dependency; collision-safe enough). */

let counter = 0

/** Short, sortable-ish unique id. */
export function genId(prefix = 'id'): string {
  counter = (counter + 1) % 1_000_000
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`
}

export function now(): number {
  return Date.now()
}
