# PROJECT.md — Iransé

## What this is

Iransé (Yoruba: "messenger") is an AI-orchestrated career agent: it builds a permanent, structured record of a user's career, continuously discovers relevant job openings across multiple portals, scores each opening against the user's profile, assembles tailored resumes and cover letters from the user's own previously written content, and — where authorized — queues and submits applications on the user's behalf.

Iransé is being validated as a standalone product. It is **not** replacing Ranmi Suite or YandaCentral; it runs as an independent parallel track.

## Problem statement

Job seekers spend excessive time browsing portals, tailoring CVs by hand, and manually submitting applications, and still miss relevant roles. Existing "auto-apply" tools solve the speed problem with AI-rewritten resumes at volume, which recruiters increasingly recognize and discount. There's a gap for a tool that automates discovery and assembly while keeping every word in the user's own voice.

## Core principle: select, don't rewrite

This is the product's central bet and its main differentiation from existing auto-apply tools. Iransé's AI components act as an **orchestrator, not an author**:

- Resumes are assembled by selecting and ordering the user's own pre-written achievement bullets — never rewritten.
- Cover letters are assembled from the user's own pre-written, role-tagged paragraphs — never generated or smoothed.
- The only generative/ML component in the core pipeline is similarity scoring (embeddings) used for ranking and retrieval, not content creation.

Any feature proposal that requires generating new user-facing text should be treated as a non-goal unless this principle is explicitly revisited as a decision (see DECISIONS.md).

## Goals & non-goals

| Goal | Non-goal |
|---|---|
| Automate job discovery across portals | Being the fastest / highest-volume auto-applier |
| Score jobs against the user's real profile, explainably | Black-box or single-number matching |
| Assemble resumes and letters from the user's own content | Generating new resume language or achievements with an LLM |
| Apply automatically where authorized and safe | Bypassing platform rate limits, CAPTCHAs, or ToS at any cost |
| Build a durable, reusable career asset (the knowledge base) | Treating the CV as a disposable, single-use file |

## Target users

- **Primary:** Job seekers — graduates, professionals, career switchers, migration/visa seekers (Lagos/Nigeria-first market)
- **Secondary:** Career coaches, recruitment agencies (future)
- **Admin:** Platform operators / support staff

## Current phase

Concept validation and system design. See STATE.md for what's actually built vs. still open.
