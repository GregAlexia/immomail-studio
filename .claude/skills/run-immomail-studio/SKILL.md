---
name: run-immomail-studio
description: Launch and drive ImmoMail Studio (Next.js 16 + Drizzle/Postgres demo app) from a fresh Linux container. Use when asked to run, start, demo, or screenshot this app, or to verify a change works end-to-end. Covers the local Postgres bootstrap this repo needs since there's no SQLite/dev-db fallback.
---

# Run ImmoMail Studio

This app has **no dev-mode fallback database** — `lib/db/client.ts` always
connects via `postgres-js`, and `DATABASE_URL` is required (there's a
placeholder connection string but it points nowhere). In production the repo
targets Supabase Postgres, but for a local/sandboxed run you need your own
Postgres instance. There is no `.env.example` committed despite the README
mentioning one — set `DATABASE_URL` as a plain env var instead.

## 1. Get a Postgres instance

This container image already ships `postgresql-16` (check with
`pg_lsclusters`). If so:

```bash
service postgresql start          # or: pg_ctlcluster 16 main start
su postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
su postgres -c "psql -c \"CREATE DATABASE immomail;\""                 # ignore error if it already exists
```

If Postgres isn't installed at all: `apt-get update && apt-get install -y postgresql`
then run the same three commands above.

## 2. Install deps and point the app at that DB

```bash
cd /home/user/immomail-studio   # or wherever the repo is checked out
npm install                      # only needed once / after lockfile changes
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/immomail"
```

## 3. Seed

```bash
npm run seed
```

This runs `ensureSchema()` under the hood, which executes
`lib/db/ddl.ts`'s `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`
statements (only when `NODE_ENV !== "production"`, which is the default for
this script) and then loads the 3-agency demo dataset. Expect a bunch of
harmless Postgres `NOTICE: relation "..." already exists, skipping` lines on
every subsequent run/dev-boot — that's the idempotent DDL, not an error.

Re-running `npm run seed` at any time wipes and reloads all tables (see
`lib/seed-data.ts`) — use it to reset the demo to its initial state instead
of chasing down individual rows.

## 4. Launch

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/immomail"
nohup npm run dev > /tmp/immomail-dev.log 2>&1 &
disown
sleep 4 && tail -5 /tmp/immomail-dev.log   # wait for "✓ Ready in ...ms"
```

Runs on `http://localhost:3000`. In a sandboxed/remote-execution
environment this port is only reachable from inside the container — it is
**not** a link to hand back to the user; use it to verify with `curl` /
Playwright, then report what you saw (see below).

## 5. Drive it, don't just load it

Smoke check:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/        # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/leads   # 200
```

To actually see the UI (screenshot via headless Chromium — already
pre-installed in this environment, do not `playwright install`):

```bash
cat > /tmp/pw-run.mjs << 'EOF'
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/immomail-home.png' });
await browser.close();
EOF
node /tmp/pw-run.mjs
```

To exercise the actual demo scenario (not just static pages), click through
real buttons — e.g. sort the inbox / advance the demo clock — since those
are what trigger the automation engine (`lib/automation-engine.ts`) via
Server Actions in `app/actions.ts`:

```js
// inside the same Playwright script, after goto('/leads')
await page.getByRole('button', { name: /Trier les .* emails maintenant/ }).click();
// then goto('/') and click the "Évaluer" button to advance the demo clock
```

## Known pitfalls

- **`import "server-only"` blocks plain Node/tsx scripts.** Files like
  `lib/automation-engine.ts` import the `server-only` package, which isn't a
  real npm dependency here (Next aliases it internally). If you try to
  `tsx` a standalone script that imports it (e.g. to unit-test `runEngine`
  directly, bypassing the app), it'll throw `Cannot find module
  'server-only'`. Either drive the engine through the real app (click the
  UI buttons / hit the Server Actions), or, for a throwaway test only,
  stub it: `mkdir -p node_modules/server-only && echo '{"name":"server-only","main":"index.js"}' > node_modules/server-only/package.json && echo '' > node_modules/server-only/index.js` — then delete that stub afterward, don't commit it.
- **Pooler port matters in production only.** The README's port
  5432-vs-6543 Supabase pooler warning is irrelevant for a local Postgres —
  it only applies when pointing at real Supabase infra.
- **No auth.** Agency selection is a plain cookie (`agency_id`), there's no
  login — don't waste time looking for credentials.
