---
name: FuelFool architecture
description: Stack overview, live URLs, service IDs, and repo for the FuelFool project
---

**Stack:**
- Frontend: React + Vite, deployed on Vercel
- Backend API: Express 5 + Node 18, deployed on Railway
- Repo: github.com/ascendllc/fuelfool (GitHub connector available via `listConnections('github')`)

**Live URLs:**
- https://fuelfool.com (primary custom domain)
- https://www.fuelfool.com
- https://fuelfool.vercel.app (Vercel subdomain, always works)
- Railway API: https://workspaceapi-server-production-0761.up.railway.app

**Service IDs (Railway):**
- Project ID: 29fdbd66-611b-44fd-a505-d15ef23b4b5f
- Environment ID: 06d788ee-865a-4238-9a99-5babca9a3f24
- Service ID: 6b993674-32c6-43a3-aff1-b29928793471

**Vercel:**
- Project ID: prj_k9OKDvcSnvwvC2xVDjRVlEy7tfWW

**DNS:** fuelfool.com nameservers are Squarespace (`nsb1-4.squarespacedns.com`). DNS is managed in Squarespace → Domains → fuelfool.com → DNS Settings.

**Key env vars (Railway, service level):**
- `EIA_API_KEY` — gas price data
- `GOOGLE_MAPS_API_KEY` — autocomplete + distance
- `CORS_ORIGIN` — comma-separated allowed origins (all three domains + Vercel subdomain)
- `NODE_ENV=production`

**Key env vars (Vercel):**
- `VITE_API_BASE_URL` — set to the Railway domain above
