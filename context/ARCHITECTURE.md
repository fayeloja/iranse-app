# ARCHITECTURE.md — Iransé

## Core pipeline

```
Career Knowledge Base
        │
        ▼
Job Ingestion Workers (source adapters, rate-limited)
        │
        ▼
Job Store + Search Index
        │
        ▼
Matching Engine (multi-dimension scoring)
        │
        ▼
Resume + Cover Letter Assembly (selects, never rewrites)
        │
        ▼
Application Queue (throttled, human-in-loop toggle)
        │
        ▼
Tracking + Reporting Dashboard
```

Matching (read-only, low risk) is deliberately decoupled from application execution (stateful, high risk: rate limits, ToS exposure, CAPTCHAs). This is what lets the product ship with matching + manual review before any auto-submit capability is unlocked. See DECISIONS.md #1.

## Job ingestion

```
Scheduler (per-source fetch cadence)
   → Source Adapter (pluggable per portal)
   → Rate Limiter (Redis composite key: user + portal + action)
   → Normalizer (maps to common job schema)
   → Dedup Engine (fingerprint match across sources)
   → Job Store (Postgres)
```

Adapter interface every job source must implement:

```ts
interface JobSourceAdapter {
  sourceId: string;
  fetchListings(cursor?: string): Promise<RawListing[]>;
  parseListing(raw: RawListing): NormalizedJob;
  rateLimitConfig: { requestsPerWindow: number; windowMs: number };
  authStrategy: 'none' | 'session_cookie' | 'official_api';
}
```

Official APIs preferred over scraping where available. Each source's legal/ToS posture is an explicit, recorded decision — see DECISIONS.md.

## Matching engine

Weighted-sum aggregation across independently auditable dimensions:

```
overall = Σ(dimension_score × weight)
```

Dimensions: skills, experience, industry, education, location, salary, visa eligibility, culture fit (low weight — structured signals only, never a generated judgment). Weights are configurable per user. Auto-apply eligibility checks against a user-adjustable threshold (default ~70%).

## Resume assembly

```
Parse Job Requirements → Candidate Retrieval (tag + embedding search)
  → Relevance Scoring → Variant Constraint Filter
  → Diversity + Recency Ranking → Length Cap + Ordering
  → Ordered Achievement ID List → Template Renderer
```

```
score(achievement, job) =
  0.5 × tag_overlap(achievement.skills, job.required_skills) +
  0.3 × embedding_similarity(achievement.description, job.description) +
  0.2 × recency_weight(achievement.experience.end_date)
```

Diversity enforced via max-marginal-relevance style re-ranking. Output is an ID list only — the template renderer pulls the user's own raw text verbatim; no generation happens after this point.

## Cover letter assembly

```
Parse Job Requirements (reused) → Snippet Pool by Role (opening / body / closing)
  → Score Body Paragraphs → Select Opening + Closing (tone match)
  → Diversity-Aware Selection (1–2 body paragraphs) → Concatenate, Fixed Structure
```

No LLM smoothing or transition generation between selected pieces.

## Application queue state machine

```
Matched → PendingApproval (human-in-loop tier) or Queued (auto-submit tier)
PendingApproval → Queued (approved) | Rejected | Expired (listing closes)
Queued → RateLimited → Queued (window opens)
Queued → Submitting → Submitted | Failed
Failed → Retrying → Queued | DeadLetter (max retries)
```

Throttling: per-user-per-portal Redis key, jittered delays (5-15s, never fixed), hard daily cap per portal independent of plan tier. Circuit breaker trips on repeated 403s/CAPTCHAs per source.

## Data model (career knowledge base)

Core entities: `users`, `experiences`, `achievements` (quantified, theme-tagged), `skills` (normalized taxonomy, many-to-many with achievements via `achievement_skills`), `resume_variants` + `variant_items` (thin reference join, no duplicated content), `voice_snippets` (tagged by structural role: opening/body/closing, plus theme).

Known tech debt, tracked not solved at MVP: `theme_tags` as free text will drift and should eventually move to a normalized `tags` table with a join.

## Stack mapping

- Backend: Node.js, Express, PostgreSQL (raw `pg` client pool with custom transaction helpers), Redis (ioredis), BullMQ for queues/workers
- Migrations: `node-pg-migrate`
- Matching: pgvector for embedding similarity where semantic matching beats exact tag match
- Frontend: React/Vite PWA, Feature-Sliced Design
- Validation: `packages/validation` workspace package serves as the canonical source of truth for Zod schemas
- Identity: 10-layer platform (JWT access + rotating refresh cookies) with licensed Nigerian KYC aggregator sitting between Iransé and NIMC
- Payments: Paystack
- Rate limiting: reuses the CGNAT-aware composite-key Redis rate limiter pattern originally built for Ranmi Suite, re-keyed as `{userId}:{portal}:{action}` instead of by IP

## Module structure (domain-driven modular monolith)

Business logic is organized by domain, not by technical layer. Each domain module is a folder containing its own route, controller, service, repository, and validation files — the whole lifecycle of a capability lives in one place. Modules map closely onto the PRD's feature sections (7.1-7.9), which is a signal the boundaries came from the product itself.

```
src/
  modules/
    career-profile/          # experiences, achievements, skills, resume variants, voice snippets
    job-discovery/            # scheduler, source adapters (adapters/ subfolder), job store, dedup
    matching/                 # dimension scorers, weighted aggregation
    application-materials/    # resume + cover letter assembly
    applications/             # application queue state machine, submission, tracking, snapshots
    identity/                 # 10-layer Identity & Trust platform (auth, RBAC, sessions, consent, audit, risk)
    billing/                  # subscriptions, Paystack orchestration
    admin/                    # reads across other modules' repositories; no independent domain data of its own
  infra/                      # clients/adapters only — no route or controller, not domains
    database/
    queue/
    rate-limiter/
    embeddings/                # shared embedding-similarity, used by matching and application-materials
    encryption/                # AES-256-GCM symmetric encryption utility for job portal credentials
    kyc-client/
    payments/
```

Per-module file convention: `{module}.route.ts`, `{module}.controller.ts`, `{module}.service.ts`, `{module}.repository.ts`, `{module}.validation.ts`. Job source adapters (`job-discovery/adapters/*.adapter.ts`) live inside the `job-discovery` module rather than as a standalone package, since they're domain logic specific to discovery, not generic infrastructure.

Both entrypoints (see Deployment topology below) import directly from `modules/*.service.ts` — there is exactly one implementation of each domain's business logic regardless of whether it's triggered over HTTP or by a queue job.

## Deployment topology

One codebase, two entrypoints, built once as a single container image:

```
src/server.ts   → mounts all modules/*.route.ts, boots the Express app
src/worker.ts   → boots BullMQ processors that call modules/*.service.ts directly
```

Same image, different `CMD` per deployable — guarantees the API and workers always run the identical version of every domain module.

**Independent scaling despite one codebase:** `apps/api` and the worker scale on different signals (request rate/latency vs. queue depth), so they run as separate services/deployments from the same image, never as one process. The worker is further split by queue via an env var, not a code fork:

```ts
const queues = (process.env.WORKER_QUEUES ?? 'all').split(',');
```

This lets `job-discovery` (high-volume, bursty, autoscales freely) and `applications` (rate-limit-bound, low-concurrency by design) run as separate worker services with independent scaling policies, without maintaining two separate `worker.ts` files.

**Why horizontal scaling is safe:** the rate limiter's state lives centrally in Redis (`{userId}:{portal}:{action}`), not in-process — running 1 worker instance or 10 doesn't change the per-user-per-portal throttle ceiling. This is a direct consequence of the rate-limiting decision, not a separate mechanism.

**Operational requirements, not optional:**
- `server.ts` exposes a standard `/health` for load-balancer checks.
- `worker.ts` needs a liveness signal too (minimal `/health` or a Redis heartbeat) — a stuck worker with no signal is invisible until `DeadLetter` counts spike.
- Graceful shutdown on `SIGTERM`: workers must stop pulling new jobs but finish in-flight ones (`worker.close()` in BullMQ) before exiting, to avoid double-submitting an application mid-shutdown.

**Phased infrastructure:**

| Phase | Setup |
|---|---|
| MVP / early validation | Single small instance, PM2 managing `server.js` + 1-2 `worker.js` processes |
| Real load | ECS Fargate: 1 api service (autoscale on request metrics) + 2 worker services split by `WORKER_QUEUES` (ingestion autoscales on queue depth; applications stays low-concurrency, capped) |
| Team/scale grows | Kubernetes + KEDA for queue-depth-based autoscaling — not worth the operational overhead before there's real justification, even though it aligns with KCNA study |

---

### Observability stack (open source, zero additional cost)
All services run as Docker containers alongside the app at MVP scale.

| Pillar | Tool | Purpose |
|--------|------|---------|
| Logs | Pino → Grafana Loki | Structured JSON logs, searchable |
| Metrics | prom-client → Prometheus → Grafana | Request rates, queue depth, latency |
| Errors | Sentry | Unhandled exceptions, error grouping |
| Queues | Bull Board | BullMQ job status and failure inspection |
| DB | pg_stat_statements | Slow query detection |

Operational alerts (Prometheus rules — Sentry does not cover these):
- Job ingestion queue depth >100 for >10 minutes
- Application worker idle >10 minutes with queued items pending
- Rate-limited applications >50% of total submissions in the last hour
- DeadLetter count increased (any new dead-lettered application)
- Database connection pool >80% utilised

---
