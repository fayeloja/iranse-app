# DECISIONS.md — Iransé

Architecture Decision Records, numbered. Append new decisions; do not edit or delete past ones — if a decision is reversed, add a new entry that supersedes it and note the supersession in both.

---

### 1. Decouple matching from application execution
**Context:** Matching is read-only and low-risk. Application execution carries rate-limit, ToS, and CAPTCHA exposure.
**Decision:** Keep these as separate services/deployables.
**Consequence:** Can ship matching + manual review before any auto-submit capability exists, without re-architecting later.

### 2. Human-in-loop is the default; auto-submit is gated, opt-in premium
**Context:** True unattended auto-submit is the highest legal/reputational risk feature in the product.
**Decision:** MVP ships with review-and-approve only. Auto-submit unlocks later as an explicit, capped, premium opt-in.
**Consequence:** De-risks launch. Reflected directly in the preferences UI (auto-submit shown locked/dimmed with a Premium badge).

### 3. Resume and cover letter assembly is selection-only, never generative rewriting
**Context:** This is the core product differentiator vs. existing "AI slop" auto-apply tools.
**Decision:** All resume/letter output is assembled from the user's own pre-written achievements and voice snippets. No LLM generates or rewrites user-facing content in this path.
**Consequence:** Visible seams in cover letters (no generated transitions) are an accepted tradeoff for authenticity. See STANDARDS.md rule 1.

### 4. Adapter pattern per job source
**Context:** Portals change frequently (DOM changes, anti-bot measures, API deprecations).
**Decision:** Every job source is an isolated adapter implementing a shared interface; no source-specific logic leaks into the core pipeline.
**Consequence:** A broken/blocked source can be patched or disabled without affecting others.

### 5. Per-user-per-portal rate limiting, not global
**Context:** Portals throttle per session/account; a shared global limiter would misattribute risk.
**Decision:** Rate limiter keys are `{userId}:{portal}:{action}`, reusing the composite-key Redis pattern built for Ranmi.
**Consequence:** Daily caps apply per user per portal regardless of plan tier — "unlimited" premium still respects per-portal ceilings.

### 6. NIN verification via a licensed KYC aggregator, not direct NIMC integration
**Context:** Direct NIMC API access isn't available to arbitrary companies.
**Decision:** Integrate through a licensed aggregator (candidates: VerifyMe, Youverify, Prembly — vendor selection pending, see STATE.md).
**Consequence:** Adds a vendor dependency and cost; avoids an integration path that isn't actually available.

### 7. Application queue states must reflect ground truth, never optimism
**Context:** A user tapping "approve" should not see "Submitted" before the submission is confirmed.
**Decision:** Distinct states (`Queued`, `RateLimited`, `Submitting`, `Submitted`, `Failed`) are all user-visible as needed; UI copy uses honest framing ("Sending soon") for pre-confirmation states.
**Consequence:** Slightly more complex UI states, but preserves trust — the whole product's credibility rests on users believing what the dashboard tells them.

### 8. Outcome tracking (interviews, callbacks) relies on user self-report, not passive detection
**Context:** Most job portals don't expose recruiter views or interview-stage data to applicants via API or scraping.
**Decision:** "Interview callback rate" and similar KPIs are powered by an explicit self-report prompt ("Any update? Tell us"), not automated detection.
**Consequence:** KPI accuracy depends on user engagement with self-reporting; the prompt's trigger timing (fixed delay vs. portal-specific) is still an open question — see STATE.md.

### 9. Free tier application cap scope — OPEN, not yet decided
**Context:** Unclear whether the free tier's application cap (proposed: 5/month) applies to every user-approved application, or only to auto-submitted ones.
**Status:** Not yet decided. Affects onboarding/pricing copy and the preferences screen. Track resolution here when decided.

### 10. Domain-driven modular monolith, not package-per-capability
**Context:** An earlier draft of ARCHITECTURE.md split business logic into standalone top-level `packages/*` (matching-engine, resume-assembly, job-adapters, etc.) with no route/controller/validation of their own — a layer-first split, not domain-first. This didn't match the preferred working style of colocating a domain's route, controller, service, repository, and validation together for easy context and troubleshooting.
**Decision:** Business logic is organized as domain modules (`career-profile`, `job-discovery`, `matching`, `application-materials`, `applications`, `identity`, `billing`, `admin`), each a folder with its own `{module}.route/controller/service/repository/validation.ts`. Only genuine infrastructure clients (database, queue, rate-limiter, embeddings, kyc-client, payments) remain as separate `infra/` packages, since they're plumbing, not domains.
**Consequence:** Supersedes the package-per-capability structure implied earlier in ARCHITECTURE.md. Job source adapters move from a standalone `packages/job-adapters` into `job-discovery/adapters/`, since they're domain-specific, not generic infrastructure.

### 11. One codebase, two entrypoints, deployed as separate services from one image
**Context:** Needed a way to run both an HTTP API and BullMQ queue processors without duplicating domain logic or risking version drift between them.
**Decision:** Single codebase with `src/server.ts` and `src/worker.ts` as the only two entrypoints, both importing directly from `modules/*.service.ts`. Built once as a single container image; different `CMD` per deployable at the infrastructure level.
**Consequence:** API and workers always run the identical version of every domain module. Independent scaling is achieved at the deployment layer (separate services/deployments from the same image), not by splitting the codebase.

### 12. Worker specialization via env var, not a code fork
**Context:** `job-discovery` (high-volume, bursty) and `applications` (rate-limit-bound, low-concurrency) have very different scaling needs, but both run inside `worker.ts`.
**Decision:** A `WORKER_QUEUES` environment variable determines which BullMQ processors a given worker instance registers, allowing the same `worker.ts` to be deployed as multiple differently-scaled services.
**Consequence:** No maintenance burden of multiple worker entrypoints; scaling policy differences are handled entirely at the infrastructure/deployment layer.

### 13. `packages/validation` is the canonical source of truth, not `apps/api`'s modules
**Context:** Earlier drafts described `{module}.validation.ts` inside `apps/api` as the source of truth, with `packages/validation` "re-exporting" from it. That means a package would depend on an app — backwards from how npm workspaces / Turborepo expect the dependency graph to flow (apps depend on packages, never the reverse), and it makes `packages/validation` impossible to build or type-check independently.
**Decision:** `packages/validation` holds the canonical Zod schemas. Each `{module}.validation.ts` in `apps/api` imports and re-exports (or extends) from `packages/validation`, not the other way around.
**Consequence:** Corrects the dependency direction to match standard monorepo conventions. `apps/web`, `apps/admin`, and every `apps/api` module now validate against the exact same schema, sourced from one place with no risk of a build-graph cycle.

### 14. Evolve Authentication to a comprehensive Identity, Trust, and Consent Platform
**Context:** Iransé acts as an agentic proxy submitting applications on behalf of users, presenting legal, privacy, and abuse risks. Simple authentication does not address authorization, compliance audits, or session security.
**Decision:** Design the `identity` module to cover 10 layers:
1. *Authentication*: Argon2id password hashing, access token (in-memory) + rotating refresh token (secure HttpOnly cookie).
2. *Identity Verification*: Track verification states (`anonymous` -> `registered` -> `email_verified` -> `phone_verified` -> `nin_verified` -> `career_verified`).
3. *Career Verification*: Badging for verified LinkedIn, employment, and education.
4. *Authorization*: Role-Based Access Control (RBAC) middleware checking granular permissions (e.g. `applications:submit`).
5. *Sessions*: A database table (`user_sessions`) storing token hashes and device metadata to allow viewing/revoking active sessions.
6. *Consent*: Logging legal auto-apply waivers (IP, timestamp, waiver version, location).
7. *Connected Accounts*: Encrypted storage (AES-256-GCM) of user job portal credentials/cookies in a `connected_accounts` table.
8. *Audit Trail*: Storing an immutable log of agent actions (e.g. "Resume variant generated").
9. *Risk Engine*: Spotting anomalous GeoIP travel to trigger step-up verification.
10. *Career Profile Versioning*: Saving snapshot JSON profiles with each application to preserve history.
**Consequence:** The `identity` module is structured into sub-folders matching these layers. Requires migration tables for consents, sessions, credentials, snapshots, and audit logs. Adds cryptographic encryption utility in `infra/encryption`.

### 15. Free-tier application cap applies to all user-approved applications, not only auto-submitted
**Context:** Open question #9 asked whether the proposed 5-applications/month free-tier limit applies to every approved application or only auto-submitted ones. Auto-submit doesn't exist yet (Phase 3), so a cap scoped only to auto-submit would be effectively no cap at MVP.
**Decision:** The cap applies to all applications the user approves in a given calendar month, regardless of submission method.
**Consequence:** Simpler to enforce (one counter per user per month). Fairer mental model for users. Premium upgrade unlocks a higher (but still rate-limit-bound) ceiling. Supersedes the open status of #9.

### 16. Daily digest is an in-app surface at MVP; email deferred to Phase 2
**Context:** Open question from STATE.md asked whether the daily digest is primarily email, in-app, or both. Email requires transactional email infrastructure (Resend/SendGrid/Postmark) and template management that isn't justified before real users exist.
**Decision:** MVP ships with an in-app digest surface only (new matches, application status changes, failed applications). Email digest is a Phase 2 deliverable alongside the broader email notification system.
**Consequence:** No email infrastructure needed at MVP. The digest endpoint returns structured data; the email renderer is layered on later without changing the data source.

### 17. Onboarding enforces a soft nudge, not a hard block, for minimum career content
**Context:** Open question from STATE.md asked whether users with too few achievements or voice snippets should be soft-nudged or hard-blocked from completing onboarding.
**Decision:** Soft nudge. Users can complete onboarding with any amount of content. The UI shows clear warnings ("Your profile is thin — matches may be less accurate") and a profile completeness indicator, but never prevents progression.
**Consequence:** Lower friction at onboarding. Accepts the tradeoff that early matches for low-content profiles will be less useful, relying on the profile completeness indicator to motivate users to add more content over time.

### 18. No job browsing/search UI at MVP — match review is the sole job discovery surface
**Context:** The gap analysis identified that users can only see jobs that have been matched to them — there's no `/jobs` screen to browse or search the raw job store. The question was whether to build one for MVP.
**Decision:** Deliberately skip it. The match review queue is the only job discovery surface at MVP.
**Rationale:**
1. *Cuts against the core principle.* Iransé's pitch is that the user doesn't manually browse and evaluate listings — the agent does the discovery and scoring, and the user reviews curated matches. A browse-and-filter screen reintroduces the manual-search behavior the product exists to eliminate.
2. *Doesn't serve either persona at MVP.* A free-tier user has a 5-application cap and a match feed already filtered to their threshold — an unfiltered listing mostly surfaces jobs they can't act on. A premium user might want it eventually, but that's a stronger case after the core match-and-approve loop is validated with real users.
3. *Non-trivial hidden scope.* Implies a public paginated/filterable endpoint over the raw job store (`GET /api/v1/job-discovery/`), which currently only has admin/debug routes. That means query performance work, filter validation, and pagination design that doesn't exist anywhere in the current architecture.
4. *Original UI concepts confirm the intent.* All 6 concept mockups use a bottom nav of Home · Matches · Applications · Profile — no "Jobs" tab. The match review deck was always the designed discovery surface.
**Consequence:** No `/jobs` route, no `JobBrowseScreen`, no public job-discovery endpoint. Revisit in Phase 2/3 once there's real signal on whether users want to browse beyond their matches, rather than guessing now. If added later, it should be framed as a power-user/exploration feature, not the primary discovery path.
