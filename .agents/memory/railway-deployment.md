---
name: Railway deployment — FuelFool API
description: How to deploy, update env vars, and debug the Railway API service for FuelFool
---

**Trigger a redeploy (GraphQL):**
```js
fetch("https://backboard.railway.app/graphql/v2", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${RAILWAY_TOKEN}` },
  body: JSON.stringify({
    query: `mutation { environmentTriggersDeploy(input: {
      projectId: "29fdbd66-611b-44fd-a505-d15ef23b4b5f"
      environmentId: "06d788ee-865a-4238-9a99-5babca9a3f24"
      serviceId: "6b993674-32c6-43a3-aff1-b29928793471"
    }) }`
  })
});
```

**Poll deployment status:**
```js
{ deployments(input: { projectId: "..." serviceId: "..." environmentId: "..." }) {
    edges { node { id status } }
} }
```
Status values: BUILDING → DEPLOYING → SUCCESS / FAILED / CRASHED

**Update a service-level env var:**
```js
mutation { variableUpsert(input: {
  projectId: "..."  environmentId: "..."  serviceId: "..."
  name: "VAR_NAME"  value: "new-value"
}) }
```
Always redeploy after changing env vars for them to take effect.

**Read current env vars (includes service-level):**
```js
{ variables(projectId: "..."  environmentId: "..."  serviceId: "...") }
```

**Get build logs for a failed deploy:**
```js
{ buildLogs(deploymentId: "..."  limit: 60) { message timestamp } }
```

**CORS_ORIGIN format:** comma-separated string, e.g.:
`https://fuelfool.vercel.app,https://fuelfool.com,https://www.fuelfool.com`

**Critical prod build gotcha:** Railway sets `NODE_ENV=production`, which causes pnpm to skip devDependencies. Any package used at build time (like `esbuild`) must be in `dependencies`, not `devDependencies`. Failure symptom: `ERR_MODULE_NOT_FOUND` for the build tool.

**Build + start config (railway.toml):**
- buildCommand: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server build`
- startCommand: `node --enable-source-maps artifacts/api-server/dist/index.cjs`
- healthcheckPath: `/api/health`
- healthcheckTimeout: 120

**Bundle config:** CJS format, express/pino/cors externalized. See esbuild-railway-routing.md for why ESM fails.

**RAILWAY_TOKEN** is available in `code_execution` notebook as `RAILWAY_TOKEN` (pre-loaded from scratchpad).
