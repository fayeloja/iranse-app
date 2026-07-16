# STATE.md — Iransé

_Last updated: 16 July 2026_

## Phase

Concept validation and system design. No code written yet.

## Completed

- Product concept validated as a pivot from "AI rewrites your CV" toward "AI orchestrates your own content" — see PROJECT.md core principle.
- Full PRD drafted (`Iranse-PRD.md`), covering feature requirements, MVP phasing, risks, and success metrics.
- System architecture designed: core pipeline, job ingestion with adapter pattern, matching engine scoring, resume assembly algorithm, cover letter assembly algorithm, application queue state machine — see ARCHITECTURE.md.
- Career knowledge base data model (ERD) designed.
- Six UI mockups explored: home screen, match review queue, daily digest, career profile, application tracking list, preferences/auto-apply settings.
- Six-file `/context/` system set up (this file and its siblings).

## Open questions (unresolved — do not assume an answer)

1. **Free tier cap scope** — does the 5-applications/month free limit apply to every approved application, or only auto-submitted ones? (DECISIONS.md #9)
2. **DeadLetter notification timing** — immediate alert vs. rolled into next day's digest? Likely depends on whether the listing is time-sensitive, but the exact rule isn't defined.
3. **Self-report trigger window** — fixed number of days after submission, or portal-specific? (DECISIONS.md #8)
4. **Digest primary surface** — is the daily digest primarily an email, an in-app screen, or both? This affects design constraints significantly (email can't run JS; score bars/buttons would need static equivalents).
5. **Onboarding minimum achievements** — soft nudge or hard block before a user can finish onboarding with too few achievements/voice snippets per role?
6. **NIN KYC vendor** — not yet selected between VerifyMe, Youverify, and Prembly. Needs a short technical/legal spike before committing.
7. **MVP job source shortlist** — which 2-3 sources to launch ingestion with hasn't been finalized (mix of official-API and scraping sources expected).

## Next steps

- NIN KYC vendor spike.
- Finalize MVP job source shortlist.
- Begin Phase 1 build per PRD section 10 (career knowledge base + ingestion from initial sources + matching engine + resume assembly + human-in-loop-only queue).
- Consider validating the concept with real users (smoke test / Mom Test approach, as used for other projects) before committing to full build.
- Once the codebase is scaffolded (monorepo decision included): add a thin `CLAUDE.md`/`AGENTS.md` with real build/test/lint commands and a pointer to `/context/`, plus `apps/web/CONTEXT.md` and `apps/api/CONTEXT.md` scoped to actual workspace conventions. Not needed before scaffolding exists — see WORKFLOWS.md read-order note.
