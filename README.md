# Basely Connect 🚀

AI-powered GitHub and portfolio to company matching service. Analyzes your GitHub profile, resume, and personal statement to find the best company matches using semantic AI matching.

## 🌟 Features

- **GitHub Integration**: Analyzes your public/private repos, languages, and contributions
- **AI-Powered Matching**: Uses OpenAI GPT-4o for deep semantic reasoning and high-precision matching
- **Resume Analysis**: Upload your resume for comprehensive skill matching
- **Personal Statement**: Provide context about your career goals
- **Company Database**: Pre-seeded with companies seeking various tech skills
- **Match Scoring**: Get detailed match scores with reasoning and skill alignment
- **Portfolio Export**: Generate professional PDF portfolios with technical evidence

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: NextAuth.js with GitHub OAuth
- **AI**: OpenAI GPT-4o (Reasoning Model)
- **Styling**: TailwindCSS + Custom CSS
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 20+
- npm/yarn/pnpm
- GitHub Account (for OAuth)
- Neon PostgreSQL Database
- OpenAI API Key

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd connect
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `GITHUB_ID`: GitHub OAuth App Client ID
- `GITHUB_SECRET`: GitHub OAuth App Client Secret
- `NEXTAUTH_URL`: `http://localhost:3000` (local) or your production URL
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `OPENAI_API_KEY`: Your OpenAI API key
- `GITHUB_TOKEN`: (Optional) Personal access token for higher rate limits

### 3. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set **Homepage URL**: `http://localhost:3000`
4. Set **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env`

### 4. Database Setup

```bash
# Push schema to database
npx prisma db push

# Seed with sample companies
npx prisma db seed
# OR use the API endpoint: http://localhost:3000/api/seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
connect/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Database seeding script (Excel + JSON)
│   └── migrations/          # Database migrations
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── analyze/     # GitHub analysis
│   │   │   ├── companies/   # Company listing
│   │   │   ├── match/       # AI matching engine
│   │   │   ├── scrape/      # Web scraping endpoint
│   │   │   └── seed/        # Database seeding endpoint
│   │   ├── admin/           # Admin dashboard
│   │   │   └── scrape/      # Career page scraper UI
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   └── Providers.tsx    # NextAuth & Theme providers
│   ├── lib/
│   │   ├── agents.ts       # AI Agent orchestration
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── github.ts       # GitHub API client
│   │   ├── scraper.ts      # Web scraping engine
│   │   ├── parse-resume.ts # PDF/Word resume parser
│   │   ├── pdf.ts          # PDF generation library
│   │   └── prisma.ts       # Prisma client
│   └── types/              # TypeScript definitions
├── public/                 # Static assets
└── ...config files
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
```

## 🌐 API Endpoints

- `POST /api/analyze` - Analyze GitHub profile
- `GET /api/companies` - Get all companies
- `POST /api/match` - Generate AI-powered matches
- `GET /api/seed` - Seed database with sample companies
- `/api/auth/*` - NextAuth endpoints

## 🚢 Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions to Vercel with custom domain.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Remember to:
- Update GitHub OAuth callback URL to production URL
- Set `NEXTAUTH_URL` to production URL
- Run database migrations and seeding in production

## 📝 How It Works

1. **Authentication**: Users sign in with GitHub OAuth
2. **Data Collection**: System fetches GitHub profile, repos, and languages
3. **Analysis**: OpenAI analyzes user's profile against company requirements
4. **Matching**: Heuristic filtering + AI semantic analysis generates match scores
5. **Results**: Users see top matches with detailed reasoning

## 🔐 Security Notes

- Never commit `.env` file
- Keep API keys secure
- Use environment variables for all secrets
- Enable GitHub OAuth app restrictions in production

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ by Basely
