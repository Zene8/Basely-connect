import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>GitMatch</span>
        </div>
        <p className={styles.text}>
          © 2025 GitMatch. Find your perfect engineering home.
        </p>
      </div>
    </footer>
  );
}
