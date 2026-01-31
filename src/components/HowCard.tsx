import styles from './HowCard.module.css';

interface HowCardProps {
  icon: string;
  title: string;
  description: string;
  step: string;
}

export default function HowCard({ icon, title, description, step }: HowCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.step}>{step}</span>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
