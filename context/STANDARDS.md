# STANDARDS.md — Iransé

## Stack conventions

- Backend: Node.js + Express, PostgreSQL, Redis/ioredis, BullMQ for background jobs and per-source queues
- Frontend: React/Vite PWA, Feature-Sliced Design folder structure
- Validation: Zod schemas at every service boundary (job normalization, API input, queue payloads)
- Mobile-first: primary surface is a PWA targeting Lagos users; desktop/admin views are secondary

## Hard rules (do not implement around these)

1. **No LLM content generation in the resume or cover letter path.** Any code that calls a generative model to produce new resume bullets, achievement text, or cover letter prose is a violation of the core product principle (see PROJECT.md) and should be rejected in review, not merged with a caveat.
2. **Every new job source must implement the full `JobSourceAdapter` interface** (see ARCHITECTURE.md) and register its own rate-limit config and auth strategy. No source is allowed to bypass the shared adapter contract "just this once."
3. **Rate limiting is always per-user-per-portal, never global.** A shared/global rate limiter would mask which specific user-portal pair is at risk of being flagged and would throttle unrelated users unfairly.
4. **Every matching or scoring dimension must be independently inspectable.** No combined score may ship without its per-dimension breakdown being queryable and displayable — this is both a product commitment (explainability) and a debugging necessity.
5. **NIN/identity verification goes through a licensed KYC aggregator only.** Direct NIMC integration is not available to arbitrary companies; do not attempt to build around this.
6. **Application queue states must reflect ground truth, not optimistic assumptions.** A job is not "Submitted" until the submission step actually confirms it. "Sending soon" / `RateLimited` / `Queued` states exist precisely so the UI never claims something happened before it verifiably did.
7. **All external job portal credentials and session cookies must be encrypted at rest.** Plaintext storage of external passwords, tokens, or session cookies in the database is prohibited. All credential columns must be encrypted using `infra/encryption` (AES-256-GCM) with the master secret key.
8. **All database queries must use parameterized raw SQL.** Direct string interpolation or concatenation of variables in database query strings is strictly forbidden to prevent SQL injection vulnerabilities.
9. **`packages/validation` is the canonical source of truth for schemas.** Schemas must be defined in `packages/validation` so that frontend (`apps/web`, `apps/admin`) and backend (`apps/api`) remain in type lockstep.

## Mitigations for the single-codebase tradeoff

The domain-driven modular monolith (DECISIONS.md #10) trades away compiler-enforced package boundaries and per-deployable dependency isolation for simplicity, given the current solo-founder stage. Two specific mitigations keep those costs from becoming invisible technical debt:

- **Heavy or optional dependencies must be dynamically imported, never statically imported at module top-level.** Puppeteer/Playwright (used by `job-discovery/adapters/`) is the clear case: `server.ts` transitively includes every module, so a static `import puppeteer from 'puppeteer'` at the top of an adapter file means the API process loads Chromium into memory even though it never scrapes. Use `const puppeteer = await import('puppeteer')` inside the function that actually needs it, so the cost is only paid by `worker.ts` at the moment a scrape actually runs.
- **Module boundaries should be enforced by tooling once there's real code**, not left as a convention alone. Add `eslint-plugin-boundaries` or `dependency-cruiser` so a build fails if, say, `applications/applications.service.ts` reaches into `matching/matching.repository.ts` directly instead of going through `matching`'s own service/public export. This approximates the enforced-boundary benefit of separate packages without the packaging overhead.

## Process convention

- This project uses the six-file `/context/` system (PROJECT, ARCHITECTURE, STANDARDS, DECISIONS, STATE, WORKFLOWS). Any AI agent or collaborator working in this repo should read all six before making architectural changes, and update DECISIONS.md and STATE.md when something changes — see WORKFLOWS.md.
