'use client';

import { useMemo } from 'react';
import styles from './Results.module.css';
import CompanyMatchCard from './CompanyMatchCard';

// Simulated analysis results - in production this would come from your backend
const simulateGitHubAnalysis = () => ({
  languages: ['TypeScript', 'Python', 'Go', 'JavaScript', 'Rust'],
  frameworks: ['React', 'Next.js', 'Node.js', 'FastAPI', 'Docker'],
  skills: ['API Design', 'CI/CD', 'System Design', 'Testing'],
  totalRepos: 47,
  totalContributions: 1243,
  topRepoStars: 156,
});

export default function Results({ githubUrl, companies, onReset }) {
  const analysis = useMemo(() => simulateGitHubAnalysis(), []);

  // Calculate match scores for each company
  const matchedCompanies = useMemo(() => {
    return companies.map(company => {
      const attrs = company.attributes;
      
      // Calculate language match
      const langMatch = attrs.languages.filter(l => 
        analysis.languages.includes(l)
      ).length / attrs.languages.length;
      
      // Calculate framework match
      const fwMatch = attrs.frameworks.filter(f => 
        analysis.frameworks.includes(f)
      ).length / attrs.frameworks.length;
      
      // Calculate skills match
      const skillMatch = attrs.skills.filter(s => 
        analysis.skills.includes(s)
      ).length / attrs.skills.length;
      
      // Overall match (weighted average)
      const overallMatch = Math.round((langMatch * 0.4 + fwMatch * 0.35 + skillMatch * 0.25) * 100);
      
      return {
        ...company,
        matchScore: overallMatch,
        matchedLanguages: attrs.languages.filter(l => analysis.languages.includes(l)),
        matchedFrameworks: attrs.frameworks.filter(f => analysis.frameworks.includes(f)),
        matchedSkills: attrs.skills.filter(s => analysis.skills.includes(s)),
        missingLanguages: attrs.languages.filter(l => !analysis.languages.includes(l)),
        missingFrameworks: attrs.frameworks.filter(f => !analysis.frameworks.includes(f)),
        missingSkills: attrs.skills.filter(s => !analysis.skills.includes(s)),
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [companies, analysis]);

  return (
    <main className={styles.results}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Your Company Matches</h2>
          <p className={styles.subtitle}>
            Based on analysis of <span className={styles.highlight}>{githubUrl}</span>
          </p>
        </div>
        <button onClick={onReset} className={styles.resetButton}>
          ← Analyze another profile
        </button>
      </div>

      {/* Analysis Summary */}
      <div className={styles.analysisSummary}>
        <h3 className={styles.summaryTitle}>Profile Analysis</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>⟨/⟩</span>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Languages Detected</span>
              <div className={styles.summaryTags}>
                {analysis.languages.map(lang => (
                  <span key={lang} className={styles.summaryTag}>{lang}</span>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>◈</span>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Frameworks & Tools</span>
              <div className={styles.summaryTags}>
                {analysis.frameworks.map(fw => (
                  <span key={fw} className={styles.summaryTag}>{fw}</span>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.summaryStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{analysis.totalRepos}</span>
              <span className={styles.statLabel}>Repositories</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{analysis.totalContributions}</span>
              <span className={styles.statLabel}>Contributions</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{analysis.topRepoStars}</span>
              <span className={styles.statLabel}>Top Stars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Company Matches */}
      <div className={styles.matchesSection}>
        <h3 className={styles.matchesTitle}>
          Matched with {matchedCompanies.length} Companies
        </h3>
        <div className={styles.companyGrid}>
          {matchedCompanies.map((company, index) => (
            <CompanyMatchCard key={company.id} company={company} delay={index * 100} />
          ))}
        </div>
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
