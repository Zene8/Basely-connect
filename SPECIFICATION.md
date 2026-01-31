# GitHub Matcher AI - Project Specification

## 1. Overview
This project is an AI-powered platform that matches software engineers with companies based on a deep analysis of their skills, coding style, and personal preferences. It leverages data from GitHub (public & private repos), resumes, and personal statements, comparing them against detailed company profiles and requirements.

## 2. Architecture

### 2.1 Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite (Dev) / Postgres (Prod) via Prisma ORM
- **Styling:** CSS Modules / Tailwind (TBD based on existing)
- **AI Provider:** OpenAI API (GPT-4o) or Anthropic (Claude 3.5 Sonnet)
- **Auth:** NextAuth.js (GitHub Provider)

### 2.2 Directory Structure (Target)
```
/
├── prisma/               # Database schema
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router pages & API
│   │   ├── api/          # Backend routes (auth, match, upload)
│   │   └── ...           # UI Pages
│   ├── components/       # React Components (migrated from 'New')
│   ├── lib/              # Shared utilities
│   │   ├── ai.ts         # OpenAI/Claude client
│   │   ├── github.ts     # GitHub API client
│   │   └── parser.ts     # Resume/CSV parsers
│   └── types/            # TypeScript definitions
└── ...config files
```

## 3. Core Features

### 3.1 Authentication & User Profile
- **GitHub Login:** OAuth 2.0 integration.
- **Scopes:** `read:user`, `repo` (for private repo analysis).
- **Data Extraction:**
  - **GitHub:** Languages used, commit history, README analysis.
  - **Resume:** PDF/Text parsing to extract hard/soft skills.
  - **Personal Statement:** NLP analysis of user values and goals.

### 3.2 Company Data Ingestion
- **Format:** CSV/Excel uploads.
- **Fields:**
  - Languages/Frameworks (Required & Nice-to-have)
  - Soft Skills (Culture fit)
  - Technical Skills (Architecture, Tools)
  - Unique Identifiers (Perks, Mission)

### 3.3 AI Matching Engine
- **Input:** JSON representation of User Profile vs. Company Profile.
- **Process:**
  - Use LLM to generate embeddings or semantic scores.
  - "Chain of Thought" reasoning for why a match is good/bad.
- **Output:** Match percentage, key strengths, potential gaps.

## 4. Migration & Cleanup Plan
1.  **Consolidate:** Move UI components from `github-matcher-nextjs New` to `src/components`.
2.  **Refactor:** Convert JavaScript components to TypeScript.
3.  **Backend:** enhance `src/lib/matcher.ts` and `src/app/api` to support the new data flows.
4.  **Cleanup:** Delete legacy folders (`github-matcher-nextjs`, `github-matcher-nextjs Company`, `github-matcher-nextjs New`).

## 5. Environment Variables
- `DATABASE_URL`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `NEXTAUTH_SECRET`
