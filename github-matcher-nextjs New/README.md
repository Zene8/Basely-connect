# GitMatch - GitHub to Company Matcher

A web app that matches GitHub profiles with companies based on the candidate attributes each company is looking for.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Real GitHub API integration - fetches actual repos and languages
- Company profiles with defined candidate requirements
- Match scoring based on languages, frameworks, and skills
- Skills gap analysis showing what to learn

## How It Works

1. Companies define what they're looking for (languages, frameworks, skills)
2. User enters their GitHub username
3. App fetches repos via GitHub API and extracts languages
4. Matching algorithm compares user profile against company requirements
5. Results show match percentages and skill gaps

## Customizing Companies

Edit `placeholderCompanies` in `app/page.js` to add your own companies.
