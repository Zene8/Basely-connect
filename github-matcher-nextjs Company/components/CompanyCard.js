import styles from './CompanyCard.module.css';

export default function CompanyCard({ company, delay }) {
  return (
    <div 
      className={styles.card}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.header}>
        <div 
          className={styles.logo}
          style={{ color: company.color }}
        >
          {company.logo}
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{company.name}</h3>
          <div className={styles.matchBadge}>
            <span className={styles.matchPercent}>{company.match}%</span>
            <span className={styles.matchLabel}>match</span>
          </div>
        </div>
      </div>
      <div className={styles.matchBar}>
        <div 
          className={styles.matchFill}
          style={{ width: `${company.match}%` }}
        />
      </div>
      <div className={styles.tags}>
        {company.tags.map(tag => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
      <button className={styles.viewButton}>
        View Details
        <span style={{ marginLeft: '8px' }}>→</span>
      </button>
    </div>
  );
}
