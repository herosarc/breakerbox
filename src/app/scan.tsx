import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { TextField } from '@/components/Field'
import { AiNotConfiguredError, isAiConfigured, scanPanel } from '@/ai/client'
import type { PanelDraft } from '@/ai/types'
import { canPlace } from '@/domain/layout'
import { useStore } from '@/store/useStore'
import { circuitKindLabel, colors, radius, space } from '@/theme'

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp'

export default function Scan() {
  const createPanel = useStore((s) => s.createPanel)
  const addBreaker = useStore((s) => s.addBreaker)

  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<PanelDraft | null>(null)

  const configured = isAiConfigured()

  const runScan = async (image?: { data: string; mediaType: MediaType }) => {
    setBusy(true)
    try {
      const result = await scanPanel({
        image: image?.data,
        mediaType: image?.mediaType,
        notes: notes.trim() || undefined,
      })
      setDraft(result)
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        Alert.alert('AI not set up', 'Connect the AI proxy to use Smart Scan (see the app README).')
      } else {
        Alert.alert('Scan failed', err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      setBusy(false)
    }
  }

  const pickImage = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to scan your panel.')
      return
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: true }
    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts)
    if (res.canceled || !res.assets[0]?.base64) return
    const asset = res.assets[0]
    const mediaType: MediaType =
      asset.mimeType === 'image/png' ? 'image/png' : asset.mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg'
    await runScan({ data: asset.base64!, mediaType })
  }

  const importDraft = () => {
    if (!draft) return
    const panel = createPanel({
      name: draft.name?.trim() || 'Scanned Panel',
      mainAmps: draft.mainAmps,
      slotCount: draft.slotCount,
      columns: draft.columns,
    })
    let placed = 0
    let skipped = 0
    const accepted: Parameters<typeof addBreaker>[0][] = []
    for (const b of draft.breakers) {
      // Validate against what's already accepted so collisions are skipped.
      const existing = accepted.map((a, idx) => ({
        ...a,
        id: `tmp${idx}`,
        state: 'on' as const,
        createdAt: 0,
        updatedAt: 0,
      }))
      const check = canPlace(panel, existing, { startSlot: b.startSlot, pole: b.pole })
      if (!check.ok) {
        skipped++
        continue
      }
      const res = addBreaker({
        panelId: panel.id,
        startSlot: b.startSlot,
        pole: b.pole,
        amperage: b.amperage,
        kind: b.kind,
        label: b.label,
        labelB: b.labelB,
      })
      if (res.ok) {
        accepted.push({
          panelId: panel.id,
          startSlot: b.startSlot,
          pole: b.pole,
          amperage: b.amperage,
          kind: b.kind,
          label: b.label,
        })
        placed++
      } else {
        skipped++
      }
    }
    router.dismissTo(`/panel/${panel.id}`)
    if (skipped > 0) {
      setTimeout(
        () => Alert.alert('Imported', `Added ${placed} breakers. ${skipped} couldn't be placed and were skipped — add them manually.`),
        400,
      )
    }
  }

  if (!configured) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Smart Scan</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Smart Scan reads a photo of your panel with AI and drafts the layout for you. It needs the
            BreakerBox AI proxy connected.
          </Text>
          <Text style={styles.noticeText}>
            Set <Text style={styles.code}>EXPO_PUBLIC_AI_PROXY_URL</Text> to your deployed proxy (see
            server/README.md), then rebuild the app. Until then, build your panel manually — it works
            fully offline.
          </Text>
        </View>
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/setup/manual')}>
          <Text style={styles.secondaryText}>Build manually instead</Text>
        </Pressable>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Smart Scan</Text>
      <Text style={styles.sub}>
        Snap your panel (or its label sheet), or paste your notes. AI drafts the layout — you confirm
        before anything is saved.
      </Text>

      {!draft ? (
        <>
          <View style={styles.row}>
            <Pressable style={styles.primaryBtn} onPress={() => pickImage('camera')} disabled={busy}>
              <Text style={styles.primaryText}>📷 Take photo</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => pickImage('library')} disabled={busy}>
              <Text style={styles.primaryText}>🖼 Choose photo</Text>
            </Pressable>
          </View>

          <Text style={styles.or}>— or paste notes —</Text>
          <TextField
            value={notes}
            onChangeText={setNotes}
            placeholder={'e.g.\n1: Kitchen 20A GFCI\n2: Dryer 30A 240V\n…'}
            multiline
          />
          <Pressable
            style={[styles.secondaryBtn, !notes.trim() && styles.disabled]}
            onPress={() => runScan()}
            disabled={busy || !notes.trim()}
          >
            <Text style={styles.secondaryText}>Draft from notes</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.draft}>
          <Text style={styles.draftTitle}>{draft.name ?? 'Scanned Panel'}</Text>
          <Text style={styles.draftMeta}>
            {draft.slotCount} slots · {draft.breakers.length} breakers
            {draft.mainAmps ? ` · ${draft.mainAmps}A main` : ''}
          </Text>
          {draft.notes ? <Text style={styles.draftNote}>⚠️ {draft.notes}</Text> : null}
          <View style={styles.draftList}>
            {draft.breakers
              .slice()
              .sort((a, b) => a.startSlot - b.startSlot)
              .map((b, i) => (
                <View key={i} style={styles.draftRow}>
                  <Text style={styles.draftSlot}>{b.startSlot}</Text>
                  <Text style={styles.draftLabel} numberOfLines={1}>
                    {b.label}
                    {b.labelB ? ` / ${b.labelB}` : ''}
                  </Text>
                  <Text style={styles.draftSpec}>
                    {b.amperage}A {circuitKindLabel(b.kind)}
                    {b.pole === 'double' ? ' 240V' : b.pole === 'tandem' ? ' twin' : ''}
                  </Text>
                </View>
              ))}
          </View>
          <Pressable style={styles.primaryBtnFull} onPress={importDraft}>
            <Text style={styles.primaryText}>Create panel from scan</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setDraft(null)}>
            <Text style={styles.secondaryText}>Discard & try again</Text>
          </Pressable>
        </View>
      )}

      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.busyText}>Reading your panel…</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', gap: space.sm },
  or: { color: colors.textFaint, textAlign: 'center', fontSize: 13 },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  primaryBtnFull: {
    alignItems: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  primaryText: { color: '#0a0d12', fontWeight: '900', fontSize: 15 },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    backgroundColor: colors.surfaceAlt,
  },
  secondaryText: { color: colors.text, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    padding: space.lg,
    gap: space.sm,
  },
  noticeText: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  code: { color: colors.accent, fontFamily: 'monospace', fontSize: 13 },
  draft: { gap: space.md },
  draftTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  draftMeta: { color: colors.textDim, fontSize: 13 },
  draftNote: { color: colors.warn, fontSize: 13, lineHeight: 19 },
  draftList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    overflow: 'hidden',
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  draftSlot: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontWeight: '800',
    minWidth: 26,
    textAlign: 'center',
  },
  draftLabel: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '600' },
  draftSpec: { color: colors.textDim, fontFamily: 'monospace', fontSize: 12 },
  busy: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  busyText: { color: colors.textDim },
})
