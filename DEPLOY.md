# 🚀 Deployment Guide (Vercel + Neon + Custom Domain)

This guide deploys to **Vercel** but uses your existing specific domain: `connect.basely.co.uk`.

## 1. Prerequisites
- **GitHub Account**: [Create one](https://github.com/join)
- **Vercel Account**: [Create one](https://vercel.com/signup)
- **Neon Account**: [Create one](https://neon.tech)
- **Cloudflare Access**: Access to `basely.co.uk` DNS.

## 2. Prepare Database (Neon)
1. Log in to [Neon Console](https://console.neon.tech).
2. Create a **New Project**.
3. Copy the **Connection String** (Postgres URL).
   - Ensure it ends with `?sslmode=require`.

## 3. Deployment Steps

### Step A: Push to GitHub
1. Commit your changes:
   ```bash
   git add .
   git commit -m "Ready for production"
   ```
2. Create a new repository on GitHub.
3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step B: Deploy to Vercel
1. Log in to [Vercel](https://vercel.com).
2. **Add New** > **Project** > Import your GitHub repo.
3. **Build & Development Settings** (if asked):
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (Leave empty)
   - **Build Command**: `next build` (Default)
   - **Output Directory**: `.next` (Default)
   - **Install Command**: `npm install` (Default)

4. **Environment Variables**:
   - `DATABASE_URL`: Your Neon Connection String.
   - `OPENAI_API_KEY`: Your OpenAI Key.
   - `GITHUB_ID`: Your GitHub OAuth Client ID.
   - `GITHUB_SECRET`: Your GitHub OAuth Client Secret.
   - `NEXTAUTH_SECRET`: Generate a random string.
   - `NEXTAUTH_URL`: `https://connect.basely.co.uk`
   - `GITHUB_TOKEN`: (Optional) Personal Access Token for higher rate limits.
4. Click **Deploy**.

### Step C: Configure Custom Domain (`connect.basely.co.uk`)
1. Once deployed, go to the Vercel Project Dashboard.
2. Go to **Settings** > **Domains**.
3. Enter `connect.basely.co.uk` and click **Add**.
4. Vercel will show you the required DNS records (usually a CNAME).

### Step D: Update Cloudflare DNS
1. Log in to **Cloudflare**.
2. Select the `basely.co.uk` domain.
3. Go to **DNS** > **Records**.
4. Add a **CNAME** record:
   - **Type**: CNAME
   - **Name**: `connect`
   - **Target**: `cname.vercel-dns.com` (or whatever value Vercel provides).
   - **Proxy Status**: **DNS Only** (Grey Cloud) is recommended for Vercel to handle SSL certificates smoothly.

## 4. Final Updates
1. **Update GitHub OAuth**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers).
   - Update **Homepage URL**: `https://connect.basely.co.uk`
   - Update **Authorization callback URL**: `https://connect.basely.co.uk/api/auth/callback/github`

2. **Seed Production DB**:
   - On your local machine:
   ```bash
   # Powershell
   $env:DATABASE_URL="postgres://..." # Your Neon URL
   npx prisma db push
   npx prisma db seed
   ```