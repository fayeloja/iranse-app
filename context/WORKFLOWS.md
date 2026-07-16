# WORKFLOWS.md — Iransé

Guidance for any AI agent (Claude Code, Cursor, Antigravity, or otherwise) or human collaborator picking up work in this repo.

## Read order

Before writing any code or proposing any architectural change, read in this order:

1. `PROJECT.md` — what this is and the non-negotiable core principle
2. `ARCHITECTURE.md` — how the system is shaped and why
3. `STANDARDS.md` — hard rules that don't get bent for convenience
4. `DECISIONS.md` — what's already been decided and why, including open/unresolved items
5. `STATE.md` — what's actually built vs. still theoretical, and current open questions
6. This file

## Rules for making changes

- **A new architectural choice gets a new numbered entry in `DECISIONS.md`.** Don't silently implement something that contradicts or extends a prior decision — append a new ADR, and if it supersedes an old one, note that in both entries.
- **Anything touching the resume or cover letter code path gets checked against STANDARDS.md rule 1** (no generative rewriting) before it's proposed, not after it's written.
- **A new job source is a new adapter file implementing the shared `JobSourceAdapter` interface** (ARCHITECTURE.md), plus its own rate-limit config. The core ingestion pipeline should never need to change to add a source.
- **New UI screens should stay consistent with the mockup patterns already established** (honest queue-state language, explainable score breakdowns, human-in-loop as the visually prominent default) rather than reinventing interaction patterns per screen.
- **Update `STATE.md` at the end of any significant session** — what changed, what's now resolved, what's newly open. Don't let it go stale; it's the fastest way for the next session (human or AI) to get oriented.

## When something is genuinely ambiguous

If an open question in `STATE.md` blocks the task at hand, resolve it as a proposal (write the reasoning, pick a default, flag it clearly) rather than silently picking an answer and moving on — these are product decisions, not implementation details, and Fatai should get the chance to override the default before it's load-bearing.
