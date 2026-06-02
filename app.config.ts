import type { ExpoConfig, ConfigContext } from 'expo/config'
import APP from './app.identity.json'

/**
 * Dynamic Expo config. All identity flows from src/config/app.ts so the
 * product can be renamed in one place once we settle on a name.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP.displayName,
  slug: APP.slug,
  scheme: APP.scheme,
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/images/icon.png',
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP.bundleId,
    infoPlist: {
      // Required usage strings for App Store review (camera + library access
      // power the panel photo scan and per-circuit reference shots).
      NSCameraUsageDescription:
        'Take photos of your breaker panel and the devices on each circuit for reference.',
      NSPhotoLibraryUsageDescription:
        'Attach existing photos of your panel or devices to circuits.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: APP.bundleId,
    adaptiveIcon: {
      backgroundColor: '#0f1115',
      foregroundImage: './assets/images/android-icon-foreground.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0f1115',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Attach existing photos of your panel or devices to circuits.',
        cameraPermission:
          'Take photos of your breaker panel and the devices on each circuit for reference.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
