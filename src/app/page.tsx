'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { CompanyMatch } from '@/types';
import Image from 'next/image';
import { generatePortfolioPDF } from '@/lib/pdf';

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
  const [githubProfile, setGithubProfile] = useState<any>(null);

  // Preferences State
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [excludedIds, setExcludedIds] = useState<number[]>([]);

  // Fetch available companies
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

  // Sync GitHub Profile
  useEffect(() => {
    const fetchProfile = async () => {
      // @ts-ignore
      const username = session?.user?.username || session?.user?.name;
      if (username) {
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          setGithubProfile(data);
        } catch (e) {
          console.error("Failed to fetch profile", e);
        }
      }
    };
    if (session) fetchProfile();
  }, [session]);

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
    // @ts-ignore
    const username = session?.user?.username || session?.user?.name;
    if (!username) {
      signIn('github');
      return;
    }
    
    setIsLoading(true);
    setMatches([]);
    setActiveStep(1);

    try {
      await new Promise(r => setTimeout(r, 1200));
      setActiveStep(2);

      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, 
          statement,
          resumeText,
          excludedCompanyIds: excludedIds,
          preferredIndustries,
          additionalContext
        })
      });
      
      const data = await res.json();
      
      await new Promise(r => setTimeout(r, 1500));
      setActiveStep(3);

      if (Array.isArray(data)) {
        setMatches(data);
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      await new Promise(r => setTimeout(r, 800));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setActiveStep(0);
    }
  };

  const handleDownloadPDF = () => {
    if (!githubProfile) return;
    const userData = {
      ...githubProfile,
      statement,
      // @ts-ignore
      username: session?.user?.username || session?.user?.name
    };
    generatePortfolioPDF(userData, matches);
  };

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

  return (
    <main className="min-h-screen relative bg-[#0a0a0c]">
      
      {/* LOADING OVERLAY (Runtime Status) */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0c]/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-basely-navy border border-gray-800 rounded-lg p-10 font-mono shadow-2xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
                <h3 className="text-white font-bold tracking-widest uppercase text-sm">Processing_Signal</h3>
             </div>
             
             <div className="space-y-6">
                <div className={`flex items-center gap-4 transition-all duration-500 ${activeStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
                   <span className="text-cyan-500 text-xs">01</span>
                   <span className="text-gray-300 text-xs uppercase tracking-widest">Scanning_Distributed_Nodes</span>
                   {activeStep === 1 && <div className="ml-auto w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <div className={`flex items-center gap-4 transition-all duration-500 ${activeStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>
                   <span className="text-cyan-500 text-xs">02</span>
                   <span className="text-gray-300 text-xs uppercase tracking-widest">Normalizing_Technical_Signal</span>
                   {activeStep === 2 && <div className="ml-auto w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <div className={`flex items-center gap-4 transition-all duration-500 ${activeStep >= 3 ? 'opacity-100' : 'opacity-20'}`}>
                   <span className="text-cyan-500 text-xs">03</span>
                   <span className="text-gray-300 text-xs uppercase tracking-widest">Generating_Match_Profiles</span>
                   {activeStep === 3 && <div className="ml-auto w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
             </div>

             <div className="mt-12 pt-8 border-t border-gray-800">
                <div className="flex justify-between text-[10px] text-gray-500 mb-2 font-mono">
                   <span>SUBJECT_TOKEN</span>
                   {/* @ts-ignore */}
                   <span className="text-white truncate max-w-[150px]">{session?.user?.username || session?.user?.name}</span>
                </div>
                <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-cyan-500 transition-all duration-500" 
                    style={{ width: `${(activeStep / 3) * 100}%` }}
                   />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ORIGINAL BRANDING HEADER */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <Image src="/BaselyLogo.png" alt="Basely Logo" width={32} height={32} className="rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
        <div className="flex flex-col leading-none">
          <span className="text-[#fafafa] font-bold text-lg tracking-tight">Basely</span>
          <span className="text-cyan-400 font-mono text-[10px] tracking-[0.2em] uppercase font-bold opacity-80">Connect</span>
        </div>
      </div>

      {/* ORIGINAL AUTH ACTION (Top Right) */}
      <div className="absolute top-8 right-8 z-20">
        {session ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[#fafafa] text-xs font-medium">{session.user?.name}</span>
              <button onClick={() => signOut()} className="text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-widest font-bold font-mono">Disconnect</button>
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
            className="px-6 py-2.5 rounded bg-basely-navy border border-basely-orange/20 hover:border-basely-orange/50 transition-all text-[#fafafa] text-xs font-bold uppercase tracking-widest font-mono"
          >
            Connect Identity
          </button>
        )}
      </div>

      <div className="container mx-auto px-6">
        
        {/* ORIGINAL HERO SECTION */}
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
            <div className="grid md:grid-cols-2 gap-8 text-left w-full">
              
              {/* NEW SECTION 01: YOUR PROFILE (Replacing Ingestion) */}
              <div className="bg-basely-navy/30 border border-basely-orange/15 rounded-lg p-1 overflow-hidden group hover:border-basely-orange/40 transition-all min-h-[500px]">
                <div className="bg-basely-dark rounded p-8 h-full flex flex-col">
                  <h3 className="text-white font-bold mb-8 flex items-center gap-3">
                    <span className="text-basely-orange font-mono text-sm">01</span>
                    Your Profile
                  </h3>

                  {!session ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
                      <p className="text-xs text-gray-500 font-mono leading-relaxed">Connect your GitHub identity to automatically populate your technical profile.</p>
                      <button onClick={() => signIn('github')} className="px-6 py-3 bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded hover:bg-basely-orange hover:text-white transition-all font-mono">
                        Sync Identity
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                       {githubProfile ? (
                         <div className="animate-fadeIn space-y-6">
                            <div className="flex items-center gap-4">
                               <div className="flex-1">
                                  <h4 className="text-lg font-bold text-white">{githubProfile.name}</h4>
                                  <p className="text-xs text-gray-500 font-mono uppercase tracking-tighter">{githubProfile.location || 'Global Citizen'}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-2xl font-bold text-basely-orange">{githubProfile.totalRepos}</p>
                                  <p className="text-[9px] text-gray-600 font-mono uppercase">Repos</p>
                               </div>
                            </div>

                            <div>
                               <label className="block text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-3">Top Signal Overlap</label>
                               <div className="flex flex-wrap gap-2">
                                  {githubProfile.languages?.slice(0, 6).map((l: string) => (
                                    <span key={l} className="px-2 py-1 bg-basely-navy/50 border border-gray-800 rounded text-[10px] font-mono text-gray-400">{l}</span>
                                  ))}
                               </div>
                            </div>

                            <div>
                               <label className="block text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">Resume Artifact (.txt)</label>
                               <div className="relative group/upload">
                                  <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                  <div className={`p-3 border border-dashed rounded flex items-center gap-3 transition-all ${fileName ? 'border-basely-orange bg-basely-orange/5' : 'border-gray-800 bg-black/20 group-hover:border-basely-orange/50'}`}>
                                     <span className="text-sm">📄</span>
                                     <span className="text-[10px] text-gray-400 font-mono truncate">{fileName || "SELECT_SOURCE"}</span>
                                  </div>
                               </div>
                            </div>

                            <div>
                               <label className="block text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">Intent Statement</label>
                               <textarea 
                                 value={statement}
                                 onChange={(e) => setStatement(e.target.value)}
                                 placeholder="// Seeking low-latency infra roles..."
                                 className="w-full bg-black/40 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 focus:outline-none focus:border-basely-orange transition-all h-24 resize-none font-mono"
                               />
                            </div>
                         </div>
                       ) : (
                         <div className="py-20 flex flex-col items-center gap-4 opacity-50">
                            <div className="w-6 h-6 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-mono uppercase tracking-widest">Parsing_Distributed_Nodes</p>
                         </div>
                       )}
                    </div>
                  )}

                  <button 
                    onClick={handleMatch}
                    disabled={isLoading || !session}
                    className="mt-6 w-full py-4 bg-basely-orange hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold text-xs tracking-widest uppercase rounded shadow-[0_0_15px_rgba(255,107,53,0.3)] transition-all flex items-center justify-center gap-3 font-mono"
                  >
                    Compute Affinity Score
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* NEW SECTION 02: SEARCH PREFERENCES (Replacing Status) */}
              <div className="bg-basely-navy/30 border border-gray-800 rounded-lg p-8 relative overflow-hidden font-mono flex flex-col min-h-[500px]">
                <h3 className="text-white font-bold mb-8 flex items-center gap-3">
                  <span className="text-cyan-400 text-sm">02</span>
                  Search Preferences
                </h3>
                
                <div className="space-y-8 flex-1">
                  <div>
                    <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-3">Industry Focus</label>
                    <div className="flex flex-wrap gap-2">
                       {['FinTech', 'Quant', 'AI/ML', 'Cloud', 'Crypto', 'SWE'].map(ind => (
                         <button 
                          key={ind}
                          onClick={() => setPreferredIndustries(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind])}
                          className={`px-3 py-1.5 rounded border text-[10px] transition-all ${preferredIndustries.includes(ind) ? 'bg-cyan-500 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                         >
                           {ind}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-3">Excluded Nodes</label>
                    <div className="bg-black/40 border border-gray-800 rounded-lg p-3 flex-1 overflow-y-auto custom-scrollbar">
                       <div className="grid grid-cols-1 gap-1.5">
                          {availableCompanies.map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => setExcludedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                              className={`text-[9px] p-2 rounded border text-left truncate transition-colors ${excludedIds.includes(c.id) ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}
                            >
                              {excludedIds.includes(c.id) ? '[-] ' : '[+] '}{c.name}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-[10px] text-gray-600 leading-relaxed italic">
                      // Neural engine will filter results based on selected technical sectors and excluded organizational nodes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] hover:text-cyan-400 transition-colors border-b border-transparent hover:border-cyan-400/30 pb-1 mt-8"
            >
              {showPreview ? "Hide_Available_Companies" : "Preview_Available_Companies"}
            </button>
          </div>
        </section>

        {/* PREVIEW GRID */}
        {showPreview && !isLoading && (
          <section className="pb-20 animate-slideUp">
            <div className="flex items-center gap-4 mb-10">
              <h3 className="font-mono text-xs text-cyan-400 uppercase tracking-widest whitespace-nowrap">Available Companies</h3>
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
                <p className="text-gray-600 text-sm italic">Primary affinity nodes identified within the sector</p>
              </div>
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded text-[10px] font-mono text-cyan-500 hover:border-cyan-500/50 transition-all uppercase tracking-widest"
               >
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 Export PDF
               </button>
            </div>

            <div className="grid gap-6">
              {matches.map((company, index) => (
                <MatchCard key={company.id} company={company} index={index} />
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

function MatchCard({ company, index }: { company: CompanyMatch; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group relative bg-basely-navy/20 border border-gray-800 hover:border-basely-orange/40 rounded-lg overflow-hidden transition-all duration-300 animate-slideUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col md:flex-row">
        {/* Score Bar */}
        <div className="md:w-1.5 bg-gray-800 group-hover:bg-basely-orange/20 transition-colors relative font-mono">
          <div
            className="absolute top-0 left-0 w-full bg-basely-orange shadow-[0_0_15px_rgba(255,107,53,0.5)] transition-all duration-1000"
            style={{ height: `${company.matchScore}%` }}
          />
        </div>

        <div className="flex-1 p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded bg-basely-navy flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-all border border-gray-800">
                {company.logo}
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white group-hover:text-basely-orange transition-colors mb-1">
                  {company.name}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-basely-orange uppercase tracking-widest bg-basely-orange/5 px-2 py-0.5 rounded border border-basely-orange/10">
                    {company.industry}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                    Aptitude_Target
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="text-4xl font-black text-white leading-none mb-1 group-hover:text-glow transition-all font-mono italic">
                {company.matchScore}%
              </div>
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest font-bold">
                Affinity_Index
              </span>
            </div>
          </div>

          <div className="mb-8 border-l border-gray-800 pl-6 py-1 group-hover:border-basely-orange/30 transition-all font-mono">
            <p className={`text-gray-400 text-sm leading-relaxed font-light italic transition-all ${expanded ? '' : 'line-clamp-4'}`}>
              &quot;{company.matchReason}&quot;
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest hover:text-cyan-300 focus:outline-none"
            >
              {expanded ? '[-] Show_Less' : '[+] Expand_Analysis'}
            </button>
          </div>

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
  );
}
