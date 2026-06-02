/**
 * Single source of truth for app identity.
 *
 * The product name is intentionally a placeholder (we want something unique
 * with room to grow into B2B "as-built" documentation). Both the app UI and
 * the Expo build config (app.config.ts) read from app.identity.json, so
 * renaming the product later is a one-line change in that JSON file plus the
 * icon assets.
 */
import identity from '../../app.identity.json'

export const APP = identity as {
  displayName: string
  shortName: string
  slug: string
  bundleId: string
  tagline: string
  scheme: string
}
