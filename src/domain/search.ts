/**
 * Recall engine: fuzzy search across breakers and the devices mapped to them.
 *
 * Lightweight subsequence + token scoring (no dependency). Good enough to find
 * "fridge", "micro", or "bedroom" instantly across a household panel.
 */
import type { Breaker, Item } from './types'

export interface SearchHit {
  breaker: Breaker
  /** Why it matched — the device name, the breaker label, or a room. */
  matchedOn: string
  /** Matching items on this breaker (empty if the breaker label matched). */
  items: Item[]
  score: number
}

/** Case-insensitive subsequence test ("frg" matches "Refrigerator"). */
function subsequence(needle: string, haystack: string): boolean {
  let i = 0
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++
  }
  return i === needle.length
}

function scoreText(query: string, text: string): number {
  const q = query.toLowerCase().trim()
  const t = text.toLowerCase()
  if (!q) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  if (subsequence(q, t)) return 30
  return 0
}

export function searchPanel(
  query: string,
  breakers: Breaker[],
  items: Item[],
): SearchHit[] {
  const q = query.trim()
  if (!q) return []

  const itemsByBreaker = new Map<string, Item[]>()
  for (const it of items) {
    const list = itemsByBreaker.get(it.breakerId) ?? []
    list.push(it)
    itemsByBreaker.set(it.breakerId, list)
  }

  const hits: SearchHit[] = []
  for (const breaker of breakers) {
    const breakerItems = itemsByBreaker.get(breaker.id) ?? []

    let best = 0
    let matchedOn = ''
    const matchingItems: Item[] = []

    // Device names are the most useful match.
    for (const it of breakerItems) {
      const s = Math.max(scoreText(q, it.name), it.room ? scoreText(q, it.room) - 5 : 0)
      if (s > 0) {
        matchingItems.push(it)
        if (s > best) {
          best = s
          matchedOn = scoreText(q, it.name) >= (it.room ? scoreText(q, it.room) : 0) ? it.name : it.room ?? it.name
        }
      }
    }

    // Breaker label / secondary label.
    const labelScore = Math.max(scoreText(q, breaker.label), breaker.labelB ? scoreText(q, breaker.labelB) : 0)
    if (labelScore > best) {
      best = labelScore
      matchedOn = scoreText(q, breaker.label) >= (breaker.labelB ? scoreText(q, breaker.labelB) : 0)
        ? breaker.label
        : breaker.labelB ?? breaker.label
    }

    if (best > 0) {
      hits.push({ breaker, matchedOn, items: matchingItems, score: best })
    }
  }

  return hits.sort((a, b) => b.score - a.score)
}
