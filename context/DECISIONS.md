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
