import { Pressable, StyleSheet, Text, View } from 'react-native'

import { columnSlots, rowCount, slotOccupancy } from '@/domain/layout'
import type { Breaker, Panel } from '@/domain/types'
import { steel } from '@/theme'
import { BreakerSwitch, ROW_GAP, ROW_H } from './BreakerSwitch'

interface Props {
  panel: Panel
  breakers: Breaker[]
  selectedId?: string | null
  highlightedIds?: Set<string>
  onPressBreaker: (b: Breaker) => void
  onPressEmptySlot?: (slot: number) => void
}

/** Flat-head screw at each corner of the dead-front. */
function Screw() {
  return (
    <View style={styles.screw}>
      <View style={styles.screwSlot} />
    </View>
  )
}

/** Unused slot: the stamped knockout blank on a real panel. */
function EmptySlot({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.empty}
      android_ripple={{ color: '#ffffff14' }}
    >
      <View style={styles.knockout}>{onPress ? <Text style={styles.emptyAdd}>+ add</Text> : null}</View>
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
          // Lower slot of a double-pole: covered by the taller unit above.
          return null
        }
        if (!breaker) {
          return (
            <EmptySlot
              key={slot}
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

/** Center channel between the bus columns, with row-aligned slot numbers. */
function Channel({ panel }: { panel: Panel }) {
  const rows = rowCount(panel)
  return (
    <View style={styles.channel}>
      {Array.from({ length: rows }, (_, i) => {
        const leftNum = panel.columns === 2 ? 2 * i + 1 : i + 1
        const rightNum = panel.columns === 2 ? 2 * i + 2 : null
        return (
          <View key={i} style={styles.channelRow}>
            <Text style={styles.channelNum}>{leftNum}</Text>
            {rightNum !== null && rightNum <= panel.slotCount ? (
              <Text style={styles.channelNum}>{rightNum}</Text>
            ) : (
              <Text style={styles.channelNum}> </Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

/**
 * "Classic Steel" cabinet: gray steel enclosure with corner screws, a lighter
 * dead-front trim, the main breaker stamped MAIN at top center, and two bus
 * columns of black breakers packed against a numbered center channel.
 */
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
    <View style={styles.outer}>
      <View style={[styles.screwPos, { top: 7, left: 7 }]}>
        <Screw />
      </View>
      <View style={[styles.screwPos, { top: 7, right: 7 }]}>
        <Screw />
      </View>
      <View style={[styles.screwPos, { bottom: 7, left: 7 }]}>
        <Screw />
      </View>
      <View style={[styles.screwPos, { bottom: 7, right: 7 }]}>
        <Screw />
      </View>

      <View style={styles.trim}>
        <View style={styles.mainWrap}>
          <View style={styles.mainBody}>
            <View style={styles.mainHandle}>
              <Text style={styles.mainHandleText}>{panel.mainAmps ?? '—'}</Text>
            </View>
          </View>
          <Text style={styles.mainLabel}>MAIN{panel.mainAmps ? ` · ${panel.mainAmps}A` : ''}</Text>
        </View>

        <View style={styles.columnsRow}>
          <Column
            panel={panel}
            column="left"
            occupancy={occupancy}
            selectedId={selectedId}
            highlightedIds={highlightedIds}
            onPressBreaker={onPressBreaker}
            onPressEmptySlot={onPressEmptySlot}
          />
          <Channel panel={panel} />
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

        {panel.brand ? <Text style={styles.brand}>{panel.brand.toUpperCase()}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: steel.outer,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: steel.outerEdge,
    padding: 18,
  },
  screwPos: { position: 'absolute', zIndex: 1 },
  screw: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: steel.screw,
    borderWidth: 1,
    borderColor: steel.outerEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screwSlot: { width: 6, height: 1.5, backgroundColor: steel.screwSlot },
  trim: {
    backgroundColor: steel.trim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: steel.trimEdge,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  mainWrap: { alignItems: 'center', gap: 5, marginBottom: 14 },
  mainBody: {
    width: 132,
    height: 44,
    backgroundColor: steel.breakerBody,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: steel.breakerEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainHandle: {
    width: 56,
    height: 20,
    borderRadius: 3,
    backgroundColor: steel.handle,
    borderWidth: 1,
    borderColor: steel.handleEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainHandleText: { color: steel.handleText, fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  mainLabel: { color: steel.stamp, fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  columnsRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  column: { flex: 1, gap: ROW_GAP },
  channel: {
    width: 22,
    backgroundColor: steel.channel,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: steel.channelEdge,
    paddingHorizontal: 2,
  },
  channelRow: {
    height: ROW_H,
    marginBottom: ROW_GAP,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelNum: {
    color: steel.channelNum,
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  empty: { height: ROW_H, alignItems: 'center', justifyContent: 'center' },
  knockout: {
    width: '64%',
    height: 26,
    borderRadius: 3,
    backgroundColor: steel.knockout,
    borderWidth: 1,
    borderColor: steel.knockoutEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAdd: { color: steel.stamp, fontSize: 9, fontWeight: '700' },
  brand: {
    marginTop: 12,
    textAlign: 'center',
    color: steel.stamp,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
})
