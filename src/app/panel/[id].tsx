import { Stack, router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PanelCabinet } from '@/components/panel/PanelCabinet'
import { occupiedSlots, positionLabel } from '@/domain/layout'
import { searchPanel } from '@/domain/search'
import type { Breaker } from '@/domain/types'
import { useStore } from '@/store/useStore'
import {
  circuitKindLabel,
  colors,
  itemKindGlyph,
  radius,
  space,
} from '@/theme'

export default function PanelScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { id } = useLocalSearchParams<{ id: string }>()

  const panel = useStore((s) => s.panels.find((p) => p.id === id))
  const breakers = useStore((s) => s.breakers.filter((b) => b.panelId === id))
  const items = useStore((s) => s.items.filter((i) => i.panelId === id))
  const toggleBreaker = useStore((s) => s.toggleBreaker)
  const setAllBreakers = useStore((s) => s.setAllBreakers)
  const tripRandom = useStore((s) => s.tripRandom)

  const [query, setQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useLayoutEffect(() => {
    navigation.setOptions({ title: panel?.name ?? 'Panel' })
  }, [navigation, panel?.name])

  const rooms = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) if (it.room) set.add(it.room)
    return Array.from(set).sort()
  }, [items])

  const hits = useMemo(
    () => (query.trim() ? searchPanel(query, breakers, items) : []),
    [query, breakers, items],
  )

  // Breakers to flash: search hits, or all breakers feeding the room filter.
  const highlightedIds = useMemo(() => {
    if (query.trim()) return new Set(hits.map((h) => h.breaker.id))
    if (roomFilter) {
      const ids = items.filter((i) => i.room === roomFilter).map((i) => i.breakerId)
      return new Set(ids)
    }
    return new Set<string>()
  }, [query, hits, roomFilter, items])

  const selected = breakers.find((b) => b.id === selectedId) ?? null
  const selectedItems = items.filter((i) => i.breakerId === selectedId)

  if (!panel) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>This panel no longer exists.</Text>
        <Pressable onPress={() => router.replace('/')} style={styles.linkBtn}>
          <Text style={styles.linkText}>Back to home</Text>
        </Pressable>
      </View>
    )
  }

  const onLocate = (b: Breaker) => {
    setSelectedId(b.id)
    setQuery('')
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: panel.name }} />

      {/* Search / recall */}
      <View style={[styles.searchWrap, { paddingTop: space.sm }]}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Find a device, room, or breaker…"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        {hits.length > 0 ? (
          <View style={styles.results}>
            {hits.slice(0, 6).map((h) => (
              <Pressable key={h.breaker.id} style={styles.resultRow} onPress={() => onLocate(h.breaker)}>
                <Text style={styles.resultPos}>{positionLabel(h.breaker)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{h.matchedOn}</Text>
                  <Text style={styles.resultSub}>
                    {h.breaker.label} · {h.breaker.amperage}A
                  </Text>
                </View>
                <Text style={styles.resultLocate}>locate ›</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* Room filter rails */}
      {rooms.length > 0 && !query.trim() ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rooms}
        >
          {rooms.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoomFilter(roomFilter === r ? null : r)}
              style={[styles.chip, roomFilter === r && styles.chipActive]}
            >
              <Text style={[styles.chipText, roomFilter === r && styles.chipTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 280 }}>
        <PanelCabinet
          panel={panel}
          breakers={breakers}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onPressBreaker={(b) => setSelectedId(b.id === selectedId ? null : b.id)}
          onPressEmptySlot={(slot) =>
            router.push({ pathname: '/breaker-edit', params: { panelId: panel.id, slot: String(slot) } })
          }
        />

        <View style={styles.panelActions}>
          <Pressable
            style={styles.primaryGhostBtn}
            onPress={() => router.push({ pathname: '/diagnose', params: { panelId: panel.id } })}
          >
            <Text style={styles.primaryGhostText}>🩺  Diagnose outage</Text>
          </Pressable>
          <Pressable
            style={styles.ghostBtn}
            onPress={() => {
              const id = tripRandom(panel.id)
              if (!id) {
                Alert.alert('Nothing to trip', 'All breakers are already off.')
                return
              }
              setSelectedId(null)
              Alert.alert(
                'A breaker tripped!',
                'One breaker just flipped off. Find the device that lost power, then locate and reset the breaker.',
              )
            }}
          >
            <Text style={styles.ghostBtnText}>🎲 Simulate trip</Text>
          </Pressable>
        </View>

        <View style={styles.panelActions}>
          <Pressable style={styles.ghostBtn} onPress={() => setAllBreakers(panel.id, 'on')}>
            <Text style={styles.ghostBtnText}>All on</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={() => setAllBreakers(panel.id, 'off')}>
            <Text style={styles.ghostBtnText}>All off</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.consultBtn}
          onPress={() => router.push({ pathname: '/consult', params: { panelId: panel.id } })}
        >
          <Text style={styles.consultText}>💬  Ask the virtual electrician</Text>
        </Pressable>
      </ScrollView>

      {/* Selected breaker detail */}
      {selected ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetPos}>
              <Text style={styles.sheetPosText}>{positionLabel(selected)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{selected.label}</Text>
              <Text style={styles.sheetSub}>
                {selected.amperage}A · {circuitKindLabel(selected.kind)} ·{' '}
                {selected.pole === 'double'
                  ? `240V, 2-pole (slots ${occupiedSlots(selected).join(' & ')})`
                  : selected.pole === 'tandem'
                    ? 'tandem (2 circuits)'
                    : '120V, single'}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedId(null)} hitSlop={10}>
              <Text style={styles.sheetClose}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.shutoffBanner}>
            <Text style={styles.shutoffText}>
              To cut power here, switch off breaker{' '}
              <Text style={styles.shutoffStrong}>{positionLabel(selected)}</Text>
              {selected.pole === 'double' ? ' (both tied handles drop together).' : '.'}
            </Text>
          </View>

          {selectedItems.length > 0 ? (
            <View style={styles.deviceList}>
              {selectedItems.map((it) => (
                <View key={it.id} style={styles.deviceRow}>
                  <Text style={styles.deviceGlyph}>{itemKindGlyph(it.kind)}</Text>
                  <Text style={styles.deviceName}>{it.name}</Text>
                  {it.room ? <Text style={styles.deviceRoom}>{it.room}</Text> : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No devices mapped yet.</Text>
          )}

          <View style={styles.sheetActions}>
            <Pressable
              style={[styles.toggleBtn, selected.state === 'on' ? styles.toggleOn : styles.toggleOff]}
              onPress={() => toggleBreaker(selected.id)}
            >
              <Text style={styles.toggleText}>
                {selected.state === 'on' ? 'Switch OFF' : 'Switch ON'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.smallBtn}
              onPress={() =>
                router.push({
                  pathname: '/item-edit',
                  params: { panelId: panel.id, breakerId: selected.id },
                })
              }
            >
              <Text style={styles.smallBtnText}>+ Device</Text>
            </Pressable>
            <Pressable
              style={styles.smallBtn}
              onPress={() =>
                router.push({
                  pathname: '/breaker-edit',
                  params: { panelId: panel.id, breakerId: selected.id },
                })
              }
            >
              <Text style={styles.smallBtnText}>Edit</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  muted: { color: colors.textDim, fontSize: 14 },
  linkBtn: { padding: space.sm },
  linkText: { color: colors.accent, fontWeight: '700' },

  searchWrap: { paddingHorizontal: space.lg, gap: space.sm, zIndex: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    paddingHorizontal: space.md,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, color: colors.text, paddingVertical: space.md, fontSize: 15 },
  results: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  resultPos: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
  },
  resultName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  resultSub: { color: colors.textDim, fontSize: 12 },
  resultLocate: { color: colors.textFaint, fontSize: 12, fontWeight: '700' },

  rooms: { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.edge,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#0a0d12' },

  panelActions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    backgroundColor: colors.surface,
  },
  ghostBtnText: { color: colors.textDim, fontWeight: '700' },
  primaryGhostBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentDim,
    backgroundColor: '#2a1f12',
  },
  primaryGhostText: { color: colors.accent, fontWeight: '800' },
  consultBtn: {
    marginTop: space.sm,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    backgroundColor: colors.surface,
  },
  consultText: { color: colors.text, fontWeight: '700' },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.edge,
    padding: space.lg,
    gap: space.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  sheetPos: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    minWidth: 34,
    alignItems: 'center',
  },
  sheetPosText: { color: '#0a0d12', fontWeight: '900', fontFamily: 'monospace' },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sheetSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  sheetClose: { color: colors.textFaint, fontSize: 18, fontWeight: '700' },

  shutoffBanner: {
    backgroundColor: '#2a1f12',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentDim,
    padding: space.md,
  },
  shutoffText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  shutoffStrong: { color: colors.accent, fontWeight: '900', fontFamily: 'monospace' },

  deviceList: { gap: space.sm },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  deviceGlyph: { fontSize: 16 },
  deviceName: { color: colors.text, fontSize: 14, flex: 1 },
  deviceRoom: { color: colors.textFaint, fontSize: 12 },

  sheetActions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: space.md, borderRadius: radius.md },
  toggleOn: { backgroundColor: colors.off },
  toggleOff: { backgroundColor: colors.on },
  toggleText: { color: '#0a0d12', fontWeight: '900', fontSize: 15 },
  smallBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    backgroundColor: colors.surfaceAlt,
  },
  smallBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },
})
