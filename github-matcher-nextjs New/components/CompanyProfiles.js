'use client';

import { useState } from 'react';
import styles from './CompanyProfiles.module.css';

export default function CompanyProfiles({ companies }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="companies" className={styles.section}>
      <div className={styles.header}>
        <span className={styles.badge}>Partner Companies</span>
        <h2 className={styles.title}>Companies Looking for Talent</h2>
        <p className={styles.subtitle}>
          Each company has defined the specific attributes they&apos;re looking for. 
          Submit your GitHub to see how you match.
        </p>
      </div>

      <div className={styles.grid}>
        {companies.map((company) => (
          <div 
            key={company.id} 
            className={styles.card}
            style={{ '--accent-color': company.color }}
          >
            <div className={styles.cardHeader}>
              <div 
                className={styles.logo}
                style={{ color: company.color }}
              >
                {company.logo}
              </div>
              <div className={styles.companyInfo}>
                <h3 className={styles.companyName}>{company.name}</h3>
                <span className={styles.industry}>{company.industry}</span>
              </div>
            </div>

            <p className={styles.description}>{company.description}</p>

            <div className={styles.attributesPreview}>
              <div className={styles.attributeGroup}>
                <span className={styles.attributeLabel}>Looking for:</span>
                <div className={styles.tags}>
                  {company.attributes.languages.slice(0, 3).map(lang => (
                    <span key={lang} className={styles.tag}>{lang}</span>
                  ))}
                  {company.attributes.languages.length > 3 && (
                    <span className={styles.tagMore}>+{company.attributes.languages.length - 3}</span>
                  )}
                </div>
              </div>
            </div>

            <button 
              className={styles.expandButton}
              onClick={() => toggleExpand(company.id)}
            >
              {expandedId === company.id ? 'Hide Details' : 'View All Attributes'}
              <span className={styles.expandIcon} style={{
                transform: expandedId === company.id ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>↓</span>
            </button>

            {expandedId === company.id && (
              <div className={styles.expandedAttributes}>
                <div className={styles.attributeSection}>
                  <h4 className={styles.sectionTitle}>Languages</h4>
                  <div className={styles.tags}>
                    {company.attributes.languages.map(lang => (
                      <span key={lang} className={styles.tag}>{lang}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.attributeSection}>
                  <h4 className={styles.sectionTitle}>Frameworks & Tools</h4>
                  <div className={styles.tags}>
                    {company.attributes.frameworks.map(fw => (
                      <span key={fw} className={styles.tag}>{fw}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.attributeSection}>
                  <h4 className={styles.sectionTitle}>Key Skills</h4>
                  <div className={styles.tags}>
                    {company.attributes.skills.map(skill => (
                      <span key={skill} className={styles.tag}>{skill}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.attributeRow}>
                  <div className={styles.attributeItem}>
                    <span className={styles.itemLabel}>Experience</span>
                    <span className={styles.itemValue}>{company.attributes.experience}</span>
                  </div>
                  <div className={styles.attributeItem}>
                    <span className={styles.itemLabel}>Ideal Contributions</span>
                    <span className={styles.itemValue}>{company.attributes.contributions}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.cta}>
        <p className={styles.ctaText}>Are you a company looking for talent?</p>
        <button className={styles.ctaButton}>
          Add Your Company
          <span>→</span>
        </button>
      </div>
    </section>
  );
}
