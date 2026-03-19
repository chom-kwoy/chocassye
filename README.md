# ᄎᆞ자쎠 (Chocassye)

A full-text search engine for historical Korean corpora. The name means "Find it!" in Middle Korean.

**Live site:** [find.됬.xyz](https://find.됬.xyz)

## Features

- Search historical Korean texts using **Hangul**, **Yale romanization**, or a mix of both
- Wildcard and **regular expression** support
- Results shown in context (surrounding sentences)
- **Decade-by-decade** frequency histogram
- Links to **scan images** of original source documents
- **Middle Chinese / Baxter romanization** analysis for Hanja characters
- Filter by document name, exclude modern translations, ignore syllable separators
- **Gugyeol** script input support
- Korean and English UI
- **Machoassye** — a Middle Korean word game (Wordle-style)

## Data Sources

- Hangul texts: 국립국어원 역사 자료 종합 정비
- Seokdok gugyeol texts: [kohico.kr](https://kohico.kr/) (sktot data)
- Some texts from 디지털 장서각
- Additional sources listed per document in the Sources page

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 18, TypeScript, Material-UI v7
- **Database:** PostgreSQL with `corpussearch` extension
- **Build:** Turbopack

## Development Setup

**Prerequisites:** Node.js, PostgreSQL with the `corpussearch` extension installed.

```bash
# Install dependencies
npm install

# Configure database (defaults: localhost, user postgres, db chocassye)
export DB_NAME=chocassye
export DB_PASSWORD=yourpassword

# Populate the database from corpus
npm run populate-db

# Start development server
npm run dev
```

The dev server runs on port 3000 and proxies `/api/*` to `localhost:5000`.

## Contact

ᄎᆞᆷ괴 — chom.kwoy@됬.xyz
