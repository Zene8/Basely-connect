import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⬡</span>
        <span className={styles.logoText}>GitMatch</span>
      </div>
      <div className={styles.navLinks}>
        <a href="#companies" className={styles.navLink}>Companies</a>
        <a href="#how" className={styles.navLink}>How it works</a>
        <button className={styles.navButtonOutline}>For Employers</button>
        <button className={styles.navButton}>Sign In</button>
      </div>
    </nav>
  );
}
