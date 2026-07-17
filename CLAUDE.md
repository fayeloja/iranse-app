# CLAUDE.md — Iransé

Quick orientation for any AI agent (Claude Code or otherwise) working in this repo. This file is intentionally thin — the reasoning lives in `/context/`.

## Before anything else

Read, in order: `/context/PROJECT.md`, `/context/ARCHITECTURE.md`, `/context/STANDARDS.md`, `/context/DECISIONS.md`, `/context/STATE.md`. Full process for making changes is in `/context/WORKFLOWS.md`. Do not propose an architectural change without checking `DECISIONS.md` first — it may already be settled, or explicitly marked open.

## Repo structure

npm workspaces + Turborepo monorepo.

```
apps/
  web/        — user-facing PWA (React/Vite, FSD) — see apps/web/CONTEXT.md
  admin/      — admin dashboard
  api/        — single codebase, two entrypoints — see apps/api/CONTEXT.md
    src/
      server.ts    — HTTP entrypoint, mounts every modules/*.route.ts
      worker.ts     — queue entrypoint, registers BullMQ processors per WORKER_QUEUES
      modules/       — domain modules, each with route/controller/service/repository/validation:
                       career-profile, job-discovery (+ adapters/), matching,
                       application-materials, applications, identity, billing, admin
      infra/          — clients only, not domains: database, queue, rate-limiter,
                       embeddings, kyc-client, payments
packages/
  validation/  — canonical Zod schemas, the single source of truth,
                 consumed by apps/web, apps/admin, and apps/api's modules/*.validation.ts files
```

Full reasoning for this structure and its deployment topology (single image, separate services per entrypoint, `WORKER_QUEUES` env var) is in `/context/ARCHITECTURE.md`.

## Commands

Target convention — update this section with real scripts once `package.json` files exist:

- `npm install` — install all workspace dependencies
- `npm run dev` — `turbo run dev` (apps/api runs `server.ts` + `worker.ts` locally, alongside apps/web, apps/admin)
- `npm run build` — `turbo run build`
- `npm run test` — `turbo run test`
- `npm run lint` — `turbo run lint`
- `npm run db:migrate` — run Postgres migrations (`apps/api/src/infra/database`)

## Non-negotiables

Full list in `STANDARDS.md`; the three most likely to be violated by accident:

- No LLM content generation anywhere in the resume or cover letter path — selection only.
- A new job source is a new file in `apps/api/src/modules/job-discovery/adapters/` implementing `JobSourceAdapter`. Never add source-specific logic to the core ingestion pipeline.
- Rate limiting is always per-user-per-portal via `apps/api/src/infra/rate-limiter`. Never a global limiter.

## Workspace-specific context

- Frontend conventions: `apps/web/CONTEXT.md`
- Backend conventions: `apps/api/CONTEXT.md`
