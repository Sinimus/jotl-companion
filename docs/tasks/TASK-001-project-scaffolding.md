# TASK-001: Project Scaffolding

**Status:** `DONE`
**Priority:** `HIGH`
**Estimated Complexity:** `MEDIUM`

---

## Goal

Set up the foundational project structure with Vite, React, TypeScript, Tailwind CSS v4, and shadcn/ui, following the architecture defined in BLUEPRINT.md.

---

## Context

We are building a companion app for the board game "Gloomhaven: Jaws of the Lion". This task establishes the technical foundation that all subsequent features will build upon.

### Tech Stack Requirements
- **Runtime:** Node.js (use `pnpm` exclusively)
- **Framework:** React 18 + TypeScript (strict mode)
- **Build:** Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State:** Zustand (install, do not configure yet)
- **Database:** Dexie.js (install, do not configure yet)
- **Validation:** Zod (install, do not configure yet)
- **Routing:** React Router v6 (install, configure basic routes)

### Project Structure to Create
```
src/
├── app/
│   ├── App.tsx                # Main app component with router
│   ├── main.tsx               # Entry point
│   └── routes.tsx             # Route definitions
├── features/
│   ├── campaign/
│   │   └── .gitkeep
│   ├── characters/
│   │   └── .gitkeep
│   ├── scenarios/
│   │   └── .gitkeep
│   ├── rules/
│   │   └── .gitkeep
│   └── calculators/
│   │   └── .gitkeep
├── shared/
│   ├── components/
│   │   └── ui/               # shadcn/ui components will go here
│   ├── hooks/
│   │   └── .gitkeep
│   ├── lib/
│   │   └── utils.ts          # cn() utility for class merging
│   └── types/
│       └── index.ts          # Type barrel export
├── data/
│   └── .gitkeep
└── styles/
    └── globals.css           # Tailwind directives + custom properties
```

---

## Files to Touch

### Create (New Files)
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration (strict mode)
- `tsconfig.node.json` - Node TypeScript config for Vite
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind v4 configuration
- `postcss.config.js` - PostCSS config for Tailwind
- `components.json` - shadcn/ui configuration
- `index.html` - HTML entry point
- `src/app/App.tsx`
- `src/app/main.tsx`
- `src/app/routes.tsx`
- `src/shared/lib/utils.ts`
- `src/shared/types/index.ts`
- `src/styles/globals.css`
- `.gitkeep` files for empty directories

### Modify
- `.gitignore` - Add standard Node/Vite ignores

---

## Constraints

1. **DO NOT** create any feature implementations yet (only folder structure)
2. **DO NOT** configure Zustand stores (just install the package)
3. **DO NOT** configure Dexie database (just install the package)
4. **DO NOT** add any game-specific data or types
5. **DO NOT** use npm or yarn - use `pnpm` exclusively
6. **DO NOT** install packages globally
7. **MUST** use TypeScript strict mode
8. **MUST** use Tailwind CSS v4 (not v3)

---

## Rules of Engagement

- This is a **foundation task** - prioritize correctness over speed
- Follow the exact folder structure in Context section
- Use the latest stable versions of all packages
- Include basic ESLint + Prettier config (optional but recommended)

---

## Acceptance Criteria

1. `pnpm install` completes without errors
2. `pnpm dev` starts the development server successfully
3. Browser shows a basic "Jaws of the Lion Companion" placeholder page
4. `pnpm build` completes without TypeScript errors
5. All directories from the structure exist (with .gitkeep where needed)
6. TypeScript is in strict mode (`"strict": true` in tsconfig.json)
7. Tailwind CSS v4 is working (test with a utility class)
8. shadcn/ui is initialized (components.json exists)
9. React Router shows "/" route with placeholder content

---

## Deliverables

When complete, run these commands and report results:
```bash
pnpm install && pnpm build
```

Report any warnings or errors encountered.

---

## Reference Files

- `BLUEPRINT.md` - Section 3 (Application Architecture)
- `CLAUDE.md` - Tech stack requirements

---

*Task created: 2026-02-03*
*Architect: Claude Opus 4.5*
