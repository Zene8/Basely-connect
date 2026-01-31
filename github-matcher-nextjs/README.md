# GitMatch - GitHub to Company Matcher

A sleek, dark-mode web application that matches GitHub profiles with companies based on skills, technologies, and contribution patterns.

## Features

- **GitHub Profile Analysis**: Enter a GitHub username or URL to analyze
- **Company Matching**: Get matched with companies based on your tech stack
- **Beautiful Dark UI**: Modern, terminal-inspired design with glass morphism effects
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Animated Interactions**: Smooth transitions and micro-interactions

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
│   ├── page.js              # Main page component
│   └── page.module.css      # Page-specific styles
├── components/
│   ├── Navbar.js            # Navigation bar
│   ├── Hero.js              # Hero section with input
│   ├── HowItWorks.js        # How it works section
│   ├── HowCard.js           # Feature card component
│   ├── Results.js           # Results display
│   ├── CompanyCard.js       # Company match card
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

## Building for Production

```bash
npm run build
npm start
```

## Customization

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

### Mock Data
Replace the `mockCompanies` array in `components/Results.js` with real API data when your backend is ready.

## Next Steps (Backend Integration)

When you're ready to add a backend:

1. Create an API route in `app/api/analyze/route.js`
2. Replace the `handleAnalyze` function in `app/page.js` to call your API
3. Connect to GitHub's API to fetch user data
4. Implement your matching algorithm

## License

MIT
