import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { diagnoseOutage, type DiagnosisStep } from '@/domain/diagnostics'
import { positionLabel } from '@/domain/layout'
import type { Item } from '@/domain/types'
import { useStore } from '@/store/useStore'
import { colors, itemKindGlyph, radius, space } from '@/theme'

const STEP_STYLE: Record<DiagnosisStep['kind'], { color: string; glyph: string }> = {
  action: { color: colors.on, glyph: '✅' },
  check: { color: colors.info, glyph: '🔎' },
  warn: { color: colors.off, glyph: '⚠️' },
  info: { color: colors.textDim, glyph: 'ℹ️' },
}

export default function Diagnose() {
  const { panelId } = useLocalSearchParams<{ panelId: string }>()
  const items = useStore((s) => s.items.filter((i) => i.panelId === panelId))
  const breakers = useStore((s) => s.breakers.filter((b) => b.panelId === panelId))

  const [deviceId, setDeviceId] = useState<string | null>(null)

  const device = items.find((i) => i.id === deviceId) ?? null
  const breaker = device ? breakers.find((b) => b.id === device.breakerId) ?? null : null

  const diagnosis = useMemo(() => {
    if (!breaker) return null
    const onBreaker = items.filter((i) => i.breakerId === breaker.id)
    return diagnoseOutage(breaker, onBreaker, device ?? undefined)
  }, [breaker, items, device])

  const grouped = useMemo(() => {
    const byRoom = new Map<string, Item[]>()
    for (const it of items) {
      const room = it.room ?? 'Other'
      const list = byRoom.get(room) ?? []
      list.push(it)
      byRoom.set(room, list)
    }
    return Array.from(byRoom.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  if (!device || !diagnosis) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>What lost power?</Text>
        <Text style={styles.sub}>Pick the device or outlet that isn&apos;t working.</Text>
        {items.length === 0 ? (
          <Text style={styles.muted}>Map some devices first to use the diagnostic wizard.</Text>
        ) : (
          grouped.map(([room, list]) => (
            <View key={room} style={{ gap: space.sm }}>
              <Text style={styles.roomLabel}>{room}</Text>
              {list.map((it) => (
                <Pressable key={it.id} style={styles.deviceRow} onPress={() => setDeviceId(it.id)}>
                  <Text style={styles.deviceGlyph}>{itemKindGlyph(it.kind)}</Text>
                  <Text style={styles.deviceName}>{it.name}</Text>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => setDeviceId(null)} style={styles.back}>
        <Text style={styles.backText}>‹ Pick a different device</Text>
      </Pressable>

      <View style={[styles.headline, diagnosis.breakerIsOff ? styles.headlineWarn : styles.headlineOk]}>
        <View style={styles.posBig}>
          <Text style={styles.posBigText}>{positionLabel(diagnosis.breaker)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deviceTitle}>{device.name}</Text>
          <Text style={styles.headlineText}>{diagnosis.headline}</Text>
        </View>
      </View>

      {diagnosis.steps.map((step, idx) => {
        const s = STEP_STYLE[step.kind]
        return (
          <View key={idx} style={[styles.step, { borderLeftColor: s.color }]}>
            <Text style={styles.stepTitle}>
              {s.glyph}  {step.title}
            </Text>
            <Text style={styles.stepDetail}>{step.detail}</Text>
          </View>
        )
      })}

      <Pressable style={styles.doneBtn} onPress={() => router.back()}>
        <Text style={styles.doneText}>Back to panel</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 14, marginBottom: space.sm },
  muted: { color: colors.textDim },
  roomLabel: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: space.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    padding: space.md,
  },
  deviceGlyph: { fontSize: 18 },
  deviceName: { color: colors.text, fontSize: 15, flex: 1, fontWeight: '600' },
  chev: { color: colors.textFaint, fontSize: 22 },
  back: { paddingVertical: space.xs },
  backText: { color: colors.accent, fontWeight: '700' },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.lg,
  },
  headlineWarn: { backgroundColor: '#2a1f12', borderColor: colors.accentDim },
  headlineOk: { backgroundColor: colors.surface, borderColor: colors.edge },
  posBig: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minWidth: 44,
    alignItems: 'center',
  },
  posBigText: { color: '#0a0d12', fontWeight: '900', fontSize: 18, fontFamily: 'monospace' },
  deviceTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  headlineText: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  step: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: space.md,
    gap: space.xs,
  },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  stepDetail: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  doneBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.edge,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginTop: space.sm,
  },
  doneText: { color: colors.text, fontWeight: '700' },
})
