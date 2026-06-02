import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { APP } from '@/config/app'
import type { Panel } from '@/domain/types'
import { useStore } from '@/store/useStore'
import { colors, radius, space } from '@/theme'

export default function Home() {
  const insets = useSafeAreaInsets()
  const panels = useStore((s) => s.panels)
  const breakers = useStore((s) => s.breakers)
  const items = useStore((s) => s.items)
  const loadDemo = useStore((s) => s.loadDemo)
  const setActivePanel = useStore((s) => s.setActivePanel)

  const open = (id: string) => {
    setActivePanel(id)
    router.push(`/panel/${id}`)
  }

  const onLoadDemo = () => {
    const id = loadDemo()
    open(id)
  }

  const counts = (panel: Panel) => ({
    breakers: breakers.filter((b) => b.panelId === panel.id).length,
    items: items.filter((i) => i.panelId === panel.id).length,
  })

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl },
      ]}
    >
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Text style={styles.logoBolt}>⚡</Text>
        </View>
        <View>
          <Text style={styles.appName}>{APP.displayName}</Text>
          <Text style={styles.tagline}>{APP.tagline}</Text>
        </View>
      </View>

      {panels.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your panels</Text>
          {panels.map((p) => {
            const c = counts(p)
            return (
              <Pressable key={p.id} style={styles.panelCard} onPress={() => open(p.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelName}>{p.name}</Text>
                  <Text style={styles.panelMeta}>
                    {p.location ? `${p.location} · ` : ''}
                    {c.breakers} breakers · {c.items} devices
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )
          })}
        </View>
      ) : (
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Map your electrical panel</Text>
          <Text style={styles.heroBody}>
            Build a living, searchable twin of your breaker box. Know exactly which breaker
            powers what — before you ever touch a wire.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{panels.length > 0 ? 'Add another' : 'Get started'}</Text>

        <ActionCard
          glyph="🛠"
          title="Build a panel manually"
          body="Set rows, amps, and breaker types to match your box."
          onPress={() => router.push('/setup/manual')}
        />
        <ActionCard
          glyph="🏠"
          title="Load demo home"
          body="A realistic 20-slot panel with 20+ mapped devices to explore."
          onPress={onLoadDemo}
        />
        <ActionCard
          glyph="📷"
          title="Scan a photo of your panel"
          body="Snap your panel labels and let AI draft the layout."
          onPress={() => router.push('/scan')}
        />
      </View>
    </ScrollView>
  )
}

function ActionCard({
  glyph,
  title,
  body,
  onPress,
  comingSoon,
}: {
  glyph: string
  title: string
  body: string
  onPress: () => void
  comingSoon?: boolean
}) {
  return (
    <Pressable
      style={[styles.action, comingSoon && styles.actionDisabled]}
      onPress={onPress}
      disabled={comingSoon}
    >
      <Text style={styles.actionGlyph}>{glyph}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.actionTitleRow}>
          <Text style={styles.actionTitle}>{title}</Text>
          {comingSoon ? <Text style={styles.soon}>SOON</Text> : null}
        </View>
        <Text style={styles.actionBody}>{body}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, gap: space.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBolt: { fontSize: 26 },
  appName: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  tagline: { color: colors.textDim, fontSize: 13, maxWidth: 260 },
  hero: { gap: space.sm },
  heroTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  heroBody: { color: colors.textDim, fontSize: 15, lineHeight: 22 },
  section: { gap: space.sm },
  sectionTitle: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  panelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    padding: space.lg,
  },
  panelName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  panelMeta: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  chevron: { color: colors.textFaint, fontSize: 28, fontWeight: '300' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    padding: space.lg,
  },
  actionDisabled: { opacity: 0.55 },
  actionGlyph: { fontSize: 26 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  actionBody: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  soon: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
})
