# Smart Cloud Security — Admin Portal

A React admin portal for the [Smart Cloud Security Gateway](../ddos_gateway).
It's a client-side app that talks directly to the gateway's `/admin/*` API —
there's no backend of its own.

```
 browser (this app) --fetch, X-Admin-Token--> gateway /admin/*
```

## What's here

Six pages, all driven by the gateway API documented in the gateway's own
README:

| Page | What it does |
|---|---|
| **Dashboard** | Stat cards (active keys, blocked IPs, requests/alerts last hour), enforcement mode, recent alerts, active blocklist. Auto-refreshes every 15s. |
| **API Keys** | List keys, create a key (owner, admin flag, ML-exempt flag) with a one-time reveal of the raw key, toggle ML-exemption, revoke. |
| **Blocklist** | List active/all blocks, manually block an IP (reason, duration or permanent), unblock. |
| **Alerts** | Full alert feed with severity, IP, attack probability, message. |
| **Requests & Labeling** | Recent request log with attack probability; label any ML-scored request as ground-truth benign/attack (feeds the retraining pipeline); separate view of everything already labeled. |
| **Model Calibration** | Score an arbitrary feature vector directly against the loaded model — build the whole feature grid from the model's own reported schema, edit values, see the resulting probability and block/allow verdict. |

## Quick start

```bash
cd admin_portal
npm install
npm run dev
```

Opens on `http://localhost:5173`. On first load you'll see a sign-in
screen — it asks for the gateway's URL and its `ADMIN_BOOTSTRAP_TOKEN`.
Both are stored only in this browser's `localStorage`; nothing is baked
into the build or sent anywhere except the gateway you point it at.

### Point it at your gateway

The login screen's "Gateway URL" field defaults to
`VITE_GATEWAY_URL` (see `.env.example`) but can be overridden per-session
right there — handy if you manage more than one gateway from the same
browser. To change the *default* it pre-fills:

```bash
cp .env.example .env
# edit VITE_GATEWAY_URL
```

### CORS — read this before you deploy

Browsers block cross-origin requests unless the server opts in. The
gateway now ships with CORS middleware (see its `app/main.py`), controlled
by `ADMIN_PORTAL_ORIGINS` in the gateway's `.env`:

```bash
# in ddos_gateway/.env
ADMIN_PORTAL_ORIGINS=http://localhost:5173,https://admin.yourdomain.com
```

It defaults to `http://localhost:5173` (this app's Vite dev-server origin),
so `npm run dev` works out of the box against a gateway on its default
`.env`. **Add this app's real deployed origin before you host it anywhere
else**, or every request will fail with a CORS error in the browser
console even though the API itself is reachable.

## Building for production

```bash
npm run build
```

Outputs a static site to `dist/` — plain HTML/CSS/JS, no server-side
rendering, no Node runtime needed to serve it. Deploy `dist/` behind any
static file host (nginx, Caddy, S3+CloudFront, Netlify, Vercel, GitHub
Pages, or even the gateway's own container via a second nginx sidecar).
Preview a production build locally with `npm run preview`.

Because the gateway URL and token are entered at runtime (not compiled
in), the same `dist/` build works against any gateway instance — you're
not rebuilding per-environment.

## Auth model

There's no separate portal login system. `ADMIN_BOOTSTRAP_TOKEN` *is* the
credential — same one used for `curl -H "X-Admin-Token: ..."` or the
gateway's old `?token=` dashboard link. The portal sends it as the
`X-Admin-Token` header on every request. Signing out just clears it from
this browser's `localStorage`; it doesn't revoke or rotate anything
server-side (there's only one admin token today — see the gateway
README's admin-powers list for how to rotate it).

If you need more than one human admin with individually revocable access,
that's a gateway-side change (per-admin tokens) not currently built —
worth raising if you need it.

## Replacing the old HTML dashboard

The gateway's built-in `GET /admin/dashboard` (server-rendered HTML,
`?token=...` auth) still works and isn't going anywhere — it's a
zero-dependency fallback if you ever need a quick look without deploying
this app. This portal is the fuller replacement for day-to-day admin
work: it's the only one that can create/revoke keys, manage the
blocklist, label requests, or run the calibration tool — the old
dashboard is read-only.

## Project layout

```
src/
  api.js              fetch wrapper for every /admin/* endpoint
  AuthContext.jsx      token + gateway URL state, login/logout
  usePoll.js            polling-fetch hook (auto-refresh + 401 -> logout)
  format.js             timestamp/probability/text formatting helpers
  components/
    Layout.jsx           sidebar nav + page frame
    StatusBanner.jsx      error/notice banner components
  pages/
    Login.jsx, Dashboard.jsx, ApiKeys.jsx, Blocklist.jsx,
    Alerts.jsx, Requests.jsx, ModelScore.jsx
```

No UI framework dependency beyond `react-router-dom` — styling is one
plain CSS file (`src/styles.css`) matching the gateway's existing dark
dashboard theme.
