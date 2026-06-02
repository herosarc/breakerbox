import { Pressable, StyleSheet, Text, View } from 'react-native'

import { columnSlots, slotOccupancy } from '@/domain/layout'
import type { Breaker, Panel } from '@/domain/types'
import { colors, radius, space } from '@/theme'
import { BreakerSwitch } from './BreakerSwitch'

interface Props {
  panel: Panel
  breakers: Breaker[]
  selectedId?: string | null
  highlightedIds?: Set<string>
  onPressBreaker: (b: Breaker) => void
  onPressEmptySlot?: (slot: number) => void
}

function EmptySlot({ slot, onPress }: { slot: number; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.empty}
      android_ripple={{ color: '#ffffff10' }}
    >
      <Text style={styles.emptyPos}>{slot}</Text>
      {onPress ? <Text style={styles.emptyAdd}>+ add</Text> : <Text style={styles.emptyAdd}>spare</Text>}
    </Pressable>
  )
}

function Column({
  panel,
  column,
  occupancy,
  selectedId,
  highlightedIds,
  onPressBreaker,
  onPressEmptySlot,
}: {
  panel: Panel
  column: 'left' | 'right'
  occupancy: Map<number, Breaker>
} & Omit<Props, 'panel' | 'breakers'>) {
  const slots = columnSlots(panel, column)
  return (
    <View style={styles.column}>
      {slots.map((slot) => {
        const breaker = occupancy.get(slot)
        if (breaker && breaker.startSlot !== slot) {
          // Lower half of a double-pole: rendered by the taller tile above.
          return null
        }
        if (!breaker) {
          return (
            <EmptySlot
              key={slot}
              slot={slot}
              onPress={onPressEmptySlot ? () => onPressEmptySlot(slot) : undefined}
            />
          )
        }
        return (
          <BreakerSwitch
            key={breaker.id}
            breaker={breaker}
            column={column}
            selected={selectedId === breaker.id}
            highlighted={highlightedIds?.has(breaker.id)}
            onPress={onPressBreaker}
          />
        )
      })}
    </View>
  )
}

export function PanelCabinet({
  panel,
  breakers,
  selectedId,
  highlightedIds,
  onPressBreaker,
  onPressEmptySlot,
}: Props) {
  const occupancy = slotOccupancy(breakers)

  return (
    <View style={styles.cabinet}>
      <View style={styles.mainStrip}>
        <View style={styles.mainBadge}>
          <Text style={styles.mainBadgeText}>MAIN</Text>
        </View>
        <Text style={styles.mainAmps}>{panel.mainAmps ? `${panel.mainAmps}A` : '—'}</Text>
        <Text style={styles.brand} numberOfLines={1}>
          {panel.brand ?? 'Load Center'}
        </Text>
      </View>

      <View style={styles.columns}>
        <Column
          panel={panel}
          column="left"
          occupancy={occupancy}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onPressBreaker={onPressBreaker}
          onPressEmptySlot={onPressEmptySlot}
        />
        <View style={styles.bus} />
        {panel.columns === 2 ? (
          <Column
            panel={panel}
            column="right"
            occupancy={occupancy}
            selectedId={selectedId}
            highlightedIds={highlightedIds}
            onPressBreaker={onPressBreaker}
            onPressEmptySlot={onPressEmptySlot}
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cabinet: {
    backgroundColor: colors.enclosure,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.edge,
    padding: space.sm,
  },
  mainStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    marginBottom: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
  },
  mainBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  mainBadgeText: { color: '#0a0d12', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' },
  mainAmps: { color: colors.text, fontWeight: '800', fontSize: 16, fontFamily: 'monospace' },
  brand: { color: colors.textFaint, fontSize: 12, marginLeft: 'auto' },
  columns: {
    flexDirection: 'row',
    gap: space.sm,
  },
  column: {
    flex: 1,
    gap: space.sm,
  },
  bus: {
    width: 6,
    backgroundColor: colors.busbar,
    borderRadius: 3,
    marginVertical: space.xs,
  },
  empty: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPos: { color: colors.textFaint, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' },
  emptyAdd: { color: colors.textFaint, fontSize: 11 },
})
