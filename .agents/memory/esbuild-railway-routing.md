---
name: esbuild Railway Express routing fix
description: Why ESM esbuild bundles break Express sub-router mounting on Railway and how to fix it
---

**The Problem**: When esbuild bundles Express (and pino-http with esbuildPluginPino) as ESM format, `app.use("/api", router)` silently fails on Railway (Node 18/22). Direct `app.get()` routes work, sub-routers mounted via `app.use("/prefix", router)` do not. All `/api/*` routes return 404. Root cause likely: esbuildPluginPino + ESM format creates incompatible module instances on Railway's runtime environment.

**The Fix** (three parts, all required):
1. Switch esbuild format from `"esm"` to `"cjs"`, `outExtension: { ".js": ".cjs" }`, remove banner
2. Externalize runtime deps: `"express"`, `"cors"`, `"pino"`, `"pino-http"`, `"pino-pretty"`, `"thread-stream"` — removes esbuildPluginPino dependency entirely, ensures single module instances via Node.js module cache
3. Mount critical routes (especially health check) directly on app: `app.get("/api/health", ...)` — even with CJS+external, the health sub-router path didn't match on Railway

**Why**: Railway's Node 18/22 runtime + pnpm's module layout + esbuild's ESM/CJS interop creates subtle module identity mismatches. CJS + external deps = native Node.js module caching = guaranteed single express instance.

**How to apply**: For any Express API server deployed to Railway in this monorepo, use CJS output format, externalize express/pino/cors, and add health check directly to app.ts.

**Result**: Bundle shrinks from 1.4MB to 131KB. All API routes work on Railway.
