import styles from './Stat.module.css';

export default function Stat({ number, label }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statNumber}>{number}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
