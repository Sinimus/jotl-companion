### Role-Based Workflow Protocol

Tato příručka definuje **závazný způsob práce** při vývoji softwaru v iterativní smyčce mezi rolí Architekta a Konstruktora.

> **Cíl:** Minimalizovat architektonický drift, maximalizovat rychlost implementace a udržet plnou lidskou kontrolu nad návrhem.

---

## 1. Definice Rolí (Abstraction Layer)

### 1.1 The Architect (Mozek & Stratég)

- **Kdo:** Ty (Human Lead) + High-IQ Model (např. Gemini Advanced, Claude Opus, OpenAI o1).
    
- **Odpovědnost:**
    
    - Rozklad problému a návrh řešení.
        
    - Tvorba Blueprintů a ADR.
        
    - Definice "Rules of Engagement" pro daný task.
        
    - Code Review a Debugging strategie.
        
- **Znalosti:** Čte tento **Handbook** i projektové **README**.
    

### 1.2 The Constructor (Ruka & Exekutiva)

- **Kdo:** Coding Agent (např. Claude Code, Gemini CLI, Cursor, Windsurf).
    
- **Odpovědnost:**
    
    - Čistá implementace zadání (Tasku).
        
    - Dodržování syntaxe a typové bezpečnosti.
        
    - Psaní testů.
        
- **Znalosti:** Nečte tento Handbook. Řídí se souborem **`CLAUDE.md` / `gemini.md`** (tech stack) a konkrétním **Task Kontraktem**.
    

---

## 2. Základní principy (NEPORUŠITELNÉ)

### 2.1 Separation of Concerns

- **Architekt myslí, Konstruktor koná.**
    
- Konstruktor **nesmí**:
    
    - Navrhovat architekturu.
        
    - Měnit návrhové vzory.
        
    - Zavádět nové abstrakce bez explicitního zadání v Tasku.
        
- Architekt **nesmí**:
    
    - Vytvářet kód bez validace Konstruktorem (riziko syntaktických chyb).
        

### 2.2 Single Source of Truth

Veškerá architektonická rozhodnutí MUSÍ být zaznamenána v repozitáři:

- `docs/adr/*.md` – Architecture Decision Records.
    
- `docs/blueprint/*.md` – Návrh feature / subsystému.
    
- `docs/contracts/*.md` – API, schémata.
    

Pokud něco **není v dokumentaci**, neexistuje to.

---

## 3. Fáze A – Design & Blueprint (The Architect)

### 3.1 Výstupy této fáze

Před zahájením kódování musí Architekt vyprodukovat:

1. **Blueprint dokument** (`docs/blueprint/<feature>.md`).
    
2. **Task Package** (sada instrukcí pro Konstruktora).
    

### 3.2 Context Handoff Protocol

Konstruktor má omezené kontextové okno a nezná historii chatu Architekta.

- **Pravidlo:** Task musí obsahovat **veškerý** nutný kontext.
    
- **Zákaz:** Odkazovat se na "to, o čem jsme mluvili výše".
    
- **Vstup pro Konstruktora:** `CLAUDE.md` (Tech Stack) + `Task Definition` (Zadání).
    

---

## 4. Fáze B – Task Kontrakty (The Handshake)

### 4.1 Filosofie

Task není přání. Task je **kontrakt**. Konstruktor má minimální volnost a maximální exekuci.

### 4.2 Rules of Engagement

Součástí každého tasku jsou specifická pravidla, která určuje Architekt.

- _Příklad:_ "Pro tento task ignoruj testy, jde o prototyp." nebo "Striktní TDD, nejdřív testy."
    

### 4.3 Povinná struktura Tasku (JSON/Markdown)

- `Goal`: Jedna věta, co má být hotovo.
    
- `Context`: Výtah z Blueprintu (nebo odkaz, pokud ho Konstruktor umí číst).
    
- `Files to touch`: Explicitní whitelist souborů.
    
- `Constraints`: Co je zakázáno (např. "Neměň DB schéma").
    
- `Acceptance`: Jak poznáme, že je hotovo (např. "Build pass, Test X pass").
    

---

## 5. Fáze C – Implementace (The Constructor)

### 5.1 Povinnosti Konstruktora

- Načíst `CLAUDE.md` / `gemini.md` pro nastavení prostředí (uv, pnpm, orbstack).
    
- Implementovat řešení přesně podle Tasku.
    
- V případě bloku (nejasnost, technická nemožnost) **okamžitě zastavit** a reportovat Architektovi (vrátit status `BLOCKED`).
    
- Nikdy neimprovizovat v architektuře.
    

---

## 6. Fáze D – Review & Debugging (The Architect)

### 6.1 Review Protocol

Architekt:

1. Analyzuje diff.
    
2. Kontroluje shodu s Blueprintem.
    
3. Pokud je kód zamítnut, vzniká **opravný Task** pro Konstruktora.
    

### 6.2 Debugging Workflow

Konstruktor nikdy nedebuguje sám "naslepo".

1. Konstruktor dodá Error Log / Stack Trace.
    
2. Architekt analyzuje a vytvoří hypotézu.
    
3. Architekt zadá **nový Task** s opravou.
    

---

## 7. Emergency Protocol (Red Button)

Použije se **POUZE** při kritické chybě v produkci (P0/Blocking).

1. **Skip Blueprint:** Je povoleno přeskočit fázi Blueprintu.
    
2. **Direct Command:** Architekt zadává přímý "Hotfix Task" Konstruktorovi.
    
3. **Retroactive Law:** Do **24 hodin** po vyřešení incidentu MUSÍ být vytvořen/aktualizován ADR a Blueprint odpovídající provedené změně.
    

---

## 8. Kontrolní checklist před spuštěním Konstruktora

1. [ ] Existuje Blueprint (nebo je aktivní Emergency Protocol)?
    
2. [ ] Task obsahuje veškerý kontext (Context Handoff)?
    
3. [ ] Jsou definována "Rules of Engagement"?
    
4. [ ] Konstruktor má k dispozici `CLAUDE.md` (Tech Stack)?
    
5. [ ] Jsou jasná Acceptance Criteria?
    

---

> **Motto:** Architekt drží vizi. Konstruktor drží kladivo. Nikdy si role nevyměňují.