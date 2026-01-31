'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { CompanyMatch } from '@/types';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();

  // State
  const [statement, setStatement] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch available companies for preview
  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableCompanies(data);
        }
      })
      .catch(err => console.error("Failed to fetch companies:", err));
  }, []);

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
    // @ts-expect-error session user typing mismatch
    const username = session?.user?.username || session?.user?.name;
    if (!username) return;

    setIsLoading(true);
    setMatches([]);
    setActiveStep(1);

    try {
      // Step 1: Scanning (Animation)
      await new Promise(r => setTimeout(r, 1000));
      setActiveStep(2);

      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          statement,
          resumeText
        })
      });

      const data = await res.json();

      // Step 2: Analysis (Animation)
      await new Promise(r => setTimeout(r, 1000));
      setActiveStep(3);

      if (Array.isArray(data)) {
        setMatches(data);
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }

      // Step 3: Complete
      await new Promise(r => setTimeout(r, 800));

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setActiveStep(0);
    }
  };

  // 1. Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-basely-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-cyan-400 text-xs uppercase tracking-[0.3em] animate-pulse">Initializing_System</span>
        </div>
      </div>
    );
  }

  // 2. Main Page
  return (
    <main className="min-h-screen relative">

      {/* BRANDING HEADER */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <Image src="/BaselyLogo.png" alt="Basely Logo" width={32} height={32} className="rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
        <div className="flex flex-col leading-none">
          <span className="text-[#fafafa] font-bold text-lg tracking-tight">Basely</span>
          <span className="text-cyan-400 font-mono text-[10px] tracking-[0.2em] uppercase font-bold opacity-80">Connect</span>
        </div>
      </div>

      {/* AUTH ACTION (Top Right) */}
      <div className="absolute top-8 right-8 z-20">
        {session ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[#fafafa] text-xs font-medium">{session.user?.name}</span>
              <button onClick={() => signOut()} className="text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-widest font-bold">Disconnect</button>
            </div>
            <img
              src={session.user?.image || ''}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-basely-orange/30 shadow-[0_0_10px_rgba(255,107,53,0.2)]"
            />
          </div>
        ) : (
          <button
            onClick={() => signIn('github')}
            className="px-6 py-2.5 rounded bg-basely-navy border border-basely-orange/20 hover:border-basely-orange/50 transition-all text-[#fafafa] text-xs font-bold uppercase tracking-widest"
          >
            Connect Identity
          </button>
        )}
      </div>

      <div className="container mx-auto px-6">

        {/* HERO SECTION */}
        <section className="pt-40 pb-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-basely-navy/50 border border-basely-orange/20 text-basely-orange text-[11px] font-bold uppercase tracking-widest mb-8 animate-slideUp">
            <span className="w-1.5 h-1.5 rounded-full bg-basely-orange animate-pulse shadow-[0_0_8px_rgba(255,107,53,0.8)]" />
            Matching Protocol v1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1] animate-slideUp">
            The Bridge to Your
            <br />
            <span className="title-gradient">Technical Future.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed font-light animate-slideUp">
            Basely.Connect cross-references your engineering footprint with high-growth technical teams to find your optimal semantic fit.
          </p>

          <div className="flex flex-col items-center gap-6 animate-slideUp">
            {!session ? (
              <button
                onClick={() => signIn('github')}
                className="group relative px-10 py-4 bg-basely-orange hover:bg-orange-500 text-white font-bold rounded transform transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,107,53,0.4)] mx-auto flex items-center gap-3 active:scale-95"
              >
                <span className="uppercase tracking-widest text-sm">Initiate Sequence</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 text-left w-full">
                {/* Input Card */}
                <div className="bg-basely-navy/30 border border-basely-orange/15 rounded-lg p-1 overflow-hidden group hover:border-basely-orange/40 transition-all">
                  <div className="bg-basely-dark rounded p-8">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                      <span className="text-basely-orange font-mono text-sm">01</span>
                      Local Data Ingestion
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Resume Artifact (.txt)</label>
                        <div className="relative group/upload">
                          <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            aria-label="Upload resume file"
                          />
                          <div className={`p-4 border border-dashed rounded flex items-center gap-3 transition-all ${fileName ? 'border-basely-orange bg-basely-orange/5' : 'border-gray-700 bg-basely-navy/20 group-hover/upload:border-basely-orange/50'}`}>
                            <span className="text-xl text-gray-600 group-hover/upload:text-basely-orange">📄</span>
                            <span className="text-xs text-gray-400 font-mono truncate">{fileName || "SELECT_SOURCE_ARTIFACT"}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Intent Statement</label>
                        <textarea
                          value={statement}
                          onChange={(e) => setStatement(e.target.value)}
                          placeholder="// Enter professional objectives..."
                          className="w-full h-28 bg-basely-navy/20 border border-gray-700 rounded p-4 text-sm text-gray-300 focus:outline-none focus:border-basely-orange transition-all resize-none font-mono"
                        />
                      </div>

                      <button
                        onClick={handleMatch}
                        disabled={isLoading}
                        className="w-full py-4 bg-basely-orange hover:bg-orange-500 text-white font-bold text-sm tracking-widest uppercase rounded shadow-[0_0_15px_rgba(255,107,53,0.3)] hover:shadow-[0_0_25px_rgba(255,107,53,0.5)] transition-all disabled:opacity-50"
                      >
                        {isLoading ? "PROCESSING_VECTORS..." : "Compute Affinity Score"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Log Card */}
                <div className="bg-basely-navy/30 border border-gray-800 rounded-lg p-8 relative overflow-hidden font-mono">
                  <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                    <span className="text-cyan-400 text-sm">02</span>
                    Runtime Status
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-600 tracking-tighter">Identity_Confirmed</span>
                      <span className="text-green-400 font-bold tracking-widest">TRUE</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-600 tracking-tighter">Subject_Token</span>
                      <span className="text-white truncate max-w-[150px]">
                        {/* @ts-expect-error session user typing mismatch */}
                        {session.user?.username || session.user?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-600 tracking-tighter">Neural_Engine</span>
                      <span className="text-cyan-400">OpenAI::GPT-5-Mini</span>
                    </div>

                    <div className="pt-4 space-y-3">
                      <div className={`flex items-center gap-3 transition-opacity ${activeStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${activeStep >= 1 ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-gray-700'}`} />
                        <span className="text-gray-400">Scanning_Distributed_Nodes...</span>
                      </div>
                      <div className={`flex items-center gap-3 transition-opacity ${activeStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${activeStep >= 2 ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-gray-700'}`} />
                        <span className="text-gray-400">Normalizing_Technical_Signal...</span>
                      </div>
                      <div className={`flex items-center gap-3 transition-opacity ${activeStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${activeStep >= 3 ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-gray-700'}`} />
                        <span className="text-gray-400">Generating_Matches...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] hover:text-cyan-400 transition-colors border-b border-transparent hover:border-cyan-400/30 pb-1"
            >
              {showPreview ? "Hide_Available_Nodes" : "Preview_Available_Nodes"}
            </button>
          </div>
        </section>

        {/* PREVIEW GRID */}
        {showPreview && !isLoading && (
          <section className="pb-20 animate-slideUp">
            <div className="flex items-center gap-4 mb-10">
              <h3 className="font-mono text-xs text-cyan-400 uppercase tracking-widest whitespace-nowrap">Database Nodes</h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCompanies.map((company) => (
                <div key={company.id} className="p-6 bg-basely-navy/20 border border-gray-800 rounded-lg hover:border-cyan-500/20 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded bg-basely-dark flex items-center justify-center text-xl border border-gray-800 group-hover:border-cyan-500/30 transition-colors">
                      {company.logo}
                    </div>
                    <div>
                      <h4 className="text-[#fafafa] font-bold text-sm group-hover:text-cyan-400 transition-colors">{company.name}</h4>
                      <p className="text-[10px] font-mono text-gray-600 uppercase">{company.industry}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {company.languages?.slice(0, 3).map((lang: string) => (
                      <span key={lang} className="text-[9px] font-mono text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded uppercase">
                        {lang}
                      </span>
                    ))}
                    {company.languages?.length > 3 && (
                      <span className="text-[9px] font-mono text-gray-700 px-1 py-0.5">+{company.languages.length - 3}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RESULTS GRID */}
        {matches.length > 0 && (
          <section id="results" className="pb-32 max-w-5xl mx-auto scroll-mt-24">
            <div className="flex items-end justify-between mb-12 border-b border-basely-navy pb-6 font-mono">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Signal Detected</h2>
                <p className="text-gray-600 text-sm">Primary affinity nodes identified within the sector</p>
              </div>
              <div className="text-basely-orange text-xs uppercase tracking-widest font-bold">
                Nodes: {matches.length}
              </div>
            </div>

            <div className="grid gap-6">
              {matches.map((company, index) => (
                <div key={company.id} className="group relative bg-basely-navy/20 border border-gray-800 hover:border-basely-orange/40 rounded-lg overflow-hidden transition-all duration-300 animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex flex-col md:flex-row">
                    {/* Score Bar */}
                    <div className="md:w-1.5 bg-gray-800 group-hover:bg-basely-orange/20 transition-colors relative">
                      <div className="absolute top-0 left-0 w-full bg-basely-orange shadow-[0_0_15px_rgba(255,107,53,0.5)] transition-all duration-1000" style={{ height: `${company.matchScore}%` }} />
                    </div>

                    <div className="flex-1 p-8">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded bg-basely-navy flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-all border border-gray-800">
                            {company.logo}
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-white group-hover:text-basely-orange transition-colors mb-1">{company.name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-basely-orange uppercase tracking-widest bg-basely-orange/5 px-2 py-0.5 rounded border border-basely-orange/10">
                                {company.industry}
                              </span>
                              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Aptitude_Target</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <div className="text-4xl font-black text-white leading-none mb-1 group-hover:text-glow transition-all font-mono italic">
                            {company.matchScore}%
                          </div>
                          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest font-bold">Affinity_Index</span>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm leading-relaxed mb-8 font-light border-l border-gray-800 pl-6 py-1 group-hover:border-basely-orange/30 transition-all italic">
                        &quot;{company.matchReason}&quot;
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {company.matchedLanguages?.map((skill: string) => (
                          <span key={skill} className="px-3 py-1 rounded border border-gray-800 text-gray-300 text-[10px] font-mono uppercase tracking-wider bg-basely-dark group-hover:border-basely-orange/20 transition-all">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="py-20 border-t border-basely-navy/50 text-center">
        <p className="text-[10px] font-mono text-gray-700 uppercase tracking-[0.4em]">
          &copy; 2026 Basely.Connect // Sector_Authority_Granted
        </p>
      </footer>
    </main>
  );
}
