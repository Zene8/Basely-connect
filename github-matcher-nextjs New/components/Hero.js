'use client';

import styles from './Hero.module.css';
import GitHubIcon from './GitHubIcon';
import Step from './Step';
import Stat from './Stat';

export default function Hero({ githubUrl, setGithubUrl, isAnalyzing, activeStep, onAnalyze }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onAnalyze();
    }
  };

  return (
    <main className={styles.hero}>
      <div className={styles.badge}>
        <span className={styles.badgeDot} />
        AI-Powered Matching
      </div>
      
      <h1 className={styles.title}>
        Find companies that
        <br />
        <span className={styles.titleGradient}>want your skills.</span>
      </h1>
      
      <p className={styles.subtitle}>
        Companies define the exact candidate attributes they&apos;re looking for. 
        Submit your GitHub and we&apos;ll find the perfect company for you!
      </p>

      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <span className={styles.inputIcon}>
            <GitHubIcon />
          </span>
          <input
            type="text"
            placeholder="Enter your GitHub username or URL"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={styles.input}
            onKeyPress={handleKeyPress}
          />
        </div>
        <button 
          onClick={onAnalyze} 
          className={styles.analyzeButton}
          style={{ opacity: githubUrl ? 1 : 0.5 }}
          disabled={!githubUrl || isAnalyzing}
        >
          {isAnalyzing ? (
            <span className={styles.loadingSpinner} />
          ) : (
            <>
              Find My Matches
              <span className={styles.buttonArrow}>→</span>
            </>
          )}
        </button>
      </div>

      {isAnalyzing && (
        <div className={styles.stepsContainer}>
          <Step number={1} text="Scanning repositories" active={activeStep >= 1} />
          <Step number={2} text="Extracting skills & patterns" active={activeStep >= 2} />
          <Step number={3} text="Matching to companies" active={activeStep >= 3} />
        </div>
      )}

      <div className={styles.stats}>
        <Stat number="100+" label="Developers matched" />
        <Stat number="7" label="Partner companies" />
        <Stat number="94%" label="Match accuracy" />
      </div>
    </main>
  );
}
