# Deploying the BreakerBox web build

The app exports to a plain static site (`dist/`), so any static host works. Pick one.

> The AI features (Smart Scan / Virtual Electrician) need the separate proxy in
> `server/` plus an Anthropic key. Everything else works on a static deploy.

---

## Option A — Netlify (connected repo, auto-deploys on push)

1. app.netlify.com → **Add new site → Import an existing project** → pick `herosarc/breakerbox`.
2. Netlify reads `netlify.toml`, so settings are pre-filled:
   - Build command: `npm run build:web`
   - Publish directory: `dist`
   - Node version: 22 (set via `netlify.toml`)
3. **Deploy.** You get a `https://<name>.netlify.app` link — open it on your phone.

### Fastest one-off (no git): Netlify Drop
On your Mac: `npm run build:web`, then drag the resulting **`dist`** folder onto
**app.netlify.com/drop** → instant link.

---

## Option B — Cloudflare Pages (connected repo, auto-deploys on push)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → `herosarc/breakerbox`.
2. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build:web`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION = 22`
3. **Save and Deploy.** You get a `https://<name>.pages.dev` link.

For SPA-style deep links on Pages, add a `_redirects` file containing
`/*  /index.html  200` to the `public/` folder if needed (the static export
already emits per-route HTML, so this is usually optional).

---

## Enabling the AI features later

Set the proxy URL at build time so the app calls your deployed `server/`:

```
EXPO_PUBLIC_AI_PROXY_URL=https://your-proxy-host
EXPO_PUBLIC_AI_PROXY_TOKEN=your-shared-secret   # if you set one
```

Add these as environment variables in Netlify/Cloudflare before building.
