import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { ChipGroup, Field, TextField } from '@/components/Field'
import type { ItemKind } from '@/domain/types'
import { useStore } from '@/store/useStore'
import { colors, itemKindLabel, radius, space } from '@/theme'

const KINDS: { value: ItemKind; label: string }[] = (
  ['outlet', 'light', 'switch', 'appliance', 'hardwired', 'hvac', 'other'] as ItemKind[]
).map((k) => ({ value: k, label: itemKindLabel(k) }))

export default function ItemEdit() {
  const params = useLocalSearchParams<{ panelId: string; breakerId: string; itemId?: string }>()

  const breaker = useStore((s) => s.breakers.find((b) => b.id === params.breakerId))
  const existing = useStore((s) => s.items.find((i) => i.id === params.itemId))
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const deleteItem = useStore((s) => s.deleteItem)

  const isEdit = !!existing
  const [name, setName] = useState(existing?.name ?? '')
  const [kind, setKind] = useState<ItemKind>(existing?.kind ?? 'appliance')
  const [room, setRoom] = useState(existing?.room ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [circuit, setCircuit] = useState<'a' | 'b'>(existing?.circuit ?? 'a')
  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photoUri)

  const isTandem = breaker?.pole === 'tandem'

  const pickFrom = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach a reference image.')
      return
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
    }
    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts)
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri)
  }

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name this device', 'e.g. "Refrigerator" or "Island outlet".')
      return
    }
    const patch = {
      name: name.trim(),
      kind,
      room: room.trim() || undefined,
      notes: notes.trim() || undefined,
      circuit: isTandem ? circuit : undefined,
      photoUri,
    }
    if (isEdit && existing) {
      updateItem(existing.id, patch)
    } else if (breaker) {
      addItem({ panelId: breaker.panelId, breakerId: breaker.id, ...patch })
    }
    router.back()
  }

  const onDelete = () => {
    if (!existing) return
    deleteItem(existing.id)
    router.back()
  }

  if (!breaker) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Breaker not found.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.context}>On breaker: {breaker.label}</Text>

      <Field label="Device name">
        <TextField value={name} onChangeText={setName} placeholder="Refrigerator" autoFocus />
      </Field>

      <Field label="Type">
        <ChipGroup options={KINDS} value={kind} onChange={setKind} />
      </Field>

      {isTandem ? (
        <Field label="Which circuit">
          <ChipGroup
            options={[
              { value: 'a', label: breaker.label },
              { value: 'b', label: breaker.labelB ?? 'Second circuit' },
            ]}
            value={circuit}
            onChange={setCircuit}
          />
        </Field>
      ) : null}

      <Field label="Room / location">
        <TextField value={room} onChangeText={setRoom} placeholder="Kitchen" />
      </Field>

      <Field label="Reference photo">
        {photoUri ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            <Pressable style={styles.photoRemove} onPress={() => setPhotoUri(undefined)}>
              <Text style={styles.photoRemoveText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.photoBtns}>
          <Pressable style={styles.photoBtn} onPress={() => pickFrom('camera')}>
            <Text style={styles.photoBtnText}>📷 Camera</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={() => pickFrom('library')}>
            <Text style={styles.photoBtnText}>🖼 Library</Text>
          </Pressable>
        </View>
      </Field>

      <Field label="Notes">
        <TextField value={notes} onChangeText={setNotes} placeholder="Optional details" multiline />
      </Field>

      <Pressable style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveText}>{isEdit ? 'Save changes' : 'Add device'}</Text>
      </Pressable>

      {isEdit ? (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Remove device</Text>
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
  context: { color: colors.textDim, fontSize: 13 },
  photoWrap: { gap: space.sm },
  photo: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  photoRemove: { alignSelf: 'flex-start' },
  photoRemoveText: { color: colors.danger, fontWeight: '700' },
  photoBtns: { flexDirection: 'row', gap: space.sm },
  photoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    backgroundColor: colors.surfaceAlt,
  },
  photoBtnText: { color: colors.text, fontWeight: '700' },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  saveText: { color: '#0a0d12', fontWeight: '900', fontSize: 16 },
  deleteBtn: { alignItems: 'center', paddingVertical: space.md },
  deleteText: { color: colors.danger, fontWeight: '700' },
})
