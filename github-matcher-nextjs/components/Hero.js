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
        Powered by AI analysis
      </div>
      
      <h1 className={styles.title}>
        Your GitHub.
        <br />
        <span className={styles.titleGradient}>Your perfect match.</span>
      </h1>
      
      <p className={styles.subtitle}>
        We analyze your repositories, contributions, and coding patterns
        to match you with companies that align with your skills and interests.
      </p>

      {/* Input Section */}
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
              Analyze Profile
              <span className={styles.buttonArrow}>→</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Steps */}
      {isAnalyzing && (
        <div className={styles.stepsContainer}>
          <Step number={1} text="Scanning repositories" active={activeStep >= 1} />
          <Step number={2} text="Analyzing tech stack" active={activeStep >= 2} />
          <Step number={3} text="Finding matches" active={activeStep >= 3} />
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        <Stat number="12,000+" label="Developers matched" />
        <Stat number="500+" label="Partner companies" />
        <Stat number="94%" label="Match accuracy" />
      </div>
    </main>
  );
}
