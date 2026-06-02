import { useLocalSearchParams } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AiNotConfiguredError, consult, isAiConfigured } from '@/ai/client'
import { panelSummary } from '@/ai/summary'
import type { ConsultMessage } from '@/ai/types'
import { useStore } from '@/store/useStore'
import { colors, radius, space } from '@/theme'

const SUGGESTIONS = [
  'Which breaker should I turn off to work on the kitchen outlets?',
  'My bathroom outlet has no power but the breaker looks on. What now?',
  'Is it safe to run a space heater and microwave on the same circuit?',
]

export default function Consult() {
  const insets = useSafeAreaInsets()
  const { panelId } = useLocalSearchParams<{ panelId?: string }>()

  const panel = useStore((s) => s.panels.find((p) => p.id === panelId))
  const breakers = useStore((s) => s.breakers.filter((b) => b.panelId === panelId))
  const items = useStore((s) => s.items.filter((i) => i.panelId === panelId))

  const summary = useMemo(
    () => (panel ? panelSummary(panel, breakers, items) : undefined),
    [panel, breakers, items],
  )

  const [messages, setMessages] = useState<ConsultMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const configured = isAiConfigured()

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    setError(null)
    const history = messages
    setMessages((m) => [...m, { role: 'user', content: question }])
    setBusy(true)
    try {
      const answer = await consult({ question, panelSummary: summary, history })
      setMessages((m) => [...m, { role: 'assistant', content: answer }])
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        setError('The AI proxy is not connected. See server/README.md to set it up.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setBusy(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }

  if (!configured) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Virtual Electrician</Text>
        <Text style={styles.notice}>
          This safety-first AI assistant needs the BreakerBox AI proxy connected. Set
          {' '}
          <Text style={styles.code}>EXPO_PUBLIC_AI_PROXY_URL</Text> (see server/README.md) and rebuild.
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scrollRef} contentContainerStyle={styles.thread}>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚡ Safety first. This is general information, not a substitute for a licensed electrician.
            Never work inside the panel or on live wiring yourself.
          </Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestTitle}>Try asking…</Text>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.suggestChip} onPress={() => send(s)}>
                <Text style={styles.suggestText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            <Text style={m.role === 'user' ? styles.userText : styles.aiText}>{m.content}</Text>
          </View>
        ))}

        {busy ? (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + space.sm }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your panel…"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
          onSubmitEditing={() => send(input)}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || busy) && styles.disabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || busy}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  notice: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  code: { color: colors.accent, fontFamily: 'monospace', fontSize: 13 },
  thread: { padding: space.lg, gap: space.md },
  disclaimer: {
    backgroundColor: '#2a1f12',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentDim,
    padding: space.md,
  },
  disclaimerText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  suggestions: { gap: space.sm },
  suggestTitle: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  suggestChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    padding: space.md,
  },
  suggestText: { color: colors.text, fontSize: 14 },
  bubble: { maxWidth: '88%', borderRadius: radius.lg, padding: space.md },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accent },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.edge,
  },
  userText: { color: '#0a0d12', fontSize: 15, fontWeight: '600' },
  aiText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  error: { color: colors.danger, fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.edge,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.edge,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  sendText: { color: '#0a0d12', fontWeight: '900' },
  disabled: { opacity: 0.5 },
})
