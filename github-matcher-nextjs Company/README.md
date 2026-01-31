# GitMatch - GitHub to Company Matcher

A sleek, dark-mode web application that matches GitHub profiles with companies based on the specific candidate attributes each company is looking for.

## Concept

Companies define the exact skills, languages, frameworks, and experience they want in candidates. Developers submit their GitHub profiles, and the platform analyzes their repositories to show how well they match each company's requirements.

## Features

- **Company Profiles**: Browse companies and see exactly what attributes they're looking for
- **GitHub Profile Analysis**: Enter a GitHub username to analyze repositories and contributions
- **Detailed Match Scores**: See percentage match with breakdown by languages, frameworks, and skills
- **Skills Gap Analysis**: Identify skills to learn for better matches
- **Beautiful Dark UI**: Modern, terminal-inspired design with glass morphism effects
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: CSS Modules
- **Fonts**: Outfit (display) + JetBrains Mono (code)
- **Animations**: CSS keyframes

## Project Structure

```
github-matcher-nextjs/
├── app/
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.js            # Root layout with background effects
│   ├── page.js              # Main page with state & placeholder companies
│   └── page.module.css      # Page-specific styles
├── components/
│   ├── Navbar.js            # Navigation bar
│   ├── Hero.js              # Hero section with GitHub input
│   ├── CompanyProfiles.js   # Company cards with required attributes
│   ├── HowItWorks.js        # How it works section
│   ├── HowCard.js           # Feature card component
│   ├── Results.js           # Match results with analysis summary
│   ├── CompanyMatchCard.js  # Detailed company match card
│   ├── CompanyCard.js       # Legacy company card (unused)
│   ├── Footer.js            # Footer component
│   ├── Step.js              # Analysis step indicator
│   ├── Stat.js              # Statistics display
│   ├── GitHubIcon.js        # GitHub SVG icon
│   └── *.module.css         # Component styles
├── package.json
├── next.config.js
└── jsconfig.json
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Placeholder Companies

The app includes 5 placeholder companies with defined attributes:

1. **TechFlow** (Developer Tools) - TypeScript, Rust, Go, React, Next.js
2. **DataPulse** (Data & Analytics) - Python, SQL, Scala, Apache Spark
3. **CloudNine** (Cloud Infrastructure) - Go, Python, Terraform, Kubernetes
4. **PixelCraft** (Design Tools) - TypeScript, C++, WebGL, React
5. **SecureStack** (Cybersecurity) - Rust, C, Python, Cryptography

## Customization

### Adding Companies
Edit the `placeholderCompanies` array in `app/page.js`:

```javascript
const placeholderCompanies = [
  {
    id: 1,
    name: 'Your Company',
    logo: '◆',
    color: '#22d3ee',
    industry: 'Your Industry',
    description: 'Company description',
    attributes: {
      languages: ['JavaScript', 'Python'],
      frameworks: ['React', 'Django'],
      experience: '2+ years',
      contributions: 'Open source preferred',
      skills: ['API Design', 'Testing'],
    },
  },
  // ...more companies
];
```

### Colors
Edit the CSS variables in `app/globals.css`:
```css
:root {
  --bg-primary: #09090b;
  --accent-cyan: #22d3ee;
  --accent-purple: #a78bfa;
  /* ... */
}
```

## Backend Integration

When you're ready to add a backend:

1. **GitHub Analysis API**: Create `app/api/analyze/route.js`
   - Connect to GitHub API to fetch user data
   - Analyze repositories, languages, and contributions
   - Return structured profile data

2. **Company Management API**: Create `app/api/companies/route.js`
   - CRUD operations for company profiles
   - Store company attribute requirements

3. **Matching Algorithm**: Implement in Results component or backend
   - Compare user profile against company requirements
   - Calculate weighted match scores

## License

MIT
