# STATE.md — Iransé
 
_Last updated: 23 July 2026_
 
## Phase
 
Phase 1B (Hardening & Operational Readiness) — COMPLETED. Phase 2 (Premium & Admin) is next.
 
## Completed
 
- Product concept validated; full PRD drafted (`Iranse-PRD.md`) covering feature requirements, MVP phasing, risks, success metrics.
- System architecture designed: core pipeline, job ingestion with adapter pattern, matching engine scoring, resume assembly algorithm, cover letter assembly algorithm, application queue state machine — see ARCHITECTURE.md.
- Six-file `/context/` system set up and maintained.
- Module structure revised to domain-driven modular monolith (DECISIONS.md #10).
- Deployment topology decided: single codebase, two entrypoints, one image (DECISIONS.md #11, #12).
- Canonical validation source shifted to `packages/validation` (DECISIONS.md #13).
- Identity architecture expanded to 10-layer platform (DECISIONS.md #14).
- User credential storage (`connected_accounts`) removed completely to align with backend adapter model (DECISIONS.md #19).
- Free-tier cap scoped to all approved applications (DECISIONS.md #15). Enforced at 5 applications/month (`GET /api/v1/applications/quota`).
- Daily digest scoped to in-app at MVP (DECISIONS.md #16). `DigestScreen` (`/digest`) & `GET /api/v1/matching/digest` live.
- Onboarding minimum content set to soft nudge (DECISIONS.md #17).
- No job browsing/search UI at MVP (DECISIONS.md #18) — match review queue is sole job discovery surface.
- Cover letter assembly refactored to pure voice snippet selection — zero LLM generation ("select, don't rewrite").
- Real KYC vendor API (Prembly/IdentityPass) integrated in `infra/kyc-client`.
- Observability stack implemented: Bull Board UI (`/admin/queues`), Sentry error tracking, Prometheus metrics (`/metrics`), Pino structured JSON logs.
- Unit test suite implemented (`npm run test` in `apps/api`) covering scorers & MMR selector — 6/6 tests passing.
- Identity Layer 9 (Risk Engine IP anomaly logging) & Layer 10 (Career Profile Snapshots `profile_snapshots` table & auto-snapshot creation) active.
- CI/CD GitHub Actions workflow (`.github/workflows/ci.yml`) and production multi-stage Dockerfile (`apps/api/Dockerfile`) configured.

### Infrastructure & tooling
- Turborepo monorepo with npm workspaces (`apps/web`, `apps/api`, `apps/admin`, `packages/validation`).
- Docker Compose with pgvector/pgvector:pg15 + Redis 7-alpine (health checks, persistent volumes).
- `dependency-cruiser` configured in `apps/api` to enforce module boundaries.
- Zod-validated environment config (`apps/api/src/config/env.ts`).
- GitHub Actions CI workflow for test, lint, typecheck, DB migration & Docker build.

### Backend (`apps/api`)
- **Identity module:** 11+ routes covering platform layers — Argon2 auth, JWT + rotating refresh cookies, OTP verification, NIN KYC, session management, consent logging, audit trail, Layer 9 Risk Engine, Layer 10 Profile Snapshots. (Credential storage removed per DECISIONS.md #19).
- **Career-profile module:** Full CRUD for experiences, achievements (with pgvector 1536-dim embeddings), skills, resume variants, voice snippets. CV upload with Gemini API extraction.
- **Job-discovery module:** `JobSourceAdapter` interface, Greenhouse (API) and Jobberman (Puppeteer scraper) adapters, URL-based dedup, auto-enqueue to matching queue.
- **Matching module:** 8 dimension scorers with weighted aggregation. Daily digest endpoint (`GET /api/v1/matching/digest`).
- **Application-materials module:** MMR achievement selector (λ=0.5) for resume assembly. Verbatim voice snippet selector for cover letters.
- **Applications module:** Full state machine, rate-limited BullMQ worker, monthly application quota enforcement (`GET /api/v1/applications/quota`), profile snapshots creation, retry backoff.
- **Worker entrypoint:** 3 BullMQ processors with Sentry error tracking & Prometheus submission metrics.
- **Server entrypoint:** Dynamic route auto-loader, `/health` probe, `/metrics` Prometheus endpoint, `/admin/queues` Bull Board dashboard.
- **All 7 infra packages implemented:** database (6 migrations), queue, rate-limiter, embeddings, encryption, kyc-client (Prembly + mock), payments, logger.
- **E2E integration test runner** (`e2e-integration.ts`) covering full pipeline — PASSED ✅.

### Frontend (`apps/web`)
- 8 screens: LoginScreen, HomeScreen (dynamic quota + digest stats), OnboardingModal, CareerProfileScreen, MatchReviewScreen, ApplicationsScreen, DigestScreen (`/digest`), PreferencesScreen.
- Feature-Sliced Design architecture, TanStack Query, memory-only access tokens, PWA config, shared UI component library.
- Dark glassmorphism design system matching concept UI mockups.

## Open items

1. **DeadLetter notification timing** — immediate alert vs. rolled into next digest.
2. **Self-report trigger window** — fixed number of days after submission, or portal-specific? (DECISIONS.md #8)

## Not started (expected)

- Phase 2: `billing` module (Paystack subscriptions), `admin` module & dashboard (`apps/admin`), email notifications, career verification.
- Phase 3: Gated auto-submit, outcome-based learning.
