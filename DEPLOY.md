# 🚀 Deployment & Testing Guide

## 1. Local Testing
Before deploying, verify everything works on your machine.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Setup Environment**:
    Create a `.env` file and add your `OPENAI_API_KEY` and GitHub credentials.
    **Important**: You must use a PostgreSQL database (e.g., from [Neon](https://neon.tech)) for `DATABASE_URL`.
3.  **Database & Seed**:
    ```bash
    npx prisma db push
    npx prisma db seed
    ```
4.  **Run**:
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000` and test a GitHub profile match.

## 2. Production Deployment (Free Tier)

### Step A: Database (Neon.tech)
1.  Create a free project at [Neon](https://neon.tech).
2.  Get your `DATABASE_URL` (connection string).
3.  Seed your production database from your local terminal:
    ```bash
    # Swap your local .env DATABASE_URL temporarily to the Neon string, then:
    npx prisma db push
    npx prisma db seed
    ```

### Step B: Hosting (Cloudflare Pages)
1.  Push your code to **GitHub**.
2.  In [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3.  **Build Settings**:
    - **Framework Preset**: `Next.js`
    - **Build command**: `npx @cloudflare/next-on-pages@1`
    - **Output directory**: `.vercel/output/static`
4.  **Environment Variables**:
    Add `DATABASE_URL`, `OPENAI_API_KEY`, `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
5.  **Important**: Go to **Settings** > **Functions** > **Compatibility Flags** and add `nodejs_compat`.

### Step C: GitHub OAuth
Update your [GitHub OAuth App](https://github.com/settings/developers) settings:
- **Homepage URL**: `https://your-app.pages.dev`
- **Authorization callback URL**: `https://your-app.pages.dev/api/auth/callback/github`

## 3. Tech Stack Summary
- **Frontend**: Next.js (App Router)
- **AI**: OpenAI `gpt-4o-mini` (Cost-efficient, high quality)
- **Database**: Prisma + Neon (Postgres)
- **Auth**: NextAuth.js