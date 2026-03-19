# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chocassye (ᄎᆞ자쎠) is a searchable historical Korean corpus web application for linguists and researchers. It provides full-text search across historical Korean documents with phonetic analysis (Middle Chinese/Baxter romanization), scan image linking, and linguistic metadata.

## Commands

```bash
npm run dev          # Development server with Turbopack (proxies /api/* to localhost:5000)
npm run build        # Production build (outputs to ./build, not .next)
npm run start        # Start production server
npm run lint         # ESLint
npm test             # Jest test suite
npm run populate-db  # Initialize database with corpus texts
```

To run a single test file: `npx jest tests/test_yale.ts`

## Architecture

### Stack
- **Frontend:** Next.js 16 (App Router) + React 18 + TypeScript
- **Styling:** Material-UI v7 + Emotion + TailwindCSS
- **Database:** PostgreSQL with custom `corpussearch` extension
- **i18n:** i18next (Korean + English, auto-detected from browser)
- **Build:** Turbopack; output directory is `./build`

### Data Flow for Search
1. User submits query on `/search` (client component in `src/app/search/searchPage.tsx`)
2. Request hits Next.js API route → `src/app/search/search.ts` builds SQL
3. Core SQL logic lives in `src/utils/search.ts` (large file, ~61KB)
4. PostgreSQL query uses `corpussearch` extension for full-text search with context window (±5 sentences)
5. Results rendered in `SearchResults.tsx` → `SentenceWithCtx.tsx` with `Highlight.js`

### Key Directories
- `src/app/` — Next.js App Router pages and API routes
- `src/app/search/` — Main search page, results, and server-side query logic
- `src/components/` — Shared React components
- `src/utils/` — Database query builders, document parsers, regex engine
- `chocassye-corpus/` — Git submodule: raw source documents and Middle Chinese data
- `KoreanVerbParser/` — Git submodule: Python verb parser
- `index/` — Pre-computed binary ngram index files (~160K `.bin` files)
- `scripts/` — One-off scripts (DB population, donation sync)
- `tests/` — Jest test files (currently `test_english.ts`, `test_yale.ts`)

### Database
- PostgreSQL, default connection: `localhost`, user `postgres`, DB `chocassye`
- Environment variables: `DB_NAME`, `DB_PASSWORD`
- Connection pool: `src/app/db.ts`

### Special Components
- `YaleToHangul.mjs` — Yale romanization → Hangul conversion (used in search input)
- `Gugyeol.js` / `TextFieldWithGugyeol.js` — Support for historical Gugyeol script
- `Regex.mjs` — Custom search regex engine with phonetic variation support
- `src/utils/phonemize/` — Phonetic analysis submodule
- `PuaToUni.mjs` — PUA (Private Use Area) unicode normalization for historical characters

### Hanja / Middle Chinese
- `/hanja` page provides Middle Chinese character lookup
- Baxter romanization system with tonal analysis
- Data sourced from `chocassye-corpus/MCData/`

### Donation Integration
- `src/app/api/webhook/bmc/route.ts` — Buy Me a Coffee webhook
- `donations.json` — Local donation record store
- `scripts/syncDonations.ts` — Sync script

## Path Aliases
TypeScript path alias `@/*` maps to `./src/*`.

## Pre-commit Hooks
Husky runs lint-staged on commit (auto-format + lint). Do not skip with `--no-verify`.
