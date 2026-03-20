attra-concierge/
├─ README.md
├─ TASKS.md
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ apps/
│  ├─ server/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ config/
│  │     │  ├─ env.ts
│  │     │  └─ app-config.ts
│  │     ├─ server/
│  │     │  ├─ app.ts
│  │     │  ├─ routes.ts
│  │     │  └─ error-handler.ts
│  │     ├─ mcp/
│  │     │  ├─ register-tools.ts
│  │     │  ├─ tool-context.ts
│  │     │  └─ tool-metadata.ts
│  │     ├─ tools/
│  │     │  ├─ search-inventory/
│  │     │  │  ├─ schema.ts
│  │     │  │  ├─ handler.ts
│  │     │  │  ├─ service.ts
│  │     │  │  └─ presenter.ts
│  │     │  ├─ get-vehicle-details/
│  │     │  │  ├─ schema.ts
│  │     │  │  ├─ handler.ts
│  │     │  │  ├─ service.ts
│  │     │  │  └─ presenter.ts
│  │     │  ├─ compare-vehicles/
│  │     │  │  ├─ schema.ts
│  │     │  │  ├─ handler.ts
│  │     │  │  ├─ service.ts
│  │     │  │  └─ presenter.ts
│  │     │  ├─ start-consultant-handoff/
│  │     │  │  ├─ schema.ts
│  │     │  │  ├─ handler.ts
│  │     │  │  ├─ service.ts
│  │     │  │  └─ presenter.ts
│  │     │  └─ preview-purchase-path/
│  │     │     ├─ schema.ts
│  │     │     ├─ handler.ts
│  │     │     ├─ service.ts
│  │     │     └─ presenter.ts
│  │     ├─ domain/
│  │     │  ├─ vehicles/
│  │     │  │  ├─ vehicle.types.ts
│  │     │  │  ├─ vehicle.repository.ts
│  │     │  │  ├─ vehicle-normalizer.ts
│  │     │  │  ├─ vehicle-profiles.ts
│  │     │  │  └─ vehicle-query.service.ts
│  │     │  ├─ handoff/
│  │     │  │  ├─ handoff.types.ts
│  │     │  │  ├─ handoff.repository.ts
│  │     │  │  └─ handoff.service.ts
│  │     │  ├─ analytics/
│  │     │  │  ├─ analytics.types.ts
│  │     │  │  ├─ analytics.service.ts
│  │     │  │  └─ analytics.repository.ts
│  │     │  └─ intent/
│  │     │     ├─ intent-parser.ts
│  │     │     ├─ intent.types.ts
│  │     │     └─ intent-mappers.ts
│  │     ├─ integrations/
│  │     │  ├─ stock/
│  │     │  │  ├─ stock-client.ts
│  │     │  │  ├─ stock-mapper.ts
│  │     │  │  └─ stock-sync.service.ts
│  │     │  ├─ crm/
│  │     │  │  ├─ crm-client.ts
│  │     │  │  └─ crm-handoff.adapter.ts
│  │     │  └─ whatsapp/
│  │     │     ├─ whatsapp-client.ts
│  │     │     └─ whatsapp-handoff.adapter.ts
│  │     ├─ db/
│  │     │  ├─ client.ts
│  │     │  ├─ migrations/
│  │     │  └─ repositories/
│  │     ├─ ui-resources/
│  │     │  ├─ register-ui.ts
│  │     │  └─ resource-manifest.ts
│  │     ├─ telemetry/
│  │     │  ├─ logger.ts
│  │     │  ├─ metrics.ts
│  │     │  └─ tracing.ts
│  │     └─ utils/
│  │        ├─ errors.ts
│  │        ├─ result.ts
│  │        ├─ dates.ts
│  │        └─ strings.ts
│  └─ web/
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ vite.config.ts
│     └─ src/
│        ├─ main.tsx
│        ├─ App.tsx
│        ├─ app/
│        │  ├─ providers.tsx
│        │  ├─ routes.tsx
│        │  └─ query-client.ts
│        ├─ components/
│        │  ├─ vehicle-card/
│        │  ├─ vehicle-grid/
│        │  ├─ vehicle-detail-panel/
│        │  ├─ comparison-panel/
│        │  ├─ handoff-panel/
│        │  ├─ empty-state/
│        │  ├─ error-state/
│        │  └─ loading-state/
│        ├─ features/
│        │  ├─ search/
│        │  ├─ vehicle-details/
│        │  ├─ comparison/
│        │  └─ handoff/
│        ├─ hooks/
│        │  ├─ use-search-results.ts
│        │  ├─ use-vehicle-details.ts
│        │  └─ use-handoff.ts
│        ├─ lib/
│        │  ├─ openai-bridge.ts
│        │  ├─ api-client.ts
│        │  └─ formatters.ts
│        ├─ styles/
│        │  ├─ globals.css
│        │  └─ tokens.css
│        ├─ types/
│        │  ├─ vehicle.ts
│        │  ├─ comparison.ts
│        │  └─ handoff.ts
│        └─ utils/
│           ├─ currency.ts
│           ├─ labels.ts
│           └─ guards.ts
├─ packages/
│  ├─ shared/
│  │  ├─ package.json
│  │  └─ src/
│  │     ├─ schemas/
│  │     │  ├─ vehicle.ts
│  │     │  ├─ handoff.ts
│  │     │  ├─ search.ts
│  │     │  └─ comparison.ts
│  │     ├─ types/
│  │     │  ├─ common.ts
│  │     │  └─ events.ts
│  │     ├─ constants/
│  │     │  ├─ brands.ts
│  │     │  ├─ body-types.ts
│  │     │  └─ usage-profiles.ts
│  │     └─ utils/
│  │        ├─ assertions.ts
│  │        └─ parsers.ts
│  └─ config/
│     ├─ eslint/
│     ├─ typescript/
│     └─ prettier/
└─ docs/
   ├─ architecture.md
   ├─ product-decisions.md
   ├─ tool-contracts.md
   ├─ handoff-flow.md
   ├─ analytics-plan.md
   └─ launch-checklist.md