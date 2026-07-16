# Iransé — Product Requirements Document

**Working name:** Iransé (Yoruba: "messenger")
**Category:** AI-orchestrated career agent — job discovery, matching, tailored application materials, and (gated) auto-submission
**Status:** Draft v1 — for internal review
**Author:** Fatai Ayeloja

---

## 1. Overview

Iransé is a career agent that builds a permanent, structured record of a user's career (the **career knowledge base**), continuously discovers relevant job openings across multiple portals, scores each opening against the user's profile on multiple weighted dimensions, and assembles tailored resumes and cover letters **from the user's own previously written content** — never from AI-generated text. Where authorized, it queues and submits applications on the user's behalf, subject to strict rate limiting and a human-approval gate that is the default, not an afterthought.

Iransé is being validated as a standalone product, independent of Ranmi Suite and YandaCentral.

## 2. Problem Statement

Job seekers spend excessive time browsing portals, tailoring CVs by hand, and manually submitting applications — and still miss relevant roles due to time constraints or lack of visibility. Existing "auto-apply" tools solve the speed problem by generating AI-rewritten resumes at volume, which recruiters increasingly recognize and discount. There's a gap for a tool that automates discovery and assembly while keeping every word in the user's own voice.

## 3. Goals & Non-Goals

| Goal | Non-goal |
|---|---|
| Automate job discovery across portals | Being the fastest / highest-volume auto-applier |
| Score jobs against the user's real profile, explainably | Black-box or single-number matching |
| Assemble resumes and letters from the user's own content | Generating new resume language or achievements with an LLM |
| Apply automatically where authorized and safe | Bypassing platform rate limits, CAPTCHAs, or ToS at any cost |
| Build a durable, reusable career asset (the knowledge base) | Treating the CV as a disposable, single-use file |

## 4. Core Product Principle: Select, Don't Rewrite

This is the product's central bet and its main differentiation from existing auto-apply tools. Iransé's AI components (matching engine, resume assembler, cover letter assembler) act as an **orchestrator**, not an author:

- Resumes are assembled by selecting and ordering the user's own pre-written achievement bullets — never rewritten.
- Cover letters are assembled from the user's own pre-written, role-tagged paragraphs — never generated or smoothed.
- The only generative/ML component in the core pipeline is similarity scoring (embeddings) used for *ranking and retrieval*, not content creation.

Every feature below is designed to preserve this principle. Where a feature would require generating new user-facing text, it is treated as a non-goal.

## 5. Target Users

- **Primary:** Job seekers — graduates, professionals, career switchers, migration/visa seekers
- **Secondary:** Career coaches, recruitment agencies (future)
- **Admin:** Platform operators / support staff

## 6. System Architecture

### 6.1 Core pipeline

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

Matching (read-only, low risk) is deliberately decoupled from application execution (stateful, high risk: rate limits, ToS exposure, CAPTCHAs). This lets the product ship with matching + manual review before any auto-submit capability is unlocked.

### 6.2 Job ingestion detail

```
Scheduler (per-source fetch cadence)
        │
        ▼
Source Adapter (pluggable per portal)
        │
        ▼
Rate Limiter (Redis composite key, reused from Ranmi's pattern)
        │
        ▼
Normalizer (maps to common job schema)
        │
        ▼
Dedup Engine (fingerprint match across sources)
        │
        ▼
Job Store (Postgres)
```

Each job portal implements a shared adapter interface:

```ts
interface JobSourceAdapter {
  sourceId: string;
  fetchListings(cursor?: string): Promise<RawListing[]>;
  parseListing(raw: RawListing): NormalizedJob;
  rateLimitConfig: { requestsPerWindow: number; windowMs: number };
  authStrategy: 'none' | 'session_cookie' | 'official_api';
}
```

Official APIs (Indeed, ATS platforms like Greenhouse/Lever where available) are preferred over scraping; scraping is the fallback for sources with no API (most Nigerian job boards). Each source's legal/ToS posture should be recorded per-source as an explicit decision, not assumed.

### 6.3 Resume assembly pipeline

```
Parse Job Requirements → Candidate Retrieval (tag + embedding search)
  → Relevance Scoring → Variant Constraint Filter
  → Diversity + Recency Ranking → Length Cap + Ordering
  → Ordered Achievement ID List → Template Renderer
```

Relevance score per achievement:

```
score(achievement, job) =
  0.5 × tag_overlap(achievement.skills, job.required_skills) +
  0.3 × embedding_similarity(achievement.description, job.description) +
  0.2 × recency_weight(achievement.experience.end_date)
```

Diversity is enforced with a max-marginal-relevance style re-ranking (discount candidates similar to what's already selected) so the output isn't five bullets proving the same skill.

### 6.4 Cover letter assembly pipeline

```
Parse Job Requirements (reused) → Snippet Pool by Role (opening / body / closing)
  → Score Body Paragraphs → Select Opening + Closing (tone match)
  → Diversity-Aware Selection (1–2 body paragraphs) → Concatenate, Fixed Structure
```

No LLM smoothing or transition generation between selected pieces — preserves voice authenticity at the cost of visible seams, which the human-review step is expected to catch.

### 6.5 Application queue state machine

```
Matched → PendingApproval (human-in-loop tier) or Queued (auto-submit tier)
PendingApproval → Queued (approved) | Rejected | Expired (listing closes)
Queued → RateLimited → Queued (window opens)
Queued → Submitting → Submitted | Failed
Failed → Retrying → Queued | DeadLetter (max retries)
```

Throttling: per-user-per-portal Redis key, jittered delays (5–15s, never fixed), hard daily cap per portal independent of plan tier. Circuit breaker trips on repeated 403s/CAPTCHAs per source.

## 7. Feature Requirements

### 7.1 Career Knowledge Base
- Users build a structured, permanent record: experiences, achievements (quantified, theme-tagged), skills (normalized taxonomy), resume variants (named bundles referencing achievement IDs), voice snippets (role-tagged: opening/body/closing).
- CV upload with auto-extraction seeds the knowledge base; manual entry supplements/corrects it.
- Achievements are reusable across multiple resume variants without duplication.

### 7.2 Job Discovery & Ingestion
- Scrape/aggregate from multiple portals via pluggable source adapters (see 6.2).
- Prefer official APIs where available.
- Per-source rate limiting, circuit breaking, and legal/ToS review.
- Daily/hourly scheduled ingestion, cadence configurable per source.
- Dedup across sources via fingerprint matching.

### 7.3 Matching Engine
- Multi-dimensional scoring: skills, experience, industry, education, location, salary, visa eligibility, culture fit (low weight, structured signals only — no generated judgment).
- Transparent weighted-sum aggregation; weights configurable per user.
- Auto-apply eligibility threshold (default ~70%, user-adjustable).

### 7.4 Resume Assembly
- Assembles tailored resume per job from the user's own achievement library (see 6.3).
- Never generates new resume language.

### 7.5 Cover Letter Assembly
- Assembles tailored letter from the user's own voice snippets (see 6.4).
- Onboarding must actively prompt for 2–3 variants per structural role to avoid a cold-start pool with no real selection to make.

### 7.6 Application Queue & Auto-Apply
- MVP default: **human-in-loop** — every match is queued for one-tap user approval before submission.
- Auto-submit is a gated, opt-in, premium capability layered on later without architectural change (see 6.5).
- Rate limiting and daily caps apply regardless of plan tier.

### 7.7 Identity Verification (NIN)
- NIN verification via a licensed Nigerian KYC aggregator (e.g. VerifyMe, Youverify, Prembly) — direct NIMC integration is not available to arbitrary companies and needs a short technical/legal spike before committing to a vendor.
- Full name, date of birth captured alongside NIN for cross-check.

### 7.8 Subscription & Payments
- Free tier: limited automated applications/month (proposed: 5).
- Premium tier: unlimited applications, tailored cover letters, priority dashboard.
- Payment via Paystack (cards, bank transfer, wallet).

### 7.9 Admin Dashboard
- User management (view, verify, block/unblock).
- Subscription/billing control.
- Job feed monitoring (per-source ingestion health, circuit breaker status).
- Analytics: active users, applications sent, match accuracy, conversion rate.

## 8. Data Model Summary

Core entities: `users`, `experiences`, `achievements`, `skills` (with `achievement_skills` many-to-many join), `resume_variants` + `variant_items` (thin reference join, no duplicated content), `voice_snippets` (tagged by structural role and theme).

Known tech debt to track, not solve at MVP: `theme_tags` as free text will drift and should eventually move to a normalized `tags` table with a join.

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Handle scheduled scraping and queued applications at scale without breaching per-portal rate limits |
| Security | Encrypt user data; strict handling of NIN and CV contents |
| Compliance | NDPR (Nigeria) and general data protection practice |
| Scalability | Adapter pattern allows new job sources without core pipeline changes |
| Reliability | Circuit breakers per source; dead-letter handling for terminal application failures |

## 10. MVP Scope & Phasing

**Phase 1 (MVP):**
- Career knowledge base (manual entry + CV upload extraction)
- Job ingestion from 2–3 initial sources (mix of official API + scraping)
- Matching engine with core dimensions (skills, experience, location; defer culture fit)
- Resume assembly
- Application queue in **human-in-loop mode only** — no auto-submit
- Free tier only, NIN verification optional

**Phase 2:**
- Cover letter assembly
- Additional job sources
- Premium tier + Paystack integration
- Admin dashboard

**Phase 3:**
- Gated auto-submit tier, opt-in, with its own rate-limit ceiling
- Additional matching dimensions (visa eligibility, salary, culture fit)
- Outcome-based learning (interview/rejection feedback loop)

## 11. Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Decouple matching from application execution | Different risk profiles; ship the safe half first |
| Human-in-loop is the default, auto-submit is opt-in premium | De-risks legal/reputational exposure during launch |
| Resume/letter assembly is selection-only, no LLM rewriting | Core differentiation vs. existing "AI slop" auto-apply tools |
| Adapter pattern per job source | Portals change frequently; isolate blast radius to one file per source |
| Per-user-per-portal rate limiting, not global | Portals throttle per session; shared reputation risk across all users |
| NIN verification via licensed KYC aggregator, not direct NIMC | Direct NIMC access isn't available to arbitrary companies |

## 12. Success Metrics (KPIs)

- Job match accuracy (%)
- Average applications sent per user
- Free-to-premium conversion rate
- Interview callback rate per application submitted
- Monthly active users
- % of queue items in `RateLimited` or `DeadLetter` (operational health, not just growth)

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Scraping blocked / ToS violation | Prefer official APIs; per-source legal review; conservative rate limits |
| Auto-submit causes account bans on user's behalf | Human-in-loop default; gated, capped auto-submit only later |
| Thin voice-snippet pool produces repetitive letters | Onboarding actively prompts for multiple variants per structural role |
| NIN/identity data exposure | Licensed KYC aggregator, encryption, minimal retention |
| Portal anti-bot detection | Jittered delays, circuit breakers, per-portal daily caps |

## 14. Future Enhancements

- Outcome-based learning: adjust matching weights based on real interview/rejection data
- Multi-dimension score expansion (visa eligibility, culture fit refinement)
- ATS integration for direct submission where supported
- Career coach / agency-facing view of the knowledge base
