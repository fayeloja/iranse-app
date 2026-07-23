# STATE.md — Iransé
 
_Last updated: 23 July 2026_
 
## Phase
 
Phase 1A (MVP Completion) — COMPLETED. Phase 1B (Hardening & Operational Readiness) is next.
 
## Completed
 
- Product concept validated; full PRD drafted (`Iranse-PRD.md`) covering feature requirements, MVP phasing, risks, success metrics.
- System architecture designed: core pipeline, job ingestion with adapter pattern, matching engine scoring, resume assembly algorithm, cover letter assembly algorithm, application queue state machine — see ARCHITECTURE.md.
- Six-file `/context/` system set up and maintained.
- Module structure revised to domain-driven modular monolith (DECISIONS.md #10).
- Deployment topology decided: single codebase, two entrypoints, one image (DECISIONS.md #11, #12).
- Canonical validation source shifted to `packages/validation` (DECISIONS.md #13).
- Identity architecture expanded to 10-layer platform (DECISIONS.md #14).
- Free-tier cap scoped to all approved applications (DECISIONS.md #15). Enforced at 5 applications/month (`GET /api/v1/applications/quota`).
- Daily digest scoped to in-app at MVP (DECISIONS.md #16). `DigestScreen` (`/digest`) & `GET /api/v1/matching/digest` endpoint live.
- Onboarding minimum content set to soft nudge (DECISIONS.md #17).
- No job browsing/search UI at MVP (DECISIONS.md #18) — match review queue is sole job discovery surface.
- Cover letter assembly refactored to pure voice snippet selection — zero LLM generation, complying with "select, don't rewrite" principle.
- Real KYC vendor API (Prembly/IdentityPass) integrated in `infra/kyc-client`.

### Infrastructure & tooling
- Turborepo monorepo with npm workspaces (`apps/web`, `apps/api`, `apps/admin`, `packages/validation`).
- Docker Compose with pgvector/pgvector:pg15 + Redis 7-alpine (health checks, persistent volumes).
- `dependency-cruiser` configured in `apps/api` to enforce module boundaries.
- Zod-validated environment config (`apps/api/src/config/env.ts`).

### Backend (`apps/api`)
- **Identity module:** 14+ routes covering 8 of 10 planned layers — Argon2 auth, JWT + rotating refresh cookies, OTP verification, NIN KYC, session management, consent logging, connected accounts (AES-256-GCM), audit trail.
- **Career-profile module:** Full CRUD for experiences, achievements (with pgvector 1536-dim embeddings), skills, resume variants, voice snippets. CV upload with Gemini API extraction.
- **Job-discovery module:** `JobSourceAdapter` interface, Greenhouse (API) and Jobberman (Puppeteer scraper) adapters, URL-based dedup, auto-enqueue to matching queue.
- **Matching module:** 8 dimension scorers with weighted aggregation. Daily digest endpoint (`GET /api/v1/matching/digest`) calculating 24h stats, top matches, & alerts.
- **Application-materials module:** MMR achievement selector (λ=0.5) for resume assembly. Verbatim voice snippet selector for cover letters (no LLM generation).
- **Applications module:** Full state machine, rate-limited BullMQ worker, encrypted credential decryption, monthly application quota enforcement (`GET /api/v1/applications/quota`), retry backoff.
- **Worker entrypoint:** 3 BullMQ processors with `WORKER_QUEUES` env var specialization.
- **Server entrypoint:** Dynamic route auto-loader mounting at `/api/v1/{module}`, `/health` liveness probe.
- **All 7 infra packages implemented:** database (pool + 5 migrations), queue (3 BullMQ queues), rate-limiter, embeddings, encryption, kyc-client (Prembly + mock), payments, logger.
- **E2E integration test runner** (`e2e-integration.ts`) covering full pipeline — PASSED ✅.

### Frontend (`apps/web`)
- 8 screens: LoginScreen, HomeScreen (dynamic quota + digest stats), OnboardingModal, CareerProfileScreen, MatchReviewScreen, ApplicationsScreen, DigestScreen (`/digest`), PreferencesScreen.
- Feature-Sliced Design architecture, TanStack Query, memory-only access tokens, PWA config, shared UI component library.
- Dark glassmorphism design system matching concept UI mockups.

## Open items

1. **DeadLetter notification timing** — immediate alert vs. rolled into next digest.
2. **Self-report trigger window** — fixed number of days after submission, or portal-specific? (DECISIONS.md #8)

## Not started (expected)

- Phase 1B: Observability stack (Bull Board, Sentry, Prometheus/Grafana/Loki), automated unit/integration test coverage, identity layers 9 & 10, CI/CD pipeline.
- Phase 2: `billing` module, `admin` module, email notifications, career verification.
- Phase 3: Gated auto-submit, outcome-based learning.
