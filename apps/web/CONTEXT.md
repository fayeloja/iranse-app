# CONTEXT.md — apps/web

User-facing PWA. React + Vite, Feature-Sliced Design. Mobile-first — Lagos users on mobile connections are the primary target, desktop is a secondary breakpoint.

## Structure (FSD)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── providers/
│   │   │   ├── AppProviders.tsx
│   │   │   └── QueryProvider.tsx
│   │   ├── routes/
│   │   │   └── router.tsx
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── main.tsx
│   ├── pages/
│   │   ├── home/
│   │   │   ├── index.tsx
│   │   │   └── ui/HomeScreen.tsx
│   │   ├── match-review/
│   │   │   ├── index.tsx
│   │   │   └── ui/MatchReviewScreen.tsx
│   │   ├── digest/
│   │   │   ├── index.tsx
│   │   │   └── ui/DigestScreen.tsx
│   │   ├── career-profile/
│   │   │   ├── index.tsx
│   │   │   └── ui/CareerProfileScreen.tsx
│   │   ├── applications/
│   │   │   ├── index.tsx
│   │   │   └── ui/ApplicationsScreen.tsx
│   │   └── preferences/
│   │       ├── index.tsx
│   │       └── ui/PreferencesScreen.tsx
│   ├── widgets/
│   │   ├── match-card/
│   │   │   ├── ui/MatchCard.tsx
│   │   │   └── model/useMatchCard.ts
│   │   ├── score-breakdown/
│   │   │   └── ui/ScoreBreakdown.tsx
│   │   ├── digest-summary/
│   │   │   └── ui/DigestSummary.tsx
│   │   └── onboarding-capture-step/
│   │       └── ui/
│   │           ├── AchievementCaptureStep.tsx
│   │           └── VoiceSnippetCaptureStep.tsx
│   ├── features/
│   │   ├── approve-application/
│   │   │   ├── model/useApproveApplication.ts
│   │   │   └── api/approveApplication.ts
│   │   ├── skip-application/
│   │   │   └── api/skipApplication.ts
│   │   ├── add-achievement/
│   │   │   ├── ui/AddAchievementForm.tsx
│   │   │   └── api/addAchievement.ts
│   │   ├── edit-preferences/
│   │   │   ├── ui/PreferencesForm.tsx
│   │   │   └── api/updatePreferences.ts
│   │   └── self-report-outcome/
│   │       ├── ui/SelfReportModal.tsx
│   │       └── api/reportOutcome.ts
│   ├── entities/
│   │   ├── job/
│   │   │   ├── model/types.ts
│   │   │   └── api/jobApi.ts
│   │   ├── achievement/
│   │   │   ├── model/types.ts
│   │   │   └── api/achievementApi.ts
│   │   ├── resume-variant/
│   │   │   ├── model/types.ts
│   │   │   └── api/resumeVariantApi.ts
│   │   ├── voice-snippet/
│   │   │   ├── model/types.ts
│   │   │   └── api/voiceSnippetApi.ts
│   │   └── application/
│   │       ├── model/types.ts
│   │       └── api/applicationApi.ts
│   └── shared/
│       ├── ui/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Badge.tsx
│       │   └── ProgressBar.tsx
│       ├── api/httpClient.ts
│       └── lib/
│           ├── validation/        # re-exported from packages/validation
│           └── utils/
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Screen conventions

Screens should stay consistent with the interaction patterns already established during design (see design mockups from prior sessions if available, or `/context/ARCHITECTURE.md` for the flows they map to):

- **Honest queue-state language** — never show "Submitted" before submission is confirmed. Use "Sending soon" / "Queued" for pre-confirmation states, matching the application queue state machine in `ARCHITECTURE.md`.
- **Visible score breakdowns** — any match score shown to a user should be expandable into its per-dimension components, never just a single opaque number.
- **Human-in-loop is the visually prominent default** — "review before sending" style controls should read as the normal path; auto-submit (once it exists) should read as the opt-in exception, not the reverse.
- **Provenance over generation** — anywhere a resume or letter is shown, indicate which variant/snippets were used. Never present assembled content as if Iransé wrote it.

## API interaction

- All requests/responses validated against `packages/validation` Zod schemas (the canonical source, also consumed by `apps/api`'s modules) before submission and after receipt — no untyped payloads.
- Server state managed via a data-fetching library (React Query or equivalent) — do not duplicate server state in a separate global store.
- Local-only UI state (form drafts, filter selections, in-progress onboarding steps) via component state or lightweight context.

## Data handling

- No client-side persistence of NIN or raw CV file contents beyond what's needed for the active session/upload flow. Sensitive data handling is server-side; see `apps/api/CONTEXT.md`.

## Open items

- Offline/poor-connectivity behavior for the match review queue isn't designed yet — reviewing and approving matches under weak connectivity is a real condition for the target market and may need a queue-while-offline, sync-when-connected pattern.
