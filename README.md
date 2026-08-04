# Huizemark Agent Ordering Hub

*Order. Approve. Track. Deliver.*

A full internal ordering management platform for Huizemark North Coast —
agents submit orders from a branded product catalogue, managers run them
through a structured multi-approver sign-off, and everyone tracks progress
through manufacturing, courier and delivery on an animated status timeline.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
Framer Motion, Prisma + SQLite, NextAuth v5, Recharts, React Hook Form and
Zod — all wired to real, persistent, role-scoped data. There is no mock
data rendered in the UI; every screen reads from and writes to the
database through API routes.

## Quick start

```bash
npm install                 # also runs `prisma generate` (postinstall)
npm run db:migrate           # create the SQLite database + tables
npm run db:seed              # load demo users, agents, catalogue, orders
npm run dev                  # http://localhost:3000
```

First load redirects to `/login`. Use one of the demo accounts below, or
click **"Use a demo account"** on the login screen to autofill one.

### Demo accounts

Every account uses the same password: **`Huizemark2026!`**

| Role | Email | Notes |
|---|---|---|
| Administrator | `admin@huizemark.co.za` | Full access |
| Mienke | `mienke@huizemark.co.za` | Approver |
| MJ | `mj@huizemark.co.za` | Approver |
| Nadia | `nadia@huizemark.co.za` | Approver |
| Chantal | `chantal@huizemark.co.za` | Approver |
| Agent (any of 12) | e.g. `sarah.merwe@huizemark.co.za` | Own-orders only |

The seed script prints the full agent list (`npm run db:seed`); all agent
emails follow `firstname.lastname@huizemark.co.za`.

### Resetting the database

```bash
npm run db:reset    # drops, recreates and reseeds from scratch
```

Prisma Studio (`npm run db:studio`) is handy for poking at the data directly.

## Environment variables

Copy `.env.example` to `.env` (already done in this checkout — `.env` is
gitignored so this only matters for a fresh clone):

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<openssl rand -base64 32>"
```

No other secrets are required to run the app locally — everything else
(auth, uploads, notifications) works out of the box.

## Project structure

```
prisma/
  schema.prisma        # 19-model schema (see "Data model" below)
  seed.ts               # demo users, catalogue, suppliers, 23 orders across every stage
  migrations/

src/
  auth.ts, auth.config.ts   # NextAuth v5 (Credentials provider, JWT sessions)
  proxy.ts                  # route-protection middleware (Next.js 16 renamed "middleware.ts" to "proxy.ts")

  lib/
    constants.ts        # every closed set of values (roles, statuses, urgency, etc.)
                         # SQLite has no native enum support in Prisma, so DB
                         # columns are plain strings validated against these unions
    prisma.ts            # Prisma client singleton
    api-helpers.ts        # requireSession/requireAdmin guards + audit logging
    notify.ts             # in-app notification creation
    order-number.ts        # sequential HM-YYYY-NNNN order numbers
    browser-store.ts        # useSyncExternalStore-backed localStorage/sessionStorage hook factory
    utils.ts                # cn(), formatCurrency/Date (deliberately not Intl-based — see below)

  components/
    ui/               # design-system primitives (Button, Card, Modal, Sheet, Badge, Input…)
    domain/            # feature components (order form pieces, approval progress,
                        # status timeline, product/supplier cards, report table…)
    shell/             # sidebar, topbar, mobile nav, notification bell, global search
    charts/             # Recharts wrappers (donut, trend, horizontal bar)
    providers/          # session, motion-reduction, order-draft-cart context providers
    intro/              # first-visit intro animation

  app/
    login/                     # public
    (app)/                     # everything below requires auth (see proxy.ts)
      dashboard/                # role-aware KPIs, charts, recent orders
      orders/new/                # multi-item order builder (also handles ?edit=<id>)
      orders/[id]/                # order detail: approvals, timeline, files, actions
      orders/mine/, orders/       # agent vs company-wide order lists
      approvals/                  # approval queue with inline review
      tracking/                   # focused order-tracking view
      products/                   # catalogue + admin CRUD
      agents/                     # agent activity overview
      suppliers/                  # supplier directory + CRUD
      analytics/, reports/         # charts + 10 exportable/printable reports
      notifications/               # notification centre + preferences
      admin/users/, admin/audit-log/
      settings/
    api/                         # ~35 route handlers backing all of the above
```

## Data model

19 Prisma models: `User`, `Branch`, `ProductCategory`, `Product`,
`Supplier`, `Order`, `OrderItem`, `OrderApproval`, `OrderStatusHistory`,
`OrderFile`, `Comment`, `Notification`, `AuditLog`, `SavedFilter`, plus
their relations. See `prisma/schema.prisma` for the full picture — it's
commented throughout.

Order status is a 21-step pipeline (Draft → … → Completed, with Declined
and Cancelled as terminal exceptions) tracked via `OrderStatusHistory`, and
each order carries up to four `OrderApproval` rows — one per named manager
— so the UI can show "2 of 4 approvals completed" and gate manufacturing
until every required approver has signed off.

## What's implemented

**Ordering & catalogue**
- Full product catalogue (29 categories, seeded products) with admin
  add/edit/deactivate for both products and categories
- Multi-item order builder: pick from the catalogue or add a custom line,
  per-item size/colour/material/finish/personalisation, live price
  estimate, draft autosave-on-submit, drag-and-drop file uploads
  (artwork/logo/documents/reference images)
- Editing: drafts and orders sent back for changes can be reopened and
  resubmitted from the same form

**Approvals**
- Order creator chooses which of Mienke/MJ/Nadia/Chantal must approve
- Animated per-approver cards + progress bar, approve/decline/request-changes
  with a required comment on the latter two
- An order cannot advance to "Ordered from Supplier" or beyond until every
  required approval is in — enforced server-side, not just in the UI

**Tracking & fulfilment**
- 21-step animated status timeline (completed steps checked off, current
  step pulsing, future steps dimmed) on both the order detail page and a
  dedicated `/tracking` view
- Supplier assignment, courier booking (tracking number + courier name),
  quick "mark received / mark delivered" actions, agent-side cancel before
  manufacturing starts

**Dashboards, analytics & reports**
- Role-aware dashboard (agents see their own orders; managers/admin see
  company-wide KPIs plus "orders awaiting your approval")
- Agent activity overview: sortable/searchable table, orders-by-agent and
  most-ordered-product charts, CSV export (deliberately framed as
  operational reporting, not a competitive leaderboard)
- Analytics: spend by category/supplier, order mix by urgency/delivery method
- Reports: 10 report types (monthly, by agent/category/supplier, approval
  and manufacturing turnaround, courier, outstanding, completed, budget vs
  actual) — each exportable as CSV and print/PDF-friendly

**Platform**
- Role-based auth (Agent / Mienke / MJ / Nadia / Chantal / Administrator)
  with server-enforced permissions on every API route, not just hidden nav
- Global search (⌘K) across orders, products, suppliers, agents
- In-app notification centre with a live unread-count bell, mark-as-read,
  and preference toggles; due-date and overdue notifications generate
  themselves automatically
- Full audit trail (who did what, when, before/after values) with an
  admin-facing viewer
- User management, branch management, supplier directory
- Reduce-motion accessibility setting wired into a global Framer Motion config
- Premium intro animation on first visit (skippable, remembered per session)
- Responsive down to a 375px mobile viewport (bottom nav + slide-out menu)

## Design system

Huizemark North Coast CI: Pantone 1505C orange (`#FF6B00`, derived from the
brand's CMYK 0/58/100/0 spec) as the sole accent colour against a white
background and deep-navy/cool-grey typography, Jost for display type
(a clean geometric sans in the spirit of Gill Sans) paired with Inter for
body copy, thin orange accent lines, soft shadows, and no burnt-orange,
gradients or dark backgrounds. See `src/app/globals.css` for the full
token set and `src/components/ui/` for the primitives built on it.

## A note on a real bug this build caught and fixed

`Intl.NumberFormat("en-ZA", …)` and `Intl.DateTimeFormat("en-ZA", …)` can
render differently on the server (depending on the Node.js binary's
compiled-in ICU locale data) than in the browser, which produces a React
hydration mismatch the moment the same value is formatted on both sides.
`src/lib/utils.ts` formats currency and dates by hand instead, so the
server-rendered HTML and the client's first render are always byte-identical.
This was caught by an automated Playwright smoke pass across every page and
role during development (console/page-error/5xx monitoring) — not visible
from a casual click-through — and is worth knowing about if you extend the
formatting helpers.

## Testing performed

- `npx tsc --noEmit` — clean
- `npm run lint` — clean except for a handful of advisories from Next 16's
  new (and not-enabled-here) React Compiler-readiness ESLint rules,
  flagging the standard "named async load() function called from
  useEffect" data-fetching pattern used throughout the app; these don't
  affect `next build`, runtime correctness, or React Compiler (which is
  off in this project)
- `npx next build` — succeeds, all ~50 routes compile
- Automated Playwright pass across all three roles × every nav destination
  (desktop 1440px and mobile 390px viewports), asserting zero console
  errors, zero page errors, and zero 5xx responses
- Manual end-to-end verification via the API: order creation → approval →
  status progression, including confirming the system rejects moving an
  order to "Ordered from Supplier" before all required approvals are in

## Integrations that still need real credentials

Everything in this build runs on local infrastructure (SQLite, local file
uploads under `public/uploads/`) so it works with zero external accounts.
For production use you'd want to connect:

- **Email notifications** — the notification system and its preferences
  UI are structured so an email channel (Resend, SendGrid, SES, etc.) can
  be added by calling out from `src/lib/notify.ts` alongside the existing
  in-app notification write; needs an API key + verified sending domain.
- **WhatsApp notifications** — same shape; needs WhatsApp Business API
  credentials (e.g. via Twilio or Meta directly). Supplier records already
  have a `whatsapp` field ready for this.
- **File storage** — uploads currently write to the local filesystem
  (`public/uploads/`), which is fine for this environment but not durable
  across deploys/containers. Swap `src/app/api/uploads/route.ts` for S3 /
  Cloudflare R2 / Vercel Blob for production.
- **Production database** — SQLite was chosen deliberately so the whole
  app runs with zero configuration. Prisma's schema is close to
  provider-agnostic; swapping to Postgres (e.g. via `create-db` or a
  managed Postgres) mainly means changing the `datasource` block and
  re-running migrations.
- **PDF export** — reports currently use the browser's native print dialog
  ("Print / PDF" saves via the OS print-to-PDF, which needs no
  credentials) rather than a server-rendered PDF library; swap in
  `@react-pdf/renderer` or a headless-Chrome render if a literal PDF
  download button is required.

## Known simplifications

- Order-number generation looks up the highest existing number for the
  current year and increments it; under true concurrent writes at scale
  you'd want a DB sequence, but SQLite + this app's traffic pattern makes
  a race here effectively impossible in practice.
- "Internal notes" vs "agent-visible notes" is implemented as a single
  `Comment` thread with an `internal` boolean (managers can mark a
  comment as internal-only), rather than two entirely separate systems.
