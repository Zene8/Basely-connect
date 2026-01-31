'use client';

import styles from './Results.module.css';
import CompanyCard from './CompanyCard';

const mockCompanies = [
  { name: 'Vercel', match: 94, logo: '▲', tags: ['React', 'Next.js', 'TypeScript'], color: '#000' },
  { name: 'Stripe', match: 89, logo: '⟐', tags: ['Python', 'Ruby', 'API Design'], color: '#635bff' },
  { name: 'Figma', match: 85, logo: '◈', tags: ['TypeScript', 'WebGL', 'Collaboration'], color: '#a259ff' },
  { name: 'Linear', match: 82, logo: '◐', tags: ['React', 'GraphQL', 'Real-time'], color: '#5e6ad2' },
  { name: 'Notion', match: 78, logo: '▣', tags: ['React', 'Electron', 'Databases'], color: '#fff' },
];

export default function Results({ githubUrl, onReset }) {
  return (
    <main className={styles.results}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Your Top Matches</h2>
          <p className={styles.subtitle}>
            Based on analysis of <span className={styles.highlight}>{githubUrl}</span>
          </p>
        </div>
        <button onClick={onReset} className={styles.resetButton}>
          ← Analyze another profile
        </button>
      </div>

      <div className={styles.companyGrid}>
        {mockCompanies.map((company, index) => (
          <CompanyCard key={company.name} company={company} delay={index * 100} />
        ))}
      </div>

      <div className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h3 className={styles.ctaTitle}>Ready to connect?</h3>
          <p className={styles.ctaText}>
            Create an account to apply directly to your matched companies
          </p>
          <button className={styles.ctaButton}>
            Create Free Account
            <span className={styles.buttonArrow}>→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
