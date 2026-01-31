import styles from './HowItWorks.module.css';
import HowCard from './HowCard';

export default function HowItWorks() {
  return (
    <section id="how" className={styles.section}>
      <h2 className={styles.title}>How GitMatch Works</h2>
      <div className={styles.grid}>
        <HowCard 
          icon="⌘" 
          title="Connect GitHub" 
          description="Simply paste your GitHub username or profile URL to get started"
          step="01"
        />
        <HowCard 
          icon="◎" 
          title="AI Analysis" 
          description="Our algorithms analyze your repos, languages, and contribution patterns"
          step="02"
        />
        <HowCard 
          icon="⚡" 
          title="Get Matched" 
          description="Receive personalized company matches based on your unique profile"
          step="03"
        />
      </div>
    </section>
  );
}
