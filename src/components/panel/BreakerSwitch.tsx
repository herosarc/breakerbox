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

import type { Breaker } from '@/domain/types'
import { positionLabel } from '@/domain/layout'
import { circuitKindColor, circuitKindLabel, colors, radius, space } from '@/theme'

const TRACK_W = 50
const HANDLE_W = 26

interface Props {
  breaker: Breaker
  column: 'left' | 'right'
  selected?: boolean
  highlighted?: boolean
  onPress: (breaker: Breaker) => void
}

/** Tactile breaker tile. The handle springs toward the center bus when ON. */
export function BreakerSwitch({ breaker, column, selected, highlighted, onPress }: Props) {
  const on = breaker.state === 'on'
  const isDouble = breaker.pole === 'double'
  const isTandem = breaker.pole === 'tandem'
  const stripe = breaker.color ?? circuitKindColor(breaker.kind)

  // Handle slides toward the inner (bus) edge when ON.
  const onValue = useSharedValue(on ? 1 : 0)
  useEffect(() => {
    onValue.value = withSpring(on ? 1 : 0, { damping: 14, stiffness: 220, mass: 0.6 })
  }, [on, onValue])

  const innerX = column === 'left' ? TRACK_W - HANDLE_W - 3 : 3
  const outerX = column === 'left' ? 3 : TRACK_W - HANDLE_W - 3
  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(onValue.value, [0, 1], [outerX, innerX]) }],
  }))

  // Locate-flash pulse when highlighted from search.
  const pulse = useSharedValue(0)
  useEffect(() => {
    if (highlighted) {
      pulse.value = withRepeat(withSequence(withTiming(1, { duration: 420 }), withTiming(0, { duration: 420 })), 5, false)
    } else {
      pulse.value = withTiming(0, { duration: 150 })
    }
  }, [highlighted, pulse])
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }))

  const handle = (
    <View style={[styles.track, { backgroundColor: on ? '#143a25' : '#3a1d18' }]}>
      <Animated.View
        style={[
          styles.handle,
          handleStyle,
          { backgroundColor: on ? colors.on : colors.off },
        ]}
      >
        <Text style={styles.handleText}>{on ? 'I' : 'O'}</Text>
      </Animated.View>
    </View>
  )

  const body = (
    <View style={styles.body}>
      <View style={styles.labelRow}>
        <Text numberOfLines={1} style={styles.label}>
          {breaker.label}
        </Text>
      </View>
      {isTandem && breaker.labelB ? (
        <View style={styles.labelRow}>
          <Text numberOfLines={1} style={[styles.label, styles.labelB]}>
            {breaker.labelB}
          </Text>
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <Text style={styles.amps}>{breaker.amperage}A</Text>
        <Text style={styles.kind}>{circuitKindLabel(breaker.kind)}</Text>
        {isDouble ? <Text style={styles.tie}>⛓ 240V</Text> : null}
        {isTandem ? <Text style={styles.tie}>twin</Text> : null}
      </View>
    </View>
  )

  return (
    <Pressable
      onPress={() => onPress(breaker)}
      android_ripple={{ color: '#ffffff10' }}
      style={[
        styles.tile,
        isDouble && styles.tileDouble,
        selected && styles.tileSelected,
        column === 'right' && styles.tileRight,
      ]}
    >
      {/* circuit-kind stripe on the outer edge */}
      <View
        style={[
          styles.stripe,
          { backgroundColor: stripe },
          column === 'left' ? styles.stripeLeft : styles.stripeRight,
        ]}
      />
      <View style={styles.posBadge}>
        <Text style={styles.posText}>{positionLabel(breaker)}</Text>
      </View>
      {column === 'left' ? (
        <>
          {body}
          {handle}
        </>
      ) : (
        <>
          {handle}
          {body}
        </>
      )}
      <Animated.View pointerEvents="none" style={[styles.flash, pulseStyle]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.edge,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    gap: space.sm,
    overflow: 'hidden',
  },
  tileRight: {},
  tileDouble: {
    minHeight: 118,
  },
  tileSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
  },
  stripeLeft: { left: 0 },
  stripeRight: { right: 0 },
  posBadge: {
    minWidth: 26,
    alignItems: 'center',
  },
  posText: {
    color: colors.textFaint,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  labelB: {
    color: colors.textDim,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: 2,
  },
  amps: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  kind: {
    color: colors.textDim,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  tie: {
    color: colors.textFaint,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  track: {
    width: TRACK_W,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00000040',
  },
  handle: {
    width: HANDLE_W,
    height: 26,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  handleText: {
    color: '#0a0d12',
    fontWeight: '900',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    opacity: 0,
  },
})
