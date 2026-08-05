# Deployment Notes — Huizemark Agent Ordering Hub on Netlify

This documents how the app got from "built and working locally" to a live,
public URL on Netlify, including every real bug and platform limitation
found along the way. Keep this around — several of the fixes here are not
obvious and would be easy to accidentally revert.

## Live site

**https://huizemark-agent-hub.netlify.app**

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@huizemark.co.za` | `Huizemark2026!` |
| Mienke / MJ / Nadia / Chantal | `mienke@`, `mj@`, `nadia@`, `chantal@huizemark.co.za` | `Huizemark2026!` |
| Agent (any of 12) | e.g. `sarah.merwe@huizemark.co.za` | `Huizemark2026!` |

Database is a real, provisioned Postgres instance (via Netlify DB / Neon),
seeded with 23 orders across every pipeline stage, 12 agents, 6 suppliers,
29 categories. See `README.md` for what the app itself does.

Two earlier sites (`huizemark-ordering-hub.netlify.app` and
`huizemark-order-hub.netlify.app`) were abandoned mid-session after getting
stuck in a bad deploy state (see below) and can be deleted.

## The app, and what changed for deployment

The app was originally built against Next.js 16 + SQLite for local dev.
Deploying it to Netlify required:

- **`prisma/schema.prisma`**: datasource provider `sqlite` → `postgresql`.
- **`next.config.ts`**: added `output: "standalone"` — produces a
  self-contained Node server bundle instead of relying on a `.next` folder
  plus `node_modules` at runtime.
- **`src/lib/prisma.ts`**: reads `NETLIFY_DB_URL` first, falling back to
  `DATABASE_URL`, falling back to a syntactically-valid placeholder
  connection string. The placeholder exists because Prisma Client throws
  *at construction time* (not just on first query) if the datasource URL
  is completely unset — fatal if this module gets imported during
  build-time route analysis, which it does.
- **`src/proxy.ts`**: exempted `/api/admin/seed` from the session-auth
  gate. That endpoint exists specifically to seed a *freshly provisioned*
  database, before any user account exists to log in as — the global
  auth middleware was redirecting it to `/login` before its own
  `SEED_SECRET` header check ever ran, making it permanently unreachable.
- **`src/app/api/admin/seed/route.ts`**: one-time bootstrap endpoint,
  gated by a shared-secret header (`x-seed-secret` against `SEED_SECRET`),
  calling the same seed logic as local `npm run db:seed`
  (`src/lib/seed-data.ts`).

## Why this needed a hand-rolled deploy path

Netlify's normal Next.js support runs through `@netlify/plugin-nextjs`, a
**Netlify Build Plugin** that converts the build into per-route serverless
functions automatically. That plugin **cannot run** on the specific deploy
mechanism available in this session — a manual zip-upload to
`/sites/{id}/builds` (what the `@netlify/mcp` CLI's `--proxy-path` deploy
command uses under the hood), as opposed to a normal Git-connected/CI
deploy.

This was proven, not assumed: a from-scratch minimal `create-next-app`
project, on both Next 15 and Next 16, with the plugin declared, failed
identically on this deploy path. Real build logs aren't reachable through
any available tool for this pathway either, so most of the diagnosis below
came from local reproduction — rebuilding the exact zip contents
(`git archive` / `tar` with the same exclude list the deploy tool uses) in
a clean `NODE_ENV=production npm ci` environment, and bisecting failing
build commands down to the exact line that broke.

**The workaround**: skip the plugin entirely. `next build` with
`output: "standalone"` produces a self-contained Node HTTP server.
`scripts/prepare-netlify-function.mjs` (run as part of `npm run
build:netlify`) packages that server into a single catch-all Netlify
Function (`netlify/functions/next-server/`), and
`netlify/functions/next-server/next-server.mjs` boots it as a child
process on cold start and reverse-proxies every request to it. One
function instead of Netlify's usual per-route split, and static assets
round-trip through the function instead of the CDN edge — but it's a
real, fully working deployment out of a path that can't run build
plugins at all.

## Bugs found and fixed, in the order they were hit

Every one of these produced a **generic, unhelpful error** (`exit code 2`,
`exit code 4`, or nothing beyond "This page couldn't load" in a browser) —
none came with a message pointing at the actual cause. Diagnosis mostly
meant local reproduction of the exact zip contents, or bisecting the build
command on a disposable throwaway Netlify site until the failure
appeared/disappeared.

1. **Missing `output: "standalone"`** — Netlify's build verification
   checks for `.next/standalone`; without it, even the plugin path fails
   with "publish directory does not contain expected Next.js build
   output."

2. **`__dirname` collision** — Netlify's function bundler injects its own
   `__dirname` shim when compiling an `.mjs` handler for CJS/ESM interop.
   The function's own `const __dirname = ...` (via `fileURLToPath`)
   collided with it, crashing every single invocation with
   `SyntaxError: Identifier '__dirname' has already been declared` (a
   502 on every route). Renamed the local variable to `moduleDir`.

3. **devDependencies silently skipped during install** — Netlify's
   install step runs with `NODE_ENV=production`, and npm skips
   `devDependencies` under that condition. `tailwindcss`,
   `@tailwindcss/postcss`, `typescript`, `eslint` and the `@types/*`
   packages are all required by `next build` itself (CSS processing,
   type-checking, linting), not just local dev — moved them all into
   `dependencies`. (`NPM_FLAGS = "--include=dev"` in `netlify.toml`'s
   `[build.environment]` is also set as a belt-and-braces measure.)

4. **Stale gitignored build artifacts got uploaded anyway** — the zip
   upload tool's own hardcoded ignore list
   (`node_modules/**, .git/**, .netlify/**, .DS_Store, deploy-*.zip,
   .env, coverage/**, tmp/**`) does **not** match this repo's
   `.gitignore`. `src/generated/prisma` (an 18MB Prisma Client build,
   including a `libquery_engine-debian-openssl-3.0.x.so.node` native
   binary compiled for a *different* OS/arch than Netlify's build
   container) and `prisma/dev.db` were both present locally and both
   got silently included in every deploy zip. Always `rm -rf
   src/generated/prisma prisma/dev.db .next
   netlify/functions/next-server/standalone` before deploying.

5. **The standalone server + its embedded `node_modules` blew Netlify's
   function bundler** — `scripts/prepare-netlify-function.mjs` copies
   the standalone output (~95MB, thousands of files, including its own
   traced `node_modules`) into the function's directory. Netlify's
   default function bundler (esbuild-based static import tracing) can't
   discover those files — the function's own code has no static
   `import` into `./standalone` (it spawns that server as a child
   process by file path at runtime) — and whatever it does instead when
   handed a sibling directory that size breaks the entire build with a
   generic `exit code 4`. Confirmed by bisection on a throwaway site:
   `next build` alone always succeeds; a 5-byte dummy file dropped into
   the function directory succeeds; the full standalone tree fails
   *every time*, regardless of whether it's copied there via
   `fs.promises.cp`, shell `cp -a`, or `mv`. **Fix**: `netlify.toml` sets
   `node_bundler = "none"` for the whole `[functions]` block and
   `included_files = ["netlify/functions/next-server/standalone/**"]`
   for the `next-server` function specifically — this ships the tree
   verbatim, bypassing static-analysis bundling entirely.

6. **`mv` on `public/` deleted it from the working tree** — an earlier
   version of `prepare-netlify-function.mjs` used `mv` (not `cp`) for
   *every* directory it touched, including `public/`. `.next/standalone`
   and `.next/static` are disposable build output — fine to move. `public/`
   is source-controlled; moving it deletes it from the repo. Caught
   locally (`git status` showed six deleted files) before it reached a
   deploy; fixed to copy `public/` and move the two genuine build
   artifacts.

7. **Login redirects pointed at an internal, unreachable address** —
   `Host` is a forbidden `fetch()` header, so every request the function
   proxies to the internal standalone server (`http://127.0.0.1:4000`)
   shows `Host: 127.0.0.1:4000` regardless of what the real client sent.
   NextAuth (`trustHost: true` in `auth.config.ts`) built the
   `callback-url` cookie and other absolute URLs from that unreachable
   internal address — invisible to a plain `curl -I` smoke test (which
   only checks status codes), but it broke an actual browser session:
   the post-login redirect resolved to `https://localhost:4000/dashboard`.
   Fixed in two parts:
   - `next-server.mjs` now explicitly sets `x-forwarded-host` /
     `x-forwarded-proto` from the *original* incoming request before
     proxying, which NextAuth prefers when `trustHost` is set.
   - That alone wasn't enough for the credentials sign-in redirect
     specifically (Auth.js has its own `http://localhost:<port>`
     fallback when it can't otherwise determine the base URL) — added an
     explicit `AUTH_URL` environment variable set to the real public
     `https://` domain, which removes all header-based guessing.

   **Verify this one specifically after any redeploy** — it's easy to
   pass every automated/API-level check while still being broken for a
   real browser, because cookies and redirect `Location` headers don't
   show up in a bare status-code check:
   ```bash
   CSRF=$(curl -s -c /tmp/c.txt https://<site>/api/auth/csrf | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
   curl -s -b /tmp/c.txt -c /tmp/c.txt -D - -o /dev/null -X POST \
     https://<site>/api/auth/callback/credentials \
     -d "email=admin@huizemark.co.za&password=Huizemark2026!&csrfToken=$CSRF&callbackUrl=%2Fdashboard" \
     | grep -i '^location'
   # must show https://<your-real-domain>/dashboard, not localhost/127.0.0.1
   ```

## The database extension "poisons" a site after 1–2 deploys

This is the biggest open platform limitation, and the reason there are
three Netlify sites in this project's history instead of one.

`@netlify/database` (which powers Netlify DB / the "Neon" extension) will
successfully provision a real Postgres database and deploy cleanly the
first time — sometimes the second time. After that, **every subsequent
deploy to that same site fails**, with `Failed during stage 'building
site': Build script returned non-zero exit code: 2` and a
`required_functions` field containing a hash, **regardless of whether the
`@netlify/database` package is still present in `package.json`**. Removing
the package doesn't un-stick the site — it appears the extension
activation registers some server-side requirement against the site that
this manual deploy path can never satisfy going forward, similar in spirit
to the Build Plugin limitation above but triggered by the database
extension instead. Attempting to programmatically uninstall the `neon`
extension via the available tooling also failed
(`Failed to uninstall the extension... Failed to install extension: neon`
— note the tool itself reports "install" while attempting an uninstall,
suggesting a bug in that operation).

**Practical workaround used here**: sequence deploys so the database
extension is the *last* thing you ever add to a given site.

1. Get the app deploying cleanly and verified working *without*
   `@netlify/database` in `package.json`.
2. Make and verify every other code change you need (the login-redirect
   fix above was found *after* the database had already been added once,
   which is what forced standing up a third site).
3. Only then `npm install @netlify/database`, deploy once, and treat that
   site as done — don't plan on pushing further code changes to it
   through this deploy path. If you need to change anything afterward,
   the reliable path is: create a new site, repeat steps 1–2, seed fresh,
   then activate the database as the final step again.

If a "live" Netlify site ever stops accepting deploys with this exact
`exit code 2` / `required_functions` signature, this is almost certainly
why — check whether `@netlify/database` (or the Neon extension) was ever
activated on it, and stand up a fresh site rather than debugging further.

## Deploying again from scratch (if a new site is ever needed)

```bash
# 1. Clean known-stale artifacts that aren't excluded by the deploy
#    tool's own zip-ignore list (see bug #4 above)
rm -rf .next netlify/functions/next-server/standalone \
       src/generated/prisma prisma/dev.db prisma/dev.db-journal

# 2. Without @netlify/database in package.json, deploy and confirm
#    it's fully working — pages load, auth redirects go to the real
#    domain (see the curl snippet above), etc.

# 3. Set env vars on the new site (all required, none optional):
#    AUTH_SECRET   — any 32-byte base64 secret (openssl rand -base64 32)
#    AUTH_URL      — https://<the-site's-real-domain>
#    SEED_SECRET   — any random string, used as the x-seed-secret header

# 4. npm install @netlify/database, deploy one final time.

# 5. Seed the freshly provisioned database:
curl -X POST https://<site>/api/admin/seed \
  -H "x-seed-secret: <your SEED_SECRET value>"

# 6. Verify login end-to-end with the curl snippet in bug #7 above,
#    not just a status-code check.
```

Deploys themselves go through the `@netlify/mcp` CLI
(`npx -y @netlify/mcp@latest --site-id <id> --proxy-path "<token>"`),
where the proxy-path token comes from a Netlify MCP `deploy-site` call and
is single-use / short-lived — request a fresh one for every deploy
attempt, including retries.
