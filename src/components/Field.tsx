import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { colors, radius, space } from '@/theme'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoFocus,
  multiline,
}: {
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'number-pad'
  autoFocus?: boolean
  multiline?: boolean
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      multiline={multiline}
      style={[styles.input, multiline && styles.inputMultiline]}
    />
  )
}

export interface ChipOption<T extends string | number> {
  value: T
  label: string
}

export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
  label: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    color: colors.text,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.edge,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#0a0d12', fontWeight: '800' },
})
