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

- React 18 + TypeScript
- Vite
- Tailwind CSS v4 + shadcn/ui
- Zustand (state management)
- Dexie.js (IndexedDB)
- Zod (validation)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
src/
├── app/                    # App entry, routing
├── features/               # Feature modules
│   ├── campaign/           # Campaign management
│   ├── characters/         # Character management
│   ├── scenarios/          # Scenario tracking
│   ├── rules/              # Rules reference
│   └── calculators/        # Game calculators
├── shared/                 # Shared components, hooks, utils
├── data/                   # Static game data (JSON)
└── styles/                 # Global styles
```

## Documentation

- [BLUEPRINT.md](./BLUEPRINT.md) - Architectural plan and roadmap
- [docs/](./docs/) - Game documentation and development handbook

---

## Dev Log

### 2026-02-03 - Project Initialization
- Created project structure documentation
- Analyzed game mechanics from official documentation
- Defined domain model and data schemas
- Planned implementation roadmap (18 tasks across 4 phases)

### Technical Debt
- esbuild postinstall warning (pnpm 10 security gate) — cosmetic, binary works
- Zod v4 installed (latest stable); Zod API differs from v3 — note for Task 3

### Unresolved Edge Cases
- None yet

---

## Roadmap

### Phase 1: Foundation
- [x] Task 1: Project scaffolding
- [ ] Task 2: Static game data
- [ ] Task 3: Data layer (schemas + DB)
- [ ] Task 4: Campaign CRUD
- [ ] Task 5: Character creation

### Phase 2: Core Features
- [ ] Task 6-10: Character management, scenarios, calculators

### Phase 3: Rules Reference
- [ ] Task 11-14: Glossary, quick reference, monster focus helper

### Phase 4: Polish
- [ ] Task 15-18: PWA, export/import, dark mode, visual map

---

*This is a fan project and is not affiliated with Cephalofair Games.*
