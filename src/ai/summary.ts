/** Build a compact plain-text panel summary to ground the electrician consult. */
import { occupiedSlots } from '@/domain/layout'
import type { Breaker, Item, Panel } from '@/domain/types'
import { circuitKindLabel } from '@/theme'

export function panelSummary(panel: Panel, breakers: Breaker[], items: Item[]): string {
  const lines: string[] = []
  lines.push(`Panel: ${panel.name}${panel.mainAmps ? `, ${panel.mainAmps}A main` : ''}, ${panel.slotCount} slots.`)
  const itemsByBreaker = new Map<string, Item[]>()
  for (const it of items) {
    const list = itemsByBreaker.get(it.breakerId) ?? []
    list.push(it)
    itemsByBreaker.set(it.breakerId, list)
  }
  for (const b of [...breakers].sort((a, z) => a.startSlot - z.startSlot)) {
    const slots = occupiedSlots(b).join('/')
    const devices = (itemsByBreaker.get(b.id) ?? []).map((i) => i.name).join(', ')
    const pole = b.pole === 'double' ? '240V' : b.pole === 'tandem' ? 'tandem' : '120V'
    lines.push(
      `- Slot ${slots}: ${b.label} (${b.amperage}A ${circuitKindLabel(b.kind)} ${pole}, currently ${b.state})${devices ? ` — ${devices}` : ''}`,
    )
  }
  return lines.join('\n')
}
