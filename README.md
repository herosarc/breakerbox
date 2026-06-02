# BreakerBox _(working name)_

> Your electrical panel, mapped. Know exactly what to switch off — before you touch a wire.

An interactive "digital twin" of a home (and eventually commercial) electrical
panel. Build a visual replica of your breaker box, map every device to its
circuit, and instantly find which breaker to flip for any outlet or appliance.

Native iOS/Android app built with **Expo (React Native) + TypeScript**, designed
for App Store distribution via EAS Build.

> The product name is a placeholder. It lives in [`app.identity.json`](./app.identity.json)
> and flows into both the UI and the native build config — renaming is a
> one-line change there (plus icon assets).

## Status — what's built

- **Onboarding** — load a realistic demo home, or build a panel manually.
- **Digital twin cabinet** — two-column bus layout with odd/even numbering,
  single / 240V double-pole / tandem breakers, color-coded by type, with
  spring-loaded, tap-to-flip handles. Double-pole handles are inherently tied.
- **Recall search** — fuzzy search across devices, rooms, and breaker labels;
  results "locate" and flash the breaker on the board.
- **Room filter rails** — one-tap highlight of every breaker feeding a room.
- **Circuit catalog** — map devices (with type, room, notes, and a camera /
  library reference photo) to any breaker.
- **"What do I switch off?"** — selecting a device or breaker shows the exact
  breaker number(s) to cut, including tied 240V pairs.
- **Local-first persistence** — entire panel saved on-device (AsyncStorage),
  works fully offline.

## Roadmap (next)

- **AI Smart Scan** — photograph panel labels; a secure server proxy calls
  **Claude** (vision) to draft the layout. _Needs a deployed proxy + API key._
- **Virtual electrician** — deep-reasoning Q&A with safety disclaimers.
- **Outage / trip diagnostic wizard** and trip simulator.
- **Printable panel-door directory**, cloud sync & multi-user, sub-panels,
  floor plans + location, IoT telemetry.

## Architecture

```
src/
  app/            # expo-router screens (index, panel/[id], modals, setup)
  components/     # BreakerSwitch, PanelCabinet, shared Field kit
  domain/         # types, panel geometry, demo seed, search — pure & testable
  store/          # zustand + AsyncStorage persistence (handle-tie logic)
  theme/          # industrial dark visual language
  config/         # app identity loader
```

The `domain/` layer is pure TypeScript with no React/Expo imports, so the
electrical logic (placement validation, double-pole spans, search) can be unit
tested in isolation.

## Develop

```bash
npm install
npx expo start            # scan QR with Expo Go, or run a dev client
npx tsc --noEmit          # type-check (strict)
npx expo export --platform web   # validate the bundle compiles
```

## Ship to the App Store (outline)

1. `npm i -g eas-cli && eas login`
2. `eas build:configure`
3. `eas build --platform ios` (cloud build — no Mac required)
4. `eas submit --platform ios` (needs your Apple Developer account)

See the project notes for the full submission checklist.
