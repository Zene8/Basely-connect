'use client';

import { useState } from 'react';
import styles from './CompanyMatchCard.module.css';
import { CompanyMatch } from '@/types';

interface CompanyMatchCardProps {
  company: CompanyMatch;
  delay: number;
}

export default function CompanyMatchCard({ company, delay }: CompanyMatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getMatchColor = (score: number) => {
    if (score >= 80) return '#34d399';
    if (score >= 60) return '#22d3ee';
    if (score >= 40) return '#fbbf24';
    return '#f87171';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Partial Match';
    return 'Low Match';
  };

  return (
    <div 
      className={styles.card}
      style={{ 
        animationDelay: `${delay}ms`,
        // @ts-ignore - CSS custom properties
        '--match-color': getMatchColor(company.matchScore),
        '--company-color': company.color,
      }}
    >
      <div className={styles.cardMain}>
        <div className={styles.header}>
          <div 
            className={styles.logo}
            style={{ color: company.color }}
          >
            {company.logo}
          </div>
          <div className={styles.info}>
            <h3 className={styles.name}>{company.name}</h3>
            <span className={styles.industry}>{company.industry}</span>
          </div>
          <div className={styles.matchBadge}>
            <span 
              className={styles.matchPercent}
              style={{ color: getMatchColor(company.matchScore) }}
            >
              {company.matchScore}%
            </span>
            <span 
              className={styles.matchLabel}
              style={{ color: getMatchColor(company.matchScore) }}
            >
              {getMatchLabel(company.matchScore)}
            </span>
          </div>
        </div>

        <div className={styles.matchBar}>
          <div 
            className={styles.matchFill}
            style={{ 
              width: `${company.matchScore}%`,
              background: `linear-gradient(90deg, ${getMatchColor(company.matchScore)}, ${company.color})`,
            }}
          />
        </div>

        <div className={styles.quickMatch}>
          <div className={styles.matchGroup}>
            <span className={styles.matchGroupLabel}>Matching:</span>
            <div className={styles.tags}>
              {company.matchedLanguages.slice(0, 3).map(lang => (
                <span key={lang} className={styles.tagMatch}>{lang}</span>
              ))}
              {company.matchedFrameworks.slice(0, 2).map(fw => (
                <span key={fw} className={styles.tagMatch}>{fw}</span>
              ))}
              {(company.matchedLanguages.length + company.matchedFrameworks.length) > 5 && (
                <span className={styles.tagMore}>
                  +{company.matchedLanguages.length + company.matchedFrameworks.length - 5}
                </span>
              )}
              {company.matchedLanguages.length === 0 && company.matchedFrameworks.length === 0 && (
                <span className={styles.noMatch}>No direct matches</span>
              )}
            </div>
          </div>
        </div>

        <button 
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide Details' : 'View Match Details'}
          <span 
            className={styles.expandIcon}
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ↓
          </span>
        </button>
      </div>

      {expanded && (
        <div className={styles.expandedContent}>
          <div className={styles.matchDetails}>
            <div className={styles.detailSection}>
              <h4 className={styles.detailTitle}>
                <span className={styles.checkIcon}>✓</span>
                Languages You Match
              </h4>
              <div className={styles.tags}>
                {company.matchedLanguages.length > 0 ? (
                  company.matchedLanguages.map(lang => (
                    <span key={lang} className={styles.tagMatch}>{lang}</span>
                  ))
                ) : (
                  <span className={styles.noMatch}>No matching languages</span>
                )}
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailTitle}>
                <span className={styles.checkIcon}>✓</span>
                Frameworks You Match
              </h4>
              <div className={styles.tags}>
                {company.matchedFrameworks.length > 0 ? (
                  company.matchedFrameworks.map(fw => (
                    <span key={fw} className={styles.tagMatch}>{fw}</span>
                  ))
                ) : (
                  <span className={styles.noMatch}>No matching frameworks</span>
                )}
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailTitle}>
                <span className={styles.checkIcon}>✓</span>
                Skills You Match
              </h4>
              <div className={styles.tags}>
                {company.matchedSkills.length > 0 ? (
                  company.matchedSkills.map(skill => (
                    <span key={skill} className={styles.tagMatch}>{skill}</span>
                  ))
                ) : (
                  <span className={styles.noMatch}>No matching skills</span>
                )}
              </div>
            </div>

            {(company.missingLanguages.length > 0 || company.missingFrameworks.length > 0) && (
              <div className={styles.detailSection}>
                <h4 className={styles.detailTitleMissing}>
                  <span className={styles.learnIcon}>📚</span>
                  Skills to Learn
                </h4>
                <div className={styles.tags}>
                  {company.missingLanguages.map(lang => (
                    <span key={lang} className={styles.tagMissing}>{lang}</span>
                  ))}
                  {company.missingFrameworks.map(fw => (
                    <span key={fw} className={styles.tagMissing}>{fw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button className={styles.applyButton}>
              Apply to {company.name}
              <span>→</span>
            </button>
            <button className={styles.saveButton}>
              Save for Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
