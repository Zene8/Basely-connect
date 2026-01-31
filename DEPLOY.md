# Deployment Guide: Cloudflare Pages + Neon Postgres

This guide walks you through deploying the Connect app for free using Cloudflare Pages (Frontend/Fullstack) and Neon (Database).

## Prerequisites
- GitHub Account
- Cloudflare Account
- Neon (neon.tech) Account

## Step 1: Database Setup (Neon)
1.  Go to [Neon Console](https://console.neon.tech/) and create a new project.
2.  Copy the **Connection String** (e.g., `postgres://user:pass@...`).
3.  Update your local `.env` file to use this string for seeding:
    ```env
    DATABASE_URL="postgres://..."
    ```
4.  Push the schema and seed the data:
    ```bash
    # Create tables in Neon
    npx prisma db push
    
    # Import companies from Excel to Neon
    npx prisma db seed
    ```

## Step 2: Cloudflare Pages Setup
1.  Push your code to a GitHub repository.
2.  Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
3.  Click **Create Application** > **Pages** > **Connect to Git**.
4.  Select your repository.
5.  **Build Settings**:
    - **Framework Preset**: `Next.js`
    - **Build Command**: `npx @cloudflare/next-on-pages@1`
    - **Output Directory**: `.vercel/output/static` (or default if using next-on-pages) -> *Actually, use the defaults provided by the preset, but ensure `nodejs_compat` is enabled.*

6.  **Environment Variables** (in Cloudflare Dashboard):
    Add the following variables:
    - `DATABASE_URL`: Your Neon Connection String.
    - `GITHUB_ID`: Your GitHub OAuth Client ID.
    - `GITHUB_SECRET`: Your GitHub OAuth Client Secret.
    - `NEXTAUTH_SECRET`: A random string.
    - `NEXTAUTH_URL`: Your Cloudflare Pages URL (e.g., `https://connect.pages.dev`).
    - `OPENAI_API_KEY`: Your OpenAI Key.
    - `GOOGLE_AI_KEY`: Your Google Gemini API Key (Optional).

7.  **Compatibility Flags**:
    - Go to **Settings** > **Functions** > **Compatibility Flags**.
    - Add `nodejs_compat`.

## Step 3: Auth Configuration
1.  Go to your [GitHub Developer Settings](https://github.com/settings/developers).
2.  Update your OAuth App's **Authorization callback URL** to match your Cloudflare domain:
    `https://<your-project>.pages.dev/api/auth/callback/github`

## Step 4: Verify
- Visit your Cloudflare URL.
- Log in with GitHub.
- Run a match!

---

## Notes
- **Prisma Adapter**: The project is configured to automatically use the `@prisma/adapter-neon` when a Postgres URL is detected, ensuring compatibility with Cloudflare's serverless environment.
- **Excel Data**: The Excel file data was imported during the seed step. If you update the Excel file, re-run `npx prisma db seed` locally (pointing to the production DB) to update the records.
