import styles from './HowItWorks.module.css';
import HowCard from './HowCard';

export default function HowItWorks() {
  return (
    <section id="how" className={styles.section}>
      <h2 className={styles.title}>How GitMatch Works</h2>
      <div className={styles.grid}>
        <HowCard 
          icon="◇" 
          title="Companies Define Needs" 
          description="Companies specify the exact languages, frameworks, and skills they're looking for in candidates"
          step="01"
        />
        <HowCard 
          icon="⌘" 
          title="Submit Your GitHub" 
          description="Enter your GitHub username and we analyze your repositories, contributions, and coding patterns"
          step="02"
        />
        <HowCard 
          icon="⚡" 
          title="Get Matched" 
          description="Our AI compares your profile against company requirements and shows your best matches"
          step="03"
        />
      </div>
    </section>
  );
}
