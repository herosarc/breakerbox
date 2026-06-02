import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { ChipGroup, Field, TextField } from '@/components/Field'
import { canPlace } from '@/domain/layout'
import type { CircuitKind, PoleType } from '@/domain/types'
import { useStore } from '@/store/useStore'
import { colors, radius, space } from '@/theme'

const POLES: { value: PoleType; label: string }[] = [
  { value: 'single', label: 'Single 120V' },
  { value: 'double', label: 'Double 240V' },
  { value: 'tandem', label: 'Tandem (twin)' },
]
const AMPS = [15, 20, 25, 30, 40, 50, 60].map((a) => ({ value: a, label: `${a}A` }))
const KINDS: { value: CircuitKind; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'gfci', label: 'GFCI' },
  { value: 'afci', label: 'AFCI' },
  { value: 'gfci_afci', label: 'GFCI+AFCI' },
  { value: 'spare', label: 'Spare' },
]

export default function BreakerEdit() {
  const params = useLocalSearchParams<{ panelId: string; breakerId?: string; slot?: string }>()
  const panelId = params.panelId

  const panel = useStore((s) => s.panels.find((p) => p.id === panelId))
  const panelBreakers = useStore((s) => s.breakers.filter((b) => b.panelId === panelId))
  const existing = useStore((s) => s.breakers.find((b) => b.id === params.breakerId))
  const addBreaker = useStore((s) => s.addBreaker)
  const updateBreaker = useStore((s) => s.updateBreaker)
  const deleteBreaker = useStore((s) => s.deleteBreaker)

  const isEdit = !!existing
  const [label, setLabel] = useState(existing?.label ?? '')
  const [labelB, setLabelB] = useState(existing?.labelB ?? '')
  const [pole, setPole] = useState<PoleType>(existing?.pole ?? 'single')
  const [amperage, setAmperage] = useState<number>(existing?.amperage ?? 20)
  const [kind, setKind] = useState<CircuitKind>(existing?.kind ?? 'standard')
  const [slotText, setSlotText] = useState(String(existing?.startSlot ?? params.slot ?? '1'))

  const startSlot = useMemo(() => parseInt(slotText, 10) || 0, [slotText])

  if (!panel) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Panel not found.</Text>
      </View>
    )
  }

  const onSave = () => {
    if (!label.trim()) {
      Alert.alert('Add a label', 'Give this breaker a name, e.g. "Kitchen counter".')
      return
    }
    const check = canPlace(panel, panelBreakers, { startSlot, pole }, existing?.id)
    if (!check.ok) {
      Alert.alert('Cannot place here', check.reason)
      return
    }

    if (isEdit && existing) {
      updateBreaker(existing.id, {
        label: label.trim(),
        labelB: pole === 'tandem' ? labelB.trim() || undefined : undefined,
        pole,
        amperage,
        kind,
        startSlot,
      })
    } else {
      const res = addBreaker({
        panelId: panel.id,
        startSlot,
        pole,
        amperage,
        kind,
        label: label.trim(),
        labelB: pole === 'tandem' ? labelB.trim() || undefined : undefined,
      })
      if (!res.ok) {
        Alert.alert('Cannot add breaker', res.reason)
        return
      }
    }
    router.back()
  }

  const onDelete = () => {
    if (!existing) return
    Alert.alert('Delete breaker?', `"${existing.label}" and its mapped devices will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteBreaker(existing.id)
          router.back()
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Field label="Label">
        <TextField value={label} onChangeText={setLabel} placeholder="Kitchen counter" autoFocus />
      </Field>

      <Field label="Pole / voltage">
        <ChipGroup options={POLES} value={pole} onChange={setPole} />
      </Field>

      {pole === 'tandem' ? (
        <Field label="Second circuit label">
          <TextField value={labelB} onChangeText={setLabelB} placeholder="Second circuit" />
        </Field>
      ) : null}

      <Field label="Amperage">
        <ChipGroup options={AMPS} value={amperage} onChange={setAmperage} />
      </Field>

      <Field label="Type">
        <ChipGroup options={KINDS} value={kind} onChange={setKind} />
      </Field>

      <Field label={`Top slot number (1–${panel.slotCount})`}>
        <TextField value={slotText} onChangeText={setSlotText} keyboardType="number-pad" />
        {pole === 'double' ? (
          <Text style={styles.hint}>
            240V breakers occupy two slots on the same column: {startSlot} & {startSlot + 2}.
          </Text>
        ) : null}
      </Field>

      <Pressable style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveText}>{isEdit ? 'Save changes' : 'Add breaker'}</Text>
      </Pressable>

      {isEdit ? (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete breaker</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textDim },
  hint: { color: colors.textFaint, fontSize: 12, marginTop: space.xs },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginTop: space.sm,
  },
  saveText: { color: '#0a0d12', fontWeight: '900', fontSize: 16 },
  deleteBtn: { alignItems: 'center', paddingVertical: space.md },
  deleteText: { color: colors.danger, fontWeight: '700' },
})
