import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { colors } from '@/theme'
import { useStore } from '@/store/useStore'

export default function RootLayout() {
  const hydrated = useStore((s) => s.hydrated)
  // Guard against a brief flash before AsyncStorage rehydrates.
  const [minDelay, setMinDelay] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinDelay(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {hydrated || minDelay ? (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="panel/[id]" options={{ title: 'Panel' }} />
            <Stack.Screen
              name="setup/manual"
              options={{ title: 'New Panel', presentation: 'modal' }}
            />
            <Stack.Screen
              name="breaker-edit"
              options={{ title: 'Breaker', presentation: 'modal' }}
            />
            <Stack.Screen
              name="item-edit"
              options={{ title: 'Device', presentation: 'modal' }}
            />
            <Stack.Screen
              name="diagnose"
              options={{ title: 'Diagnose Outage', presentation: 'modal' }}
            />
            <Stack.Screen name="scan" options={{ title: 'Smart Scan', presentation: 'modal' }} />
            <Stack.Screen
              name="consult"
              options={{ title: 'Virtual Electrician', presentation: 'modal' }}
            />
          </Stack>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
