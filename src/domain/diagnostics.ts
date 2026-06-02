/**
 * Outage diagnostic logic (pure, client-side, no AI required).
 *
 * Given a device that lost power, walk the homeowner through a safe, ordered
 * set of checks: is the breaker simply off, is it a GFCI that needs resetting,
 * is it the device, or is something bigger going on.
 */
import { positionLabel } from './layout'
import type { Breaker, Item } from './types'

export type StepKind = 'action' | 'check' | 'warn' | 'info'

export interface DiagnosisStep {
  kind: StepKind
  title: string
  detail: string
}

export interface Diagnosis {
  breaker: Breaker
  headline: string
  /** True when the most likely fix is simply flipping this breaker on. */
  breakerIsOff: boolean
  steps: DiagnosisStep[]
}

/** Circuits in these areas are usually GFCI-protected by code. */
const WET_AREA = /kitchen|bath|garage|outdoor|exterior|laundry|utility|basement/i

function likelyGfci(breaker: Breaker, items: Item[]): boolean {
  if (breaker.kind === 'gfci' || breaker.kind === 'gfci_afci') return true
  return items.some((i) => i.room && WET_AREA.test(i.room))
}

export function diagnoseOutage(
  breaker: Breaker,
  itemsOnBreaker: Item[],
  device?: Item,
): Diagnosis {
  const pos = positionLabel(breaker)
  const deviceName = device?.name ?? breaker.label
  const others = itemsOnBreaker.filter((i) => i.id !== device?.id)

  if (breaker.state === 'off') {
    return {
      breaker,
      breakerIsOff: true,
      headline: `Breaker ${pos} is switched OFF`,
      steps: [
        {
          kind: 'action',
          title: `Flip breaker ${pos} back on`,
          detail: `"${breaker.label}" is in the off position. Push the handle fully to OFF first, then firmly to ON — tripped breakers often rest in the middle.`,
        },
        {
          kind: 'warn',
          title: 'If it trips again immediately',
          detail:
            'Unplug everything on this circuit and try once more. If it still trips, leave it off — there may be a short or overload. Call a licensed electrician.',
        },
      ],
    }
  }

  const steps: DiagnosisStep[] = []

  if (others.length > 0) {
    steps.push({
      kind: 'check',
      title: 'Is anything else on this circuit also dead?',
      detail: `Breaker ${pos} also feeds: ${others.map((o) => o.name).join(', ')}. If those are out too, the problem is the circuit/breaker. If only "${deviceName}" is out, it's likely the outlet or the device.`,
    })
  }

  if (likelyGfci(breaker, itemsOnBreaker)) {
    steps.push({
      kind: 'action',
      title: 'Reset the GFCI',
      detail:
        'This circuit is likely GFCI-protected. Find the nearest outlet with TEST/RESET buttons (kitchen, bath, garage, outdoors, or laundry) — it may be a different outlet than the dead one — and press RESET firmly.',
    })
  }

  steps.push({
    kind: 'check',
    title: 'Check the device and its outlet',
    detail: `Make sure "${deviceName}" is switched on and its own fuse/reset (if any) is good. Plug something you know works into the same outlet to confirm the outlet has power.`,
  })

  steps.push({
    kind: 'info',
    title: `Confirm at the panel`,
    detail: `Breaker ${pos} currently reads ON in your map. If you toggle it off and on at the physical panel and power returns, update its state here.`,
  })

  steps.push({
    kind: 'warn',
    title: 'When to stop and call a pro',
    detail:
      'Burning smell, scorch marks, a warm/buzzing breaker, or repeated tripping mean stop and call a licensed electrician. This guidance is informational, not a substitute for professional advice.',
  })

  return {
    breaker,
    breakerIsOff: false,
    headline: `Breaker ${pos} is ON — let's find the cause`,
    steps,
  }
}
