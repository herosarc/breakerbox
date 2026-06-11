import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import type { Breaker, CircuitKind } from '@/domain/types'
import { colors, steel } from '@/theme'

/** Fixed row geometry shared with PanelCabinet so the center channel's slot
 * numbers line up with the physical rows. */
export const ROW_H = 56
export const ROW_GAP = 3

const HANDLE_W = 30
/** How far the handle slides outboard (away from the bus) when OFF. */
const OFF_TRAVEL = 9
const TAG_W = 92

interface Props {
  breaker: Breaker
  column: 'left' | 'right'
  selected?: boolean
  highlighted?: boolean
  onPress: (breaker: Breaker) => void
}

/** GFCI/AFCI breakers carry a colored test button on the body. */
function testButtonColor(kind: CircuitKind): string | null {
  switch (kind) {
    case 'gfci':
      return colors.info
    case 'afci':
      return '#b98cff'
    case 'gfci_afci':
      return '#5ad6c8'
    default:
      return null
  }
}

function kindShort(kind: CircuitKind): string {
  switch (kind) {
    case 'gfci':
      return ' GFCI'
    case 'afci':
      return ' AFCI'
    case 'gfci_afci':
      return ' GFCI+AFCI'
    case 'spare':
      return ' SPARE'
    default:
      return ''
  }
}

/**
 * Realistic breaker: black molded body packed against the center channel,
 * a handle tab stamped with the amperage that springs toward the bus when ON
 * and outboard (revealing a red OFF) when off, and a paper label tag outboard
 * — like the circuit directory stickers on a real dead-front.
 */
export function BreakerSwitch({ breaker, column, selected, highlighted, onPress }: Props) {
  const on = breaker.state === 'on'
  const isDouble = breaker.pole === 'double'
  const isTandem = breaker.pole === 'tandem'
  const height = isDouble ? ROW_H * 2 + ROW_GAP : ROW_H
  // The bus (center channel) is to the right of the left column.
  const inboardRight = column === 'left'

  const onValue = useSharedValue(on ? 1 : 0)
  useEffect(() => {
    onValue.value = withSpring(on ? 1 : 0, { damping: 14, stiffness: 220, mass: 0.6 })
  }, [on, onValue])

  const outboard = inboardRight ? -OFF_TRAVEL : OFF_TRAVEL
  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(onValue.value, [0, 1], [outboard, 0]) }],
  }))

  // Locate-flash pulse when highlighted from search / room filter.
  const pulse = useSharedValue(0)
  useEffect(() => {
    if (highlighted) {
      pulse.value = withRepeat(
        withSequence(withTiming(1, { duration: 420 }), withTiming(0, { duration: 420 })),
        5,
        false,
      )
    } else {
      pulse.value = withTiming(0, { duration: 150 })
    }
  }, [highlighted, pulse])
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value * 0.5 }))

  const testBtn = testButtonColor(breaker.kind)

  const handle = isTandem ? (
    <Animated.View style={[styles.handleStack, handleStyle]}>
      <View style={[styles.handleMini, !on && styles.handleOffFace]}>
        <Text style={styles.handleMiniText}>{breaker.amperage}</Text>
      </View>
      <View style={[styles.handleMini, !on && styles.handleOffFace]}>
        <Text style={styles.handleMiniText}>{breaker.amperage}</Text>
      </View>
    </Animated.View>
  ) : (
    <Animated.View
      style={[styles.handle, isDouble && styles.handleDouble, !on && styles.handleOffFace, handleStyle]}
    >
      <Text style={styles.handleText}>{breaker.amperage}</Text>
      {isDouble ? <View style={styles.tieBar} /> : null}
    </Animated.View>
  )

  const tag = (
    <View style={styles.tag}>
      <Text numberOfLines={1} style={styles.tagLabel}>
        {breaker.label}
      </Text>
      {isTandem && breaker.labelB ? (
        <Text numberOfLines={1} style={styles.tagLabel}>
          {breaker.labelB}
        </Text>
      ) : null}
      <Text numberOfLines={1} style={styles.tagSub}>
        {breaker.amperage}A{kindShort(breaker.kind)}
        {isDouble ? ' 240V' : ''}
      </Text>
    </View>
  )

  const body = (
    <View style={[styles.body, { justifyContent: inboardRight ? 'flex-end' : 'flex-start' }]}>
      {testBtn ? (
        <View
          style={[
            styles.testBtn,
            { backgroundColor: testBtn },
            inboardRight ? styles.testLeft : styles.testRight,
          ]}
        />
      ) : null}
      {handle}
      {!on ? (
        <Text style={[styles.offText, inboardRight ? styles.offRight : styles.offLeft]}>OFF</Text>
      ) : null}
    </View>
  )

  return (
    <Pressable
      onPress={() => onPress(breaker)}
      style={[styles.row, { height }, selected && styles.rowSelected]}
      android_ripple={{ color: '#ffffff14' }}
    >
      {column === 'left' ? (
        <>
          {tag}
          {body}
        </>
      ) : (
        <>
          {body}
          {tag}
        </>
      )}
      <Animated.View pointerEvents="none" style={[styles.flash, pulseStyle]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 5,
  },
  rowSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
    margin: -2,
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    marginVertical: 3,
    backgroundColor: steel.breakerBody,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: steel.breakerEdge,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tag: {
    width: TAG_W,
    backgroundColor: steel.labelPaper,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: steel.labelPaperEdge,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  tagLabel: { color: steel.labelText, fontSize: 10.5, fontWeight: '700' },
  tagSub: { color: steel.labelSub, fontSize: 8.5, marginTop: 1 },
  handle: {
    width: HANDLE_W,
    height: 22,
    borderRadius: 3,
    backgroundColor: steel.handle,
    borderWidth: 1,
    borderColor: steel.handleEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleDouble: { height: 42 },
  handleOffFace: { backgroundColor: steel.handleOff },
  handleStack: { gap: 4 },
  handleMini: {
    width: HANDLE_W,
    height: 15,
    borderRadius: 2,
    backgroundColor: steel.handle,
    borderWidth: 1,
    borderColor: steel.handleEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleMiniText: { color: steel.handleText, fontSize: 8, fontWeight: '800', fontFamily: 'monospace' },
  handleText: { color: steel.handleText, fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  tieBar: {
    position: 'absolute',
    left: 3,
    right: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: steel.handleEdge,
  },
  testBtn: {
    position: 'absolute',
    top: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  testLeft: { left: 6 },
  testRight: { right: 6 },
  offText: {
    position: 'absolute',
    top: '50%',
    marginTop: -5,
    color: steel.offText,
    fontSize: 7,
    fontWeight: '800',
  },
  offRight: { right: 1 },
  offLeft: { left: 1 },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    borderRadius: 5,
    opacity: 0,
  },
})
