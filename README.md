# Gloomhaven: Jaws of the Lion - Companion App

A companion app for the board game **Gloomhaven: Jaws of the Lion** that enhances the physical game experience without replacing it.

## Features (Planned)

- **Campaign Tracking** - Track progress through the 17-scenario campaign
- **Character Management** - Manage up to 4 characters with levels, XP, gold, perks, and items
- **Scenario Tracker** - Track unlocked/completed scenarios
- **Rules Reference** - Searchable glossary and quick reference cards
- **Calculators** - Scenario level, trap damage, gold conversion, bonus XP
- **Post-Scenario Checklist** - Step-by-step guide for end-of-scenario procedures

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | 19.x |
| Language | TypeScript | 5.9 (strict) |
| Build | Vite | 7.x |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui | (configured) |
| State | Zustand | 5.x |
| Database | Dexie.js (IndexedDB) | 4.x |
| Validation | Zod | v4 |
| Routing | React Router | 7.x |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```

## Project Structure

```
src/
├── app/                    # App entry, routing (main.tsx, App.tsx, routes.tsx)
├── features/               # Feature modules (campaign, characters, scenarios, rules, calculators)
├── shared/
│   ├── schemas/            # Zod v4 validation schemas
│   ├── db/                 # Dexie database (IndexedDB)
│   ├── components/ui/      # shadcn/ui components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities (cn, etc.)
│   └── types/              # TypeScript types
├── data/                   # Static game data (JSON) — 7 fixtures
└── styles/                 # Global styles (Tailwind v4)
```

## Documentation

- [BLUEPRINT.md](./BLUEPRINT.md) - Architectural plan, roadmap, and cold-start context
- [docs/tasks/](./docs/tasks/) - Task specifications (Architect → Constructor contracts)
- [docs/game-docs/](./docs/game-docs/) - Official game PDFs for reference

---

## Dev Log

### 2026-02-04 — Character Sheet Polish (Task 20)

**Task 20: Character Sheet Polish**
- Unified Stats, Perks, and Items into a tabbed character sheet.
- Implemented `ItemManager` with slot limits and visual inventory.
- Added "Next Level" XP progress bar and sticky header.
- Cleaned up routing and layout for a mobile-first experience.

### 2026-02-04 — Item Management (Task 19)

**Task 19: Item Management**
- Implemented `ItemShop` with filtering by slot and search.
- Created `ItemManager` for characters to view and manage equipped items.
- Enforced slot logic (Head, Body, etc.) and small item limits.
- Integrated into the character data flow.

### 2026-02-04 — Dashboard Redesign (Task 18)

**Task 18: Dashboard Redesign**
- Transformed `CampaignList` into a dashboard with "Welcome Back" header.
- Added `ActiveCampaignCard` with large visual stats (Progress, Avg Level).
- Created `CreateCampaignCard` with inline form expansion.
- Sorted campaigns by recently updated.

### 2026-02-04 — UI/UX Overhaul (Task 17)

**Task 17: Layout & Navigation**
- Implemented global `AppLayout` with `BottomNav` for mobile and responsive design.
- Created `SettingsPage` and migrated Export/Import functionality there.
- Restructured routing to wrap main views in the new layout.
- Cleaned up `CampaignList` to focus on campaign management.

### 2026-02-04 — PWA Support (Task 15)

**Task 15: PWA Support (Offline & Installable)**
- Configured `vite-plugin-pwa` for automatic background updates.
- Implemented offline caching for all assets and game data (JSON).
- Created web manifest and custom amber "J" icon.
- App is now installable on mobile and desktop devices.

### 2026-02-04 — Quick Reference Cards (Task 13)

**Task 13: Quick Reference Cards**
- `RulesLayout`: Tabbed navigation between Glossary and Reference sections.
- `ReferencePage`: Visual cards for Conditions (color-coded), Elements (thematic indicators), and core rule guides (Focus, Movement, LoS).
- Improved formatting for rule content with support for bold, bullet points, and paragraphs.
- Integrated rules access directly from the Campaign Detail view.

### 2026-02-04 — Searchable Glossary UI (Task 12)

**Task 12: Searchable Glossary UI**
- `GlossaryPage` component: full-featured browsing experience for 95 terms.
- Multi-layer filtering: free-text search, A-Z letter filter, and category dropdown.
- Mobile-responsive layout with horizontal scrolling filters.
- Support for bold markdown in rule descriptions.

### 2026-02-04 — Rules Data Structure (Task 11)

**Task 11: Rules Data & Glossary Content**
- Extracted 95 glossary terms from game docs.
- 4 detailed rule guides (Monster Movement, Focus, LoS, Adv/Disadv).
- Complete Treasure Index (1-16).
- Structured in `src/data/rules.json` with full TypeScript typing.

### 2026-02-04 — Post-Scenario Checklist (Task 9)

**Task 9: Post-Scenario Checklist**
- `PostScenarioChecklist` component: interactive guide for end-of-game rewards
- Dynamic lookups for Bonus XP and Gold conversion based on scenario level
- Success/Failure branching checklists
- Built-in gold calculator for money tokens

### 2026-02-04 — Scenario Tracker (Task 8)

**Task 8: Scenario Tracker & Unlock Chain**
- `ScenarioTracker` component: visual grid of 17 scenarios
- Statuses: Locked (gray), Unlocked (interactive), Completed (green check)
- `setScenarioStatus` store action: auto-unlocks downstream scenarios upon completion
- Integrated into `CampaignDetail` page

### 2026-02-04 — Character Detail + Editing (Task 6)

**Task 6: Character Detail View + Editing**
- `computeLevelFromXp` helper — level auto-derived from XP thresholds (L1=0 … L9=500)
- `updateCharacter` store action: partial updates (XP/gold/checkmarks), auto-level recompute, Zod validation, write-through to Dexie
- `CharacterDetail` page: XP progress bar, 3-column stat editors (XP, gold, checkmarks), perks/items placeholders
- Stat inputs use local state + onBlur persist — instant visual feedback, no stale closure
- `CharacterCard` is now a full clickable card (stopPropagation on delete "×")

### 2026-02-04 — Character Creation (Task 5)

**Task 5: Character Creation Flow**
- Store: `addCharacter` + `removeCharacter` — Zod-validated, write-through to Dexie via `db.campaigns.put()`
- `CampaignDetail` page replaces `/campaign/:id` placeholder: back link, party roster, add form
- `CharacterCard`: type badge, player name, Level + HP (from static hitPoints table), delete-with-confirm
- `CharacterForm`: 4 type-selector buttons, name input, Add button; shows "Party full" at 4
- Deep-link safety: loading gate prevents "not found" flash before Dexie hydration

### 2026-02-04 — Campaign CRUD (Task 4)

**Task 4: Campaign CRUD + Zustand Store**
- Zustand 5 store (`src/features/campaign/store.ts`): `initStore`, `createCampaign`, `deleteCampaign`, `setActiveCampaign`
- Write-through persistence to Dexie; `activeCampaignId` in `localStorage` (`jotl:activeCampaignId`)
- New campaigns auto-unlock Scenario 1; characters/cityEvents start empty
- `CampaignList` + `CampaignCard` UI: create, list, select, delete-with-confirm
- Routes: `/` → campaign list, `/campaign/:id` → detail stub (Task 5)
- `App.tsx` hydrates store on mount via single `useEffect`

### 2026-02-03 — Foundation Complete (Tasks 1-3)

**Task 1: Project Scaffolding**
- Vite 7 + React 19 + TypeScript 5.9 (strict mode)
- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- shadcn/ui configured (components.json, path aliases, `cn()` utility)
- React Router with "/" placeholder route

**Task 2: Static Game Data**
- 7 JSON fixtures: characters, perks, conditions, elements, scenarios, tables, items
- 4 characters with HP tables (levels 1-9)
- 47 perks, 9 conditions, 6 elements, 17 scenarios, 7 starter items
- Typed barrel export via `@/data`

**Task 3: Data Layer**
- Zod v4 schemas: `CharacterProgress`, `Campaign`, enums, primitives
- 19/19 validation checks pass (valid accept, invalid reject, coercion)
- Dexie v1 database: `campaigns` table with `id`, `name`, `updatedAt` indices
- Singleton `db` export via `@/shared/db`

### Technical Debt
- esbuild postinstall warning (pnpm 10 security gate) — cosmetic, binary works

### Unresolved Edge Cases
- None yet

---

## Roadmap

### Phase 1: Foundation
- [x] Task 1: Project scaffolding
- [x] Task 2: Static game data
- [x] Task 3: Data layer (schemas + DB)
- [x] Task 4: Campaign CRUD + persistence
- [x] Task 5: Character creation

### Phase 2: Core Features (Tasks 6-10)
- [ ] Character detail view, editing, level-up workflow
- [ ] Scenario tracker + post-scenario checklist
- [ ] Calculators (scenario level, gold, XP)

### Phase 3: Rules Reference (Tasks 11-14)
- [ ] Searchable glossary, quick reference cards
- [ ] Monster focus algorithm helper

### Phase 4: Polish (Tasks 15-18)
- [ ] PWA, export/import, dark mode, visual campaign map

---

## Git Log

```
8cb4661  Task 003: Data layer — Zod v4 schemas + Dexie DB
679e1f3  Task 002: Static game data — 7 JSON fixtures + typed barrel
7640264  Task 001: Project scaffolding — Vite + React + TS + Tailwind v4
6db5572  Initialize project architecture and planning docs
```

---

*This is a fan project and is not affiliated with Cephalofair Games.*
