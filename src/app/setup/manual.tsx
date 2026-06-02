import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native'

import { ChipGroup, Field, TextField } from '@/components/Field'
import { useStore } from '@/store/useStore'
import { colors, radius, space } from '@/theme'

const SLOT_COUNTS = [12, 20, 24, 30, 40, 42].map((n) => ({ value: n, label: `${n}` }))
const MAIN_AMPS = [100, 125, 150, 200, 400].map((n) => ({ value: n, label: `${n}A` }))

export default function ManualSetup() {
  const createPanel = useStore((s) => s.createPanel)

  const [name, setName] = useState('Main Panel')
  const [location, setLocation] = useState('')
  const [brand, setBrand] = useState('')
  const [mainAmps, setMainAmps] = useState(200)
  const [slotCount, setSlotCount] = useState(20)

  const onCreate = () => {
    if (!name.trim()) {
      Alert.alert('Name your panel', 'e.g. "Main Panel" or "Garage Subpanel".')
      return
    }
    const panel = createPanel({
      name: name.trim(),
      location: location.trim() || undefined,
      brand: brand.trim() || undefined,
      mainAmps,
      slotCount,
      columns: 2,
    })
    // Replace the modal with the new panel view.
    router.dismissTo(`/panel/${panel.id}`)
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Field label="Panel name">
        <TextField value={name} onChangeText={setName} placeholder="Main Panel" autoFocus />
      </Field>
      <Field label="Location">
        <TextField value={location} onChangeText={setLocation} placeholder="Garage, north wall" />
      </Field>
      <Field label="Brand / model (optional)">
        <TextField value={brand} onChangeText={setBrand} placeholder="Square D Homeline" />
      </Field>
      <Field label="Main breaker">
        <ChipGroup options={MAIN_AMPS} value={mainAmps} onChange={setMainAmps} />
      </Field>
      <Field label="Number of slots">
        <ChipGroup options={SLOT_COUNTS} value={slotCount} onChange={setSlotCount} />
      </Field>

      <Pressable style={styles.btn} onPress={onCreate}>
        <Text style={styles.btnText}>Create panel</Text>
      </Pressable>
      <Text style={styles.hint}>
        You&apos;ll get an empty board — tap any slot to add a breaker.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginTop: space.sm,
  },
  btnText: { color: '#0a0d12', fontWeight: '900', fontSize: 16 },
  hint: { color: colors.textFaint, fontSize: 13, textAlign: 'center' },
})
