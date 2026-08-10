# chat-auth-demo

Login-gated AI chat demo. A separate app from the existing
`zuplo-wasm-ai-gateway` demo (which stays untouched, API-key-in-UI style) —
this one only lets a chat happen after a real login, backed by Zuplo's JWT
auth policy.

## Architecture

```
Browser
  → Akamai Functions (Wasm Function, this repo)
      ├── POST /api/login → proxies to zuplo-auth-server's /login
      │                     (returns a short-lived JWT)
      └── POST /api/chat  → proxies to red-salamander's chat-app route,
                             forwarding the browser's JWT as Authorization:
                             Bearer <jwt> unchanged. Zuplo's jwt-auth-inbound
                             policy rejects anything without a valid token.
  → static assets (/) → spin-fileserver serving assets/
```

- Auth/token issuer: https://github.com/hikaneko/zuplo-auth-server
- Chat gateway: `red-salamander` project, `chat-app` App (see
  `../CLAUDE.md` for the full route/policy setup and the gotchas hit while
  wiring this up — route ordering, the app_id-must-be-first-segment
  constraint, the Zuplo-to-Zuplo JWKS fetch failure, etc.)

## Commands

```bash
npm install
npm run build   # or: spin build
spin up          # http://localhost:3000
spin aka login    # once
spin aka deploy
```

## Demo credentials

Whatever is configured in `zuplo-auth-server`'s `DEMO_USERS` environment
variable (e.g. `alice` / `changeme`). This is a demo — there's no real user
management.
