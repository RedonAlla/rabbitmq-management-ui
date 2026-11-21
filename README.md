# RabbitMQ Management

A redesigned RabbitMQ management console built with React, TypeScript and ReUI.
It talks to the RabbitMQ Management HTTP API, so it can run against a real broker or entirely in the browser using a bundled mock.

## Features

- **Overview** – cluster KPIs, message rates, node health, listeners, ports, web contexts and history charts.
- **Queues** – list, create, purge, delete, publish, fetch messages, inspect consumers and bindings, depth/rate/storage charts.
- **Exchanges** – list, create, delete, bindings, arguments and a routing-key preview.
- **Connections and channels** – live lists, detail panels and channel close.
- **Users and permissions** – create/edit users, per-vhost configure/write/read permissions, topic permissions and per-user limits.
- **Virtual hosts** – create/delete, cluster-state view, permissions and message-count charts.
- **Policies** – vhost and operator policies with the full RabbitMQ definition catalog.
- **Cluster** – node details, feature flags, deprecated features and cluster rename.
- **Definitions** – import/export of the cluster snapshot.
- Auto refresh (5/15/30 s), command palette, light/dark theme and responsive layout.

## Tech stack

React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui + ReUI, TanStack Table/Virtual, Recharts, Shiki, next-themes, sonner.
Routing is a small hash-based router in `src/lib/router.tsx`; there is no server component.

## Requirements

- Node.js 20.19+ (Vite 8)
- RabbitMQ with the `rabbitmq_management` plugin enabled, for live mode

## Getting started

```bash
git clone https://github.com/RedonAlla/RabbitMQ.git
cd RabbitMQ
npm install
```

### Live mode (real broker)

```bash
rabbitmq-plugins enable rabbitmq_management
npm run dev
```

Open http://localhost:5173 and sign in with your broker credentials.
In dev, Vite proxies `/api` to `http://localhost:15672` (see `RABBITMQ_TARGET` in `vite.config.ts`); change the target if your broker runs elsewhere.

### Demo mode (no broker)

```bash
npm run demo
```

Demo mode bundles the mock broker (`src/lib/mock-backend.ts`) and serves `/api` requests from it in the browser. Sign in with `admin` / `admin` or `guest` / `guest`.

### Standalone mock API

```bash
npm run mock                                   # listens on http://localhost:15673
VITE_API_BASE_URL=http://localhost:15673 npm run dev
```

The mock server enables CORS, so the app can call it cross-origin.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | empty | Base URL of the RabbitMQ Management API, without the trailing `/api`. Leave empty when the console is served from the same origin as the broker (dev proxy or reverse proxy). When pointing directly at the broker, the target must allow cross-origin requests. |

Mode-specific env files are checked in: `.env.demo` and `.env.production`. Use `.env.local` for machine-specific overrides.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server against a real broker (`/api` proxied to `:15672`) |
| `npm run demo` | Dev server with the in-browser mock backend |
| `npm run mock` | Standalone mock management API on port `15673` |
| `npm run build` | Production build (`tsc -b` + `vite build --mode production`) |
| `npm run build-demo` | Self-contained demo build with the mock backend |
| `npm run preview` | Preview the production build (proxy included) |
| `npm run typecheck` | TypeScript project check (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write over `ts`/`tsx` files |

> **Note:** `npm run lint` currently fails because `typescript-eslint` does not support the installed TypeScript 7 yet. `npm run typecheck` still validates the project.

## Project structure

```
src/
  views/                 Route screens (overview, queues, exchanges, ...)
  components/
    features/<domain>/   Per-page panels, tables, dialogs and drawers
    layout/              App shell, header, navigation
    reui/                ReUI components (data grid, filters, code block)
    ui/                  shadcn/ui primitives
  hooks/                 Per-resource data fetching (use-queues, use-users, ...)
  store/                 Auth session and cluster snapshot/polling
  lib/                   API client, RabbitMQ API mapping, formatting, router
  data/types.ts          Domain types
mock/                    Broker mock: fixture data, handler, Node server
```

## How it works

- **Authentication** – credentials are sent as HTTP Basic auth to `GET /api/whoami`. The `btoa(username:password)` token and user tags are stored in `localStorage` under `rmq-session`.
- **Data** – `ClusterProvider` fetches the cluster snapshot in parallel from the management API, polls it on the selected interval, and derives rate/age charts from cumulative samples.
- **Mutations** – actions in `src/store/cluster.tsx` call the matching RabbitMQ endpoint (create queue, delete exchange, update policy, ...) and then trigger a snapshot refresh.
- **Mock** – `mock/handler.mjs` is a transport-agnostic implementation of the management API used by both `npm run mock` and the demo build.

## Deployment

`npm run build` emits a static bundle in `dist/`. Serve it from the same origin as the broker (for example behind a reverse proxy that forwards `/api`), or set `VITE_API_BASE_URL` to a CORS-enabled API endpoint. `npm run build-demo` produces a standalone demo that needs no broker at all.

## UI conventions

The project follows the ReUI design system on top of shadcn/ui. Component aliases and the ReUI registry live in `components.json`; the design rules every UI change must follow are in `AGENTS.md`.
