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

- Backend: Node.js, Express, PostgreSQL, Redis (ioredis), BullMQ for queues/workers
- Matching: pgvector for embedding similarity where semantic matching beats exact tag match
- Frontend: React/Vite PWA, Feature-Sliced Design
- Identity: licensed Nigerian KYC aggregator (vendor TBD — see STATE.md) sitting between Iransé and NIMC
- Payments: Paystack
- Rate limiting: reuses the CGNAT-aware composite-key Redis rate limiter pattern originally built for Ranmi Suite, re-keyed as `{userId}:{portal}:{action}` instead of by IP
