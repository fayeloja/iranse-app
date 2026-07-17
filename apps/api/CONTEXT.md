# CONTEXT.md — apps/api

Single codebase, two entrypoints, kept under the `apps/api` name. All domain logic lives in `modules/`; `server.ts` and `worker.ts` are thin bootstraps that both call into `modules/*.service.ts` directly. Full reasoning for this shape and its production deployment topology is in `/context/ARCHITECTURE.md` — this file covers backend code conventions and the concrete folder scaffold.

## Structure

```
apps/api/
├── src/
│   ├── server.ts                  # HTTP entrypoint — mounts every modules/*.route.ts
│   ├── worker.ts                  # queue entrypoint — registers processors per WORKER_QUEUES
│   ├── modules/
│   │   ├── career-profile/
│   │   │   ├── career-profile.route.ts
│   │   │   ├── career-profile.controller.ts
│   │   │   ├── career-profile.service.ts
│   │   │   ├── career-profile.repository.ts
│   │   │   └── career-profile.validation.ts
│   │   ├── job-discovery/
│   │   │   ├── job-discovery.route.ts        # admin/debug endpoints only
│   │   │   ├── job-discovery.controller.ts
│   │   │   ├── job-discovery.service.ts      # scheduler, orchestration, dedup
│   │   │   ├── job-discovery.repository.ts
│   │   │   ├── job-discovery.validation.ts
│   │   │   └── adapters/
│   │   │       ├── job-source.interface.ts
│   │   │       ├── indeed.adapter.ts
│   │   │       ├── linkedin.adapter.ts
│   │   │       └── jobberman.adapter.ts
│   │   ├── matching/
│   │   │   ├── matching.route.ts
│   │   │   ├── matching.controller.ts
│   │   │   ├── matching.service.ts           # aggregation
│   │   │   ├── matching.repository.ts
│   │   │   ├── matching.validation.ts
│   │   │   └── dimensions/
│   │   │       ├── skills.ts
│   │   │       ├── experience.ts
│   │   │       ├── industry.ts
│   │   │       ├── education.ts
│   │   │       ├── location.ts
│   │   │       ├── salary.ts
│   │   │       ├── visa.ts
│   │   │       └── culture-fit.ts
│   │   ├── application-materials/
│   │   │   ├── application-materials.route.ts
│   │   │   ├── application-materials.controller.ts
│   │   │   ├── application-materials.service.ts   # resume + letter assembly
│   │   │   ├── application-materials.repository.ts
│   │   │   └── application-materials.validation.ts
│   │   ├── applications/
│   │   │   ├── applications.route.ts
│   │   │   ├── applications.controller.ts
│   │   │   ├── applications.service.ts       # queue state machine
│   │   │   ├── applications.repository.ts
│   │   │   └── applications.validation.ts
│   │   ├── identity/
│   │   │   ├── identity.route.ts
│   │   │   ├── identity.controller.ts
│   │   │   ├── identity.service.ts
│   │   │   ├── identity.repository.ts
│   │   │   └── identity.validation.ts
│   │   ├── billing/
│   │   │   ├── billing.route.ts
│   │   │   ├── billing.controller.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── billing.repository.ts
│   │   │   └── billing.validation.ts
│   │   └── admin/
│   │       ├── admin.route.ts
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts              # reads across other modules' repositories
│   │       ├── admin.repository.ts
│   │       └── admin.validation.ts
│   ├── infra/                                # clients only, not domains
│   │   ├── database/
│   │   │   ├── client.ts
│   │   │   ├── schema/
│   │   │   └── migrations/
│   │   ├── queue/
│   │   │   ├── connection.ts
│   │   │   └── queues.ts
│   │   ├── rate-limiter/
│   │   │   └── compositeKeyLimiter.ts
│   │   ├── embeddings/
│   │   │   └── similarity.ts
│   │   ├── kyc-client/
│   │   │   └── client.ts
│   │   └── payments/
│   │       └── paystackClient.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── requestValidation.ts
│   └── config/
│       └── env.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Conventions

- Each module's five files own the full lifecycle of that domain. If logic for one domain starts leaking into another module's service, or directly into `infra/`, that's a signal the boundary is wrong — fix the boundary, don't route around it.
- `{module}.controller.ts` stays thin: parse the request, call `{module}.service.ts`, shape the response. All real logic lives in the service file, never the controller.
- `{module}.repository.ts` is the only place that talks to the database for that module. No `infra/database` calls from a controller or service directly.
- `{module}.validation.ts` imports and re-exports (or extends) the canonical Zod schemas from `packages/validation` — `packages/validation` is the single source of truth, not the module. This keeps the dependency direction correct for the monorepo build graph (apps depend on packages, never the reverse) and means `apps/web`, `apps/admin`, and every `apps/api` module validate against the exact same schema.
- `worker.ts` never contains business logic of its own. It registers BullMQ processors that call existing module service functions — the same functions `server.ts`'s controllers call. There is exactly one implementation per domain capability, regardless of trigger.
- Endpoints that kick off background work (e.g. approving an application) enqueue a job via `infra/queue` and return immediately. `server.ts` never blocks a request on work that belongs to `worker.ts`.
- All NIN/KYC calls route through `infra/kyc-client`, called only from `identity.service.ts`. All Paystack calls route through `infra/payments`, called only from `billing.service.ts`. No module talks to a third-party vendor directly from its controller or route.
- New job source = new file in `job-discovery/adapters/` implementing the shared `JobSourceAdapter` interface (`job-source.interface.ts`). The `job-discovery` module's core service/pipeline never needs to change to add one.
- Heavy/optional dependencies (Puppeteer, Playwright, used inside `job-discovery/adapters/`) must be dynamically imported, not statically imported at module top-level — `server.ts` transitively includes every module, so a static import would load Chromium into the API process even though it never scrapes. See `/context/STANDARDS.md`.

## Auth

Not yet decided — should match whatever session/JWT convention is already established across Ranmi and YandaCentral rather than introducing a third pattern. Placeholder until confirmed.

## Deployment

Code organization only, covered above. For how `server.ts` and `worker.ts` actually get deployed and scaled in production (single image, separate services per entrypoint, `WORKER_QUEUES` specialization, phased infra by load), see `/context/ARCHITECTURE.md`'s "Deployment topology" section.
