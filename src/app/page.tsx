'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { CompanyMatch } from '@/types';

export default function Home() {
  const { data: session, status } = useSession();
  
  // State
  const [statement, setStatement] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [fileName, setFileName] = useState('');

  // Handle File Read
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
       const text = event.target?.result;
       if (typeof text === 'string') setResumeText(text);
    };
    reader.readAsText(file);
  };

  const handleMatch = async () => {
    if (!session?.user?.name) return;
    
    setIsLoading(true);
    setMatches([]);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: session.user.name, 
          statement,
          resumeText
        })
      });
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-basely-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-basely-navy rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-2 border-t-basely-orange border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <span className="font-mono text-basely-orange text-sm animate-pulse tracking-widest">INITIALIZING_SYSTEM...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Hero)
  if (!session) {
    return (
      <main className="min-h-screen bg-basely-dark relative overflow-hidden">
        <Navbar />
        
        {/* Cyberpunk Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A2332_1px,transparent_1px),linear-gradient(to_bottom,#1A2332_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        {/* Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-basely-orange/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 pt-40 pb-20 flex flex-col items-center text-center z-10 relative">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded border border-basely-orange/20 bg-basely-navy/50 backdrop-blur-md mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-basely-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-basely-orange"></span>
            </span>
            <span className="font-mono text-xs text-basely-orange tracking-widest uppercase">System Online</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-basely-orange to-orange-400 text-glow">Perfect Fit</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 font-light leading-relaxed">
            Advanced algorithmic career matching. Connect your GitHub repository data with semantic AI analysis to discover precise opportunities.
          </p>
          
          {/* CTA */}
          <button 
            onClick={() => signIn('github')}
            className="group relative px-8 py-4 bg-basely-orange hover:bg-orange-500 text-white font-bold rounded transform transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,107,53,0.4)]"
          >
            <div className="flex items-center gap-3">
              <span className="uppercase tracking-widest text-sm">Initiate Sequence</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </button>

          {/* Stats Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            {[
              { label: 'Active Nodes', value: '12,402' },
              { label: 'Partner Systems', value: '500+' },
              { label: 'Match Accuracy', value: '98.4%' }
            ].map((stat, i) => (
              <div key={i} className="p-6 border border-basely-navy bg-basely-dark/50 backdrop-blur-sm rounded relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-basely-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="font-mono text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="font-mono text-xs text-basely-orange uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // 3. Authenticated Dashboard
  return (
    <main className="min-h-screen bg-basely-dark pb-20 selection:bg-basely-orange/30 selection:text-white">
      <Navbar />
      
      <div className="container mx-auto px-6 pt-32">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-12 flex items-end justify-between border-b border-basely-navy pb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Operator <span className="text-basely-orange">{session.user?.name}</span>
              </h2>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">
                Session ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2 text-xs font-mono text-basely-orange">
                <span className="w-2 h-2 bg-basely-orange rounded-full animate-pulse"></span>
                AWAITING INPUT
              </div>
            </div>
          </div>

          {/* Input Interface */}
          <div className="relative group bg-basely-navy/30 border border-basely-orange/15 rounded-lg p-1 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-basely-orange/50 to-transparent opacity-50"></div>
            
            <div className="bg-basely-dark rounded p-8 relative z-10">
              <div className="space-y-8">
                {/* Resume Upload */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs font-mono text-basely-orange uppercase tracking-widest">
                    <span>Source Data [Resume]</span>
                    <span className="text-gray-600">.TXT, .MD SUPPORTED</span>
                  </label>
                  
                  <div className="relative group/upload">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full h-32 border border-dashed rounded flex flex-col items-center justify-center gap-3 transition-all duration-300 ${fileName ? 'border-basely-orange bg-basely-orange/5' : 'border-gray-700 bg-basely-navy/20 group-hover/upload:border-basely-orange/50 group-hover/upload:bg-basely-navy/40'}`}>
                      <div className={`p-2 rounded ${fileName ? 'text-basely-orange' : 'text-gray-500 group-hover/upload:text-basely-orange transition-colors'}`}>
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div className="text-center font-mono text-sm">
                        <span className={fileName ? 'text-white' : 'text-gray-400'}>
                          {fileName || "UPLOAD_FILE"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Statement */}
                <div className="space-y-3">
                  <label className="text-xs font-mono text-basely-orange uppercase tracking-widest block">
                    Parameters [Statement]
                  </label>
                  <div className="relative">
                    <textarea
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      className="w-full h-40 bg-basely-navy/20 border border-gray-700 rounded p-4 text-gray-300 font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-basely-orange focus:bg-basely-navy/30 transition-all resize-none"
                      placeholder="// Enter career objectives and cultural preferences..."
                    />
                    <div className="absolute bottom-2 right-2 text-[10px] font-mono text-gray-600">
                      CHARS: {statement.length}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleMatch}
                  disabled={isLoading}
                  className="w-full py-4 bg-basely-orange hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-sm tracking-widest uppercase rounded shadow-[0_0_15px_rgba(255,107,53,0.3)] hover:shadow-[0_0_25px_rgba(255,107,53,0.5)] transition-all active:scale-[0.99]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3 animate-pulse">
                      Processing Data...
                    </span>
                  ) : (
                    'Run Matching Algorithm'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {matches.length > 0 && (
            <div className="mt-16 space-y-8 animate-slideUp">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-grow bg-gradient-to-r from-basely-orange/50 to-transparent"></div>
                <h3 className="font-mono text-sm text-basely-orange uppercase tracking-widest">
                  Analysis Complete: {matches.length} Candidates
                </h3>
              </div>
              
              <div className="grid gap-6">
                {matches.map((company) => (
                  <div 
                    key={company.id}
                    className="group relative bg-basely-navy/20 border border-basely-orange/10 hover:border-basely-orange/40 rounded-lg p-6 transition-all hover:bg-basely-navy/40"
                  >
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                       <div className="absolute top-0 right-0 w-2 h-2 bg-basely-orange/20 group-hover:bg-basely-orange transition-colors"></div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Score Visualization */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[100px]">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="36" stroke="#1A2332" strokeWidth="4" fill="none" />
                            <circle 
                              cx="40" cy="40" r="36" 
                              stroke={company.matchScore >= 80 ? '#FF6B35' : '#CC552A'} 
                              strokeWidth="4" fill="none"
                              strokeDasharray={`${(company.matchScore / 100) * 226} 226`} 
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <span className="text-xl font-bold font-mono text-white">
                            {company.matchScore}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 mt-2 uppercase">Compatibility</span>
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-2xl font-bold text-white group-hover:text-basely-orange transition-colors">
                              {company.name}
                            </h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs font-mono text-gray-400 uppercase bg-basely-navy px-2 py-0.5 rounded">
                                {company.industry}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed font-light">
                          {company.matchReason}
                        </p>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-basely-orange uppercase tracking-widest">Matched Protocols</span>
                          <div className="flex flex-wrap gap-2">
                            {company.matchedLanguages?.map((skill: string) => (
                              <span key={skill} className="px-3 py-1 rounded border border-basely-orange/20 text-white text-xs font-mono bg-basely-orange/5">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}