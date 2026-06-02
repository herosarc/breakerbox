# BreakerBox AI Proxy

A tiny, stateless server that holds the Anthropic API key and exposes two
endpoints to the app. The key **must not** live in the mobile app, so all
Claude calls go through here.

Powered by **Claude (`claude-opus-4-8`)**:

- `POST /v1/scan` — vision + structured outputs. Send a base64 panel photo
  (and/or pasted notes); get back a `PanelDraft` (breakers, slots, amps, types)
  the app renders for the user to confirm.
- `POST /v1/consult` — streaming (SSE) safety-first "virtual electrician"
  consultation with adaptive thinking.
- `GET /health` — liveness + whether the API key is configured.

## Run locally

```bash
cd server
cp .env.example .env      # add your ANTHROPIC_API_KEY
npm install
npm run dev               # http://localhost:8787
```

Point the app at it by setting `EXPO_PUBLIC_AI_PROXY_URL=http://<your-ip>:8787`
in the app's environment (see the app README).

## Deploy

Any Node host works (Render, Railway, Fly.io, a VM). Set `ANTHROPIC_API_KEY`
and, for anything internet-facing, `PROXY_SHARED_SECRET` (the app sends it as a
bearer token). Build with `npm run build`, run with `npm start`.

## Security notes

- The API key is read from the environment and never sent to the client.
- Set `PROXY_SHARED_SECRET` in production so the proxy isn't open to the world.
- This service is stateless — no panel data is persisted here.
