'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Results from '@/components/Results';
import HowItWorks from '@/components/HowItWorks';
import CompanyProfiles from '@/components/CompanyProfiles';
import Footer from '@/components/Footer';

const placeholderCompanies = [
  {
    id: 1,
    name: 'TechFlow',
    logo: '◆',
    color: '#22d3ee',
    industry: 'Developer Tools',
    description: 'Building the future of developer workflows',
    attributes: {
      languages: ['TypeScript', 'Rust', 'Go'],
      frameworks: ['React', 'Next.js', 'Node.js'],
      experience: '3+ years',
      contributions: 'Active open source contributor',
      skills: ['API Design', 'System Design', 'CI/CD'],
    },
  },
  {
    id: 2,
    name: 'DataPulse',
    logo: '◈',
    color: '#a78bfa',
    industry: 'Data & Analytics',
    description: 'Real-time analytics for modern teams',
    attributes: {
      languages: ['Python', 'SQL', 'Scala'],
      frameworks: ['Apache Spark', 'Pandas', 'dbt'],
      experience: '2+ years',
      contributions: 'Data pipeline experience',
      skills: ['Data Modeling', 'ETL', 'Machine Learning'],
    },
  },
  {
    id: 3,
    name: 'CloudNine',
    logo: '◐',
    color: '#34d399',
    industry: 'Cloud Infrastructure',
    description: 'Simplifying cloud deployments',
    attributes: {
      languages: ['Go', 'Python', 'Terraform'],
      frameworks: ['Kubernetes', 'Docker', 'AWS CDK'],
      experience: '4+ years',
      contributions: 'Infrastructure automation',
      skills: ['DevOps', 'Security', 'Networking'],
    },
  },
  {
    id: 4,
    name: 'PixelCraft',
    logo: '▣',
    color: '#f472b6',
    industry: 'Design Tools',
    description: 'Creative tools for designers',
    attributes: {
      languages: ['TypeScript', 'C++', 'JavaScript'],
      frameworks: ['React', 'Electron', 'Canvas API'],
      experience: '3+ years',
      contributions: 'Graphics/UI libraries',
      skills: ['WebGL', 'Performance', 'UI/UX'],
    },
  },
  {
    id: 5,
    name: 'SecureStack',
    logo: '⬡',
    color: '#fb923c',
    industry: 'Cybersecurity',
    description: 'Enterprise security solutions',
    attributes: {
      languages: ['Rust', 'C', 'Python'],
      frameworks: ['Linux Kernel', 'OpenSSL', 'gRPC'],
      experience: '5+ years',
      contributions: 'Security research/tools',
      skills: ['Cryptography', 'Pentesting', 'Compliance'],
    },
  },
];

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [companies] = useState(placeholderCompanies);

  const handleAnalyze = () => {
    if (!githubUrl) return;
    setIsAnalyzing(true);
    setActiveStep(1);
    
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
          <CompanyProfiles companies={companies} />
          <HowItWorks />
        </>
      ) : (
        <Results githubUrl={githubUrl} companies={companies} onReset={handleReset} />
      )}
      
      <Footer />
    </div>
  );
}
