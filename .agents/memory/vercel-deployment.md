---
name: Vercel deployment — FuelFool frontend
description: How to manage the Vercel project, env vars, and custom domains for FuelFool
---

**Project ID:** `prj_k9OKDvcSnvwvC2xVDjRVlEy7tfWW`
**VERCEL_TOKEN** is available in `code_execution` notebook as `VERCEL_TOKEN` (pre-loaded from scratchpad).

**Deployments are automatic** — every push to `main` on GitHub triggers Vercel. No manual trigger needed in normal flow. To force a redeploy, push any commit.

**Check latest deployment status:**
```js
fetch(`https://api.vercel.com/v6/deployments?projectId=prj_k9OKDvcSnvwvC2xVDjRVlEy7tfWW&limit=1`, {
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
})
// states: BUILDING → READY / ERROR / CANCELED
```

**Update or add an env var:**
```js
// POST to add, PATCH /:id to update
fetch(`https://api.vercel.com/v10/projects/prj_.../env`, {
  method: "POST",
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ key: "VITE_API_BASE_URL", value: "https://...", target: ["production", "preview"], type: "plain" })
})
```

**VITE_ vars are baked in at build time** — they become static strings in the JS bundle. Changing them on Vercel requires a redeploy to take effect.

**Custom domains:**
- Add via: `POST https://api.vercel.com/v10/projects/:projectId/domains` with `{ name: "fuelfool.com" }`
- Check status: `GET https://api.vercel.com/v6/domains/:domain/config` — look for `misconfigured: false`

**DNS records required (for Squarespace or any registrar):**
| Type | Host | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

**Squarespace DNS:** Go to Domains → fuelfool.com → DNS Settings → Custom Records. Replace any existing A record pointing to Squarespace.

**Frontend API calls — key rule:** Use `import.meta.env.VITE_API_BASE_URL` for all Railway API fetches, NOT `import.meta.env.BASE_URL`. `BASE_URL` is Vite's base path (just `/` on Vercel) — calls using it go to the Vercel domain, not Railway. The `api-client-react` library uses `setBaseUrl(VITE_API_BASE_URL)` in `main.tsx` automatically; any manually-written `fetch()` calls must use `VITE_API_BASE_URL` explicitly.
