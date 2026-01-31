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
  const [activeStep, setActiveStep] = useState(0);
  const [githubProfile, setGithubProfile] = useState<any>(null);

  // New Preferences State
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [excludedIds, setExcludedIds] = useState<number[]>([]);

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

  // Fetch GitHub Profile when session exists
  useEffect(() => {
    const fetchProfile = async () => {
      // @ts-ignore
      const username = session?.user?.username;
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

  const handleMatch = async () => {
    // @ts-expect-error session user typing mismatch
    const username = session?.user?.username || session?.user?.name;
    if (!username) {
      signIn('github');
      return;
    }

    setIsLoading(true);
    setMatches([]);
    setActiveStep(1);

    try {
      // Step 1: Scanning (Animation)
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

      // Step 2: Analysis (Animation)
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
    <main className="min-h-screen relative bg-[#0a0a0c] text-white">
      
      {/* LOADING OVERLAY */}
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
                <div className="flex justify-between text-[10px] text-gray-500 mb-2">
                   <span>NEURAL_ENGINE</span>
                   <span>GPT-4O-MINI</span>
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

      {/* HEADER */}
      <nav className="fixed top-0 w-full z-40 bg-[#0a0a0c]/50 backdrop-blur-lg border-b border-gray-900 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/BaselyLogo.png" alt="Basely" width={28} height={28} className="rounded" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight">Basely</span>
            <span className="text-cyan-500 font-mono text-[8px] uppercase tracking-widest font-bold">Connect</span>
          </div>
        </div>
        
        <div>
          {session ? (
            <div className="flex items-center gap-4">
               <span className="text-xs text-gray-400 font-mono hidden sm:block">@{ (session.user as any).username }</span>
               <button onClick={() => signOut()} className="w-8 h-8 rounded-full overflow-hidden border border-gray-800 hover:border-cyan-500 transition-colors">
                  <img src={session.user?.image || ''} alt="User" className="w-full h-full object-cover" />
               </button>
            </div>
          ) : (
            <button onClick={() => signIn('github')} className="text-xs font-mono uppercase tracking-widest text-cyan-500 hover:text-white transition-colors">
              [Connect_Identity]
            </button>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-32 pb-20">
        
        {/* TOP SECTION: PROFILE & PREFERENCES */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          
          {/* LEFT: YOUR PROFILE (5/12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-basely-navy/30 border border-gray-800 rounded-xl p-8 h-full">
              <h3 className="text-white font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 text-xs">01</span>
                Your Profile
              </h3>

              {session ? (
                <div className="space-y-6">
                  {githubProfile ? (
                    <div className="animate-fadeIn">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="flex-1">
                             <h4 className="text-lg font-bold">{githubProfile.name}</h4>
                             <p className="text-xs text-gray-500 font-mono">{githubProfile.location || 'Global Citizen'}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-2xl font-bold text-cyan-500">{githubProfile.totalRepos}</p>
                             <p className="text-[10px] text-gray-600 font-mono uppercase">Repositories</p>
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-gray-600 font-mono uppercase mb-2">Top Languages</p>
                            <div className="flex flex-wrap gap-2">
                               {githubProfile.languages?.slice(0, 5).map((l: string) => (
                                 <span key={l} className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-[10px] font-mono text-gray-400">{l}</span>
                               ))}
                            </div>
                          </div>
                          
                          <div className="pt-4">
                            <label className="block text-[10px] text-gray-600 font-mono uppercase mb-2">Professional Intent</label>
                            <textarea 
                              value={statement}
                              onChange={(e) => setStatement(e.target.value)}
                              placeholder="e.g. Seeking high-frequency trading infra roles..."
                              className="w-full bg-black/40 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500 transition-all h-24 resize-none font-mono"
                            />
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-4 opacity-50">
                       <div className="w-6 h-6 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-[10px] font-mono uppercase tracking-widest">Syncing_GitHub_Data</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center space-y-6">
                  <p className="text-xs text-gray-500 font-mono leading-relaxed px-8">Connect your GitHub identity to automatically populate your technical profile.</p>
                  <button onClick={() => signIn('github')} className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-cyan-500 hover:text-white transition-all">
                    Sync Identity
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: SEARCH PREFERENCES (7/12) */}
          <div className="lg:col-span-7">
            <div className="bg-basely-navy/30 border border-gray-800 rounded-xl p-8 h-full">
              <h3 className="text-white font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 text-xs">02</span>
                Search Preferences
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] text-gray-600 font-mono uppercase mb-3">Industry Focus</label>
                    <div className="flex flex-wrap gap-2">
                       {['FinTech', 'Cyber', 'AI', 'Cloud', 'Crypto', 'Quant', 'HealthTech'].map(ind => (
                         <button 
                          key={ind}
                          onClick={() => setPreferredIndustries(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind])}
                          className={`px-3 py-1.5 rounded border text-[10px] font-mono transition-all ${preferredIndustries.includes(ind) ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                         >
                           {ind}
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] text-gray-600 font-mono uppercase mb-2">Exclude Companies</label>
                    <div className="bg-black/40 border border-gray-800 rounded-lg p-3 h-32 overflow-y-auto custom-scrollbar">
                       <div className="grid grid-cols-2 gap-2">
                          {availableCompanies.map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => setExcludedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                              className={`text-[9px] font-mono p-1 rounded border text-left truncate transition-colors ${excludedIds.includes(c.id) ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-gray-800 text-gray-600 hover:border-gray-700'}`}
                            >
                              {excludedIds.includes(c.id) ? '[-] ' : '[+] '}{c.name}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end gap-6">
                   <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                     Our neural engine will cross-reference your GitHub commits, READMEs, and intent against these filters to find the highest semantic match.
                   </p>
                   <button 
                    onClick={handleMatch}
                    disabled={isLoading || !session}
                    className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-3"
                   >
                     Compute Company Matches
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                     </svg>
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION */}
        {matches.length > 0 && (
          <div id="results" className="mt-20 animate-fadeIn">
            <div className="flex items-center justify-between mb-12 border-b border-gray-900 pb-6">
               <div>
                  <h2 className="text-2xl font-bold">Matching Affinity</h2>
                  <p className="text-xs text-gray-500 font-mono mt-1">Nodes identified with high technical resonance</p>
               </div>
               <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded text-[10px] font-mono text-cyan-500 hover:border-cyan-500/50 transition-all uppercase tracking-widest"
               >
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 Export Portfolio PDF
               </button>
            </div>

            <div className="grid gap-6">
              {matches.map((company, idx) => (
                <MatchCard key={company.id} company={company} index={idx} />
              ))}
            </div>
          </div>
        )}

      </div>
      
      <footer className="py-20 border-t border-gray-900 text-center">
        <p className="text-[8px] font-mono text-gray-700 uppercase tracking-[0.5em]">
          Basely.Connect // Neural_Matching_v1.2 // 2026
        </p>
      </footer>
    </main>
  );
}

function MatchCard({ company, index }: { company: CompanyMatch; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group relative bg-basely-navy/20 border border-gray-800 hover:border-cyan-500/40 rounded-lg overflow-hidden transition-all duration-300 animate-slideUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col md:flex-row">
        {/* Score Bar */}
        <div className="md:w-1.5 bg-gray-800 group-hover:bg-cyan-500/20 transition-colors relative">
          <div
            className="absolute top-0 left-0 w-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-1000"
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
                <h4 className="text-2xl font-bold text-white group-hover:text-cyan-500 transition-colors mb-1">
                  {company.name}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
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

          <div className="mb-8 border-l border-gray-800 pl-6 py-1 group-hover:border-cyan-500/30 transition-all">
            <p
              className={`text-gray-400 text-sm leading-relaxed font-light italic transition-all ${expanded ? '' : 'line-clamp-4'
                }`}
            >
              &quot;{company.matchReason}&quot;
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest hover:text-cyan-300 focus:outline-none"
            >
              {expanded ? 'Show_Less' : 'Expand_Analysis'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {company.matchedLanguages?.map((skill: string) => (
              <span
                key={skill}
                className="px-3 py-1 rounded border border-gray-800 text-gray-300 text-[10px] font-mono uppercase tracking-wider bg-basely-dark group-hover:border-cyan-500/20 transition-all"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Apply Button */}
          {/* @ts-ignore */}
          {company.website && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <a
                // @ts-ignore
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-500/90 text-black font-mono text-xs uppercase tracking-widest rounded transition-all shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] group"
              >
                <span>Apply Now</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}