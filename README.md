# FuelFool

**Don't be Fooled By How Much Fuel.**

FuelFool is a free gas trip cost calculator. Enter your ZIP for live EIA gas prices, pick your vehicle for EPA-rated MPG, enter your route — and see the exact fuel cost of your road trip.

---

## Project structure

This is a pnpm monorepo with two deployable services:

| Service | Directory | Hosting |
|---------|-----------|---------|
| Frontend (React + Vite) | `artifacts/fuelfool/` | Vercel |
| API server (Express) | `artifacts/api-server/` | Railway |

---

## Local development

```bash
pnpm install
```

Then start both services (two terminal tabs or use Replit workflows):

```bash
# API server
pnpm --filter @workspace/api-server dev

# Frontend
pnpm --filter @workspace/fuelfool dev
```

---

## GitHub repository

The code is hosted at: **https://github.com/ascendllc/fuelfool**

---

## Deploying to production

### Prerequisites

- [Vercel account](https://vercel.com) (free tier works)
- [Railway account](https://railway.app) (free tier works)
- GitHub repo already pushed: `https://github.com/ascendllc/fuelfool`

### Step 1 — Deploy the API server on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select the `ascendllc/fuelfool` repository
3. In the service settings → **Source** → set **Root Directory** to `artifacts/api-server`
   - This tells Railway to run commands from that subdirectory and pick up its `railway.toml`
   - Railway then uses:
     - **Build:** `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server build`
     - **Start:** `node --enable-source-maps dist/index.mjs`
4. In Railway → **Variables**, add:

   | Variable | Value |
   |----------|-------|
   | `EIA_API_KEY` | Your EIA API key (free at [eia.gov/opendata](https://www.eia.gov/opendata/)) |
   | `GOOGLE_MAPS_API_KEY` | Your Google Maps API key |
   | `CORS_ORIGIN` | Your Vercel frontend URL (e.g. `https://fuelfool.vercel.app`) — add this after Step 2 |

5. Note your Railway API URL (e.g. `https://fuelfool-api.up.railway.app`) — you'll need it in Step 2.

### Step 2 — Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo
2. Leave **Root Directory** blank (monorepo root)
3. Vercel auto-detects `vercel.json` and uses:
   - **Build command:** `pnpm install --frozen-lockfile && pnpm --filter @workspace/fuelfool build`
   - **Output directory:** `artifacts/fuelfool/dist/public`
4. In Vercel → **Settings → Environment Variables**, add:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_BASE_URL` | Your Railway API URL from Step 1 (e.g. `https://fuelfool-api.up.railway.app`) |

5. Redeploy after adding the env var.

### Step 3 — Update your production domain

After deployment, find-and-replace `YOUR_PRODUCTION_DOMAIN` in these files with your actual Vercel domain (e.g. `fuelfool.vercel.app` or your custom domain):

- `artifacts/fuelfool/public/sitemap.xml`
- `artifacts/fuelfool/public/robots.txt`
- `artifacts/fuelfool/public/llms.txt`
- `artifacts/fuelfool/index.html` (inside the `<script type="application/ld+json">` block)

---

## Environment variables reference

### API server (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto-set by Railway | Port the server listens on |
| `EIA_API_KEY` | Yes | U.S. EIA API key for gas prices |
| `GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key (Places + Distance Matrix) |
| `CORS_ORIGIN` | Recommended | Comma-separated list of allowed frontend origins |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Full URL of the Railway API (no trailing slash) |

---

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, TanStack Query, Wouter
- **Backend:** Express 5, Pino, esbuild
- **Data sources:** U.S. EIA (gas prices), FuelEconomy.gov (MPG), Google Maps (distance + places)
