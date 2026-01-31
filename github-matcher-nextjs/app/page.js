'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Results from '@/components/Results';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleAnalyze = () => {
    if (!githubUrl) return;
    setIsAnalyzing(true);
    setActiveStep(1);
    
    // Simulate analysis steps
    setTimeout(() => setActiveStep(2), 800);
    setTimeout(() => setActiveStep(3), 1600);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2400);
  };

  const handleReset = () => {
    setShowResults(false);
    setGithubUrl('');
    setActiveStep(0);
  };

  return (
    <div className={styles.container}>
      <Navbar />
      
      {!showResults ? (
        <>
          <Hero
            githubUrl={githubUrl}
            setGithubUrl={setGithubUrl}
            isAnalyzing={isAnalyzing}
            activeStep={activeStep}
            onAnalyze={handleAnalyze}
          />
          <HowItWorks />
        </>
      ) : (
        <Results githubUrl={githubUrl} onReset={handleReset} />
      )}
      
      <Footer />
    </div>
  );
}
