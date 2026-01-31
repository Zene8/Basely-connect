import styles from './Stat.module.css';

interface StatProps {
  number: string;
  label: string;
}

export default function Stat({ number, label }: StatProps) {
  return (
    <div className={styles.stat}>
      <span className={styles.statNumber}>{number}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
