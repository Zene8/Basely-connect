'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './Results.module.css';
import CompanyMatchCard from './CompanyMatchCard';
import { Company, GitHubAnalysis } from '@/types';

interface ResultsProps {
  githubUrl: string;
  companies: Company[];
  onReset: () => void;
}

const analyzeGitHubProfile = async (username: string): Promise<GitHubAnalysis> => {
  const cleanUsername = username.replace('https://github.com/', '').replace('/', '');
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        languages: [],
        frameworks: [],
        skills: [],
        totalRepos: 0,
        totalContributions: 0,
        topRepoStars: 0,
        error: data.error || 'Failed to analyze profile'
      };
    }

    return data;
  } catch (error) {
    return {
      languages: [],
      frameworks: [],
      skills: [],
      totalRepos: 0,
      totalContributions: 0,
      topRepoStars: 0,
      error: 'Failed to connect to analysis service'
    };
  }
};

export default function Results({ githubUrl, companies, onReset }: ResultsProps) {
  const [analysis, setAnalysis] = useState<GitHubAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeGitHubProfile(githubUrl).then(data => {
      setAnalysis(data);
      setLoading(false);
    });
  }, [githubUrl]);

  const matchedCompanies = useMemo(() => {
    if (!analysis) return [];

    return companies.map(company => {
      const attrs = company.attributes;
      
      const langMatch = attrs.languages.length > 0
        ? attrs.languages.filter(l => analysis.languages.includes(l)).length / attrs.languages.length
        : 0;
      
      const fwMatch = attrs.frameworks.length > 0 
        ? attrs.frameworks.filter(f => analysis.frameworks.includes(f)).length / attrs.frameworks.length
        : 0;
      
      const skillMatch = attrs.skills.length > 0
        ? attrs.skills.filter(s => analysis.skills.includes(s)).length / attrs.skills.length
        : 0;
      
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

  if (loading || !analysis) {
    return (
      <main className={styles.results}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <h2 className={styles.loadingTitle}>Analyzing Profile...</h2>
          <p className={styles.loadingText}>Fetching data from GitHub</p>
        </div>
      </main>
    );
  }

  if (analysis.error) {
    return (
      <main className={styles.results}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Error</h2>
            <p className={styles.subtitle}>{analysis.error}</p>
          </div>
          <button onClick={onReset} className={styles.resetButton}>
            ← Try another profile
          </button>
        </div>
      </main>
    );
  }

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

      <div className={styles.analysisSummary}>
        <h3 className={styles.summaryTitle}>Profile Analysis</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>⟨/⟩</span>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Languages Detected</span>
              <div className={styles.summaryTags}>
                {analysis.languages.length > 0 ? (
                  analysis.languages.map(lang => (
                    <span key={lang} className={styles.summaryTag}>{lang}</span>
                  ))
                ) : (
                  <span className={styles.summaryTag}>No languages detected</span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>◈</span>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Frameworks & Tools</span>
              <div className={styles.summaryTags}>
                {analysis.frameworks.length > 0 ? (
                  analysis.frameworks.map(fw => (
                    <span key={fw} className={styles.summaryTag}>{fw}</span>
                  ))
                ) : (
                  <span className={styles.summaryTag}>Inferred from languages</span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.summaryStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{analysis.totalRepos}</span>
              <span className={styles.statLabel}>Repositories</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{Math.round(analysis.totalContributions / 1000)}k</span>
              <span className={styles.statLabel}>Total Size (KB)</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{analysis.topRepoStars}</span>
              <span className={styles.statLabel}>Top Stars</span>
            </div>
          </div>
        </div>
      </div>

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
