# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is BucleBot

Educational programming game for secondary school students (14–16). Dual goal: **addictive** and **educational** at the same time — the "aha" moment and the fun hit are the same instant. Core rule: **you cannot win without applying the programming concept being taught**.

Scoring is by efficiency (fewest commands), not mere correctness. This drives computational thinking and replayability.

## Platform

- **Web** (primary for classroom use — Chromebooks/PCs) and **mobile** (Android first, then iOS) from a **single codebase**.
- Stack: **Expo + React Native + Expo Router**, deployed via EAS.
- Interaction must work equally well with **mouse/keyboard** and **touch**. Layouts must be responsive from a phone screen to a desktop monitor.

## Commands

```bash
# Start development server (choose platform)
npx expo start          # interactive menu
npx expo start --web    # web only
npx expo start --android
npx expo start --ios

# Build for production (EAS)
eas build --platform android
eas build --platform ios

# Type-check
npx tsc --noEmit

# Lint
npx expo lint
```

## Architecture

### Game engine (`src/engine/`)

Pure TypeScript, no React dependencies. The engine is the source of truth.

- **`types.ts`** — shared types: `Direction`, `DroneState {x, y, dir}`, `Command ('F'|'L'|'R')`, `Level`, `RunResult`.
- **`levels.ts`** — all level data as a typed array. **Levels are pure data** — adding a level or world never touches logic files.
- **`executor.ts`** — `runSequence(level, program): AsyncGenerator<StepEvent>` — yields one event per step (move, turn, crash, goal). Caller drives animation timing; engine has no UI coupling.
- **`scoring.ts`** — `score(commandsUsed, par)` → medal/rating.

### Navigation (`app/`)

Expo Router file-based routes:

```
app/
  index.tsx          # world/level select
  game/[levelId].tsx # game screen
  results.tsx        # post-level overlay (optional route)
```

### Components (`src/components/`)

- **`Grid`** — renders the cell matrix; receives `level` and `droneState` as props, stateless.
- **`DroneSprite`** — animated drone; driven by `droneState` prop changes.
- **`CommandStrip`** — the program tape; highlights active command during execution.
- **`CommandPalette`** — the three buttons (Avanzar / Girar izq / Girar der); handles both `onPress` (touch) and keyboard shortcuts.

### State

Game state lives in the game screen component (React `useState`/`useReducer`). **No persistence** — state is in memory only, no AsyncStorage or localStorage. This is intentional per design brief.

## Level data format

```ts
interface Level {
  id: string;
  cols: number;
  rows: number;
  start: { x: number; y: number; dir: Direction }; // Direction: 0=up,1=right,2=down,3=left
  goal: { x: number; y: number };
  walls?: [number, number][];   // explicit wall list
  open?: [number, number][];    // whitelist — everything else is wall
  par: number;                  // optimal command count
  intro: string;                // shown before play
  outro?: string;               // shown on level completion (used for loop teaser on level 5)
}
```

## MVP level sequence (World 1 — Sequences)

5 levels escalating difficulty. Level 5 is deliberately repetitive to seed desire for loops (World 2 hook). See `docs/dron-secuencias.html` for the reference prototype (mechanics only — not deployed, rewritten in Expo).

## Key design rules (non-negotiable)

- **"Plan and execute"** mechanic: the full sequence runs at once; no mid-run corrections. This forces mental simulation.
- **Levels as data**: never hardcode level logic. New worlds = new data files.
- **No credentials in the repo** — EAS secrets go in the EAS dashboard, not in `app.json` or env files committed to git.
- **Concept labelling**: UI should name the concept being used ("esto es una SECUENCIA", "próximamente: BUCLES") so it transfers to the classroom.

## Reference

- `docs/DESIGN_BRIEF.md` — full product vision, pedagogical principles, roadmap.
- `docs/dron-secuencias.html` — HTML prototype; the mechanic and level data are the ground truth for the MVP.
