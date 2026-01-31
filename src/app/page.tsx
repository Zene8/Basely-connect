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
  const [activeStep, setActiveStep] = useState(0);

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

  const [githubUrl, setGithubUrl] = useState('');

  const handlePublicMatch = (url: string) => {
    setGithubUrl(url);
    runAnalysis(url);
  };

  const handleMatch = async () => {
    if (!session?.user?.name) return;
    runAnalysis();
  };

  const runAnalysis = async (publicUrl?: string) => {
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
          username: session?.user?.name,
          statement,
          resumeText,
          githubUrl: publicUrl || githubUrl,
        })
      });
      
      const data = await res.json();
      
      // Step 2: Analysis (Animation)
      await new Promise(r => setTimeout(r, 1000));
      setActiveStep(3);

      if (Array.isArray(data)) {
        setMatches(data);
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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-cyan-400 text-xs uppercase tracking-[0.3em] animate-pulse">Initializing_System</span>
        </div>
      </div>
    );
  }

  // 2. Main Page
  return (
    <main className="min-h-screen pt-16">
      
      <div className="container mx-auto px-6">
        
        {/* HERO SECTION */}
        <section className="pt-20 pb-32 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold uppercase tracking-widest mb-8 animate-slideUp">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Matching Protocol
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1] animate-slideUp">
            Find companies that
            <br />
            <span className="title-gradient">want your skills.</span>
          </h1>
          
          <p className="text-[#a1a1aa] text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed font-light animate-slideUp">
            The next generation of engineering recruitment. Connect your GitHub data and professional profiles to find your perfect semantic match.
          </p>

          {!session ? (
            <div className="relative max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Enter your GitHub repo link to get started"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // @ts-ignore
                    handlePublicMatch(e.target.value);
                  }
                }}
                className="w-full px-6 py-4 bg-[#18181b] border border-[#27272a] rounded-xl text-white placeholder:text-[#52525b] focus:outline-none focus:border-cyan-500/50 transition-all shadow-[0_0_30px_rgba(0,0,0,0.3)]"
              />
              <svg 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 text-left animate-slideUp">
              {/* Input Card */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <span className="text-cyan-400 font-mono text-sm">01</span>
                  Input Parameters
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-2">Resume / CV (Text)</label>
                    <div className="relative group/upload">
                      <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`p-4 border-2 border-dashed rounded-xl flex items-center gap-3 transition-all ${fileName ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-[#27272a] bg-[#09090b] group-hover/upload:border-[#52525b]'}`}>
                        <span className="text-xl text-[#52525b] group-hover/upload:text-cyan-400">📄</span>
                        <span className="text-xs text-[#a1a1aa] truncate">{fileName || "Click to select source file"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-2">Personal Statement</label>
                    <textarea 
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      placeholder="Your career goals and values..."
                      className="w-full h-28 bg-[#09090b] border border-[#27272a] rounded-xl p-4 text-sm text-[#fafafa] focus:outline-none focus:border-cyan-500/50 transition-all resize-none font-light"
                    />
                  </div>

                  <button 
                    onClick={handleMatch}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-[#09090b] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? "PROCESSSING..." : "Run Matching Engine"}
                  </button>
                </div>
              </div>

              {/* Status / Log Card */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8 relative overflow-hidden font-mono">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <span className="text-cyan-400 text-sm">02</span>
                  System Status
                </h3>
                
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
                    <span className="text-[#71717a]">Connection</span>
                    <span className="text-green-400 font-bold tracking-widest">ENCRYPTED</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
                    <span className="text-[#71717a]">Operator</span>
                    <span className="text-[#fafafa]">{session.user?.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
                    <span className="text-[#71717a]">Core Model</span>
                    <span className="text-cyan-400">GPT-4o-Mini</span>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <div className={`flex items-center gap-3 transition-opacity ${activeStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${activeStep >= 1 ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-[#52525b]'}`} />
                      <span className="text-[#a1a1aa]">Scanning repository architecture...</span>
                    </div>
                    <div className={`flex items-center gap-3 transition-opacity ${activeStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${activeStep >= 2 ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-[#52525b]'}`} />
                      <span className="text-[#a1a1aa]">Extracting semantic skill vectors...</span>
                    </div>
                    <div className={`flex items-center gap-3 transition-opacity ${activeStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${activeStep >= 3 ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-[#52525b]'}`} />
                      <span className="text-[#a1a1aa]">Cross-referencing database nodes...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>

        {/* RESULTS GRID */}
        {matches.length > 0 && (
          <section id="results" className="pb-32 max-w-5xl mx-auto scroll-mt-24">
            <div className="flex items-end justify-between mb-12 border-b border-[#27272a] pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Analysis Results</h2>
                <p className="text-[#71717a] text-sm">Top matches based on semantic profile overlap</p>
              </div>
              <div className="text-[#71717a] font-mono text-xs uppercase tracking-widest">
                Nodes Found: {matches.length}
              </div>
            </div>

            <div className="grid gap-6">
              {matches.map((company, index) => (
                <div key={company.id} className="group bg-[#18181b] border border-[#27272a] hover:border-cyan-500/40 rounded-2xl overflow-hidden transition-all duration-300 animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex flex-col md:flex-row">
                    {/* Score Bar */}
                    <div className="md:w-2 bg-[#27272a] group-hover:bg-cyan-500/20 transition-colors relative">
                      <div className="absolute top-0 left-0 w-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ height: `${company.matchScore}%` }} />
                    </div>
                    
                    <div className="flex-1 p-8">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-xl bg-[#27272a] flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            {company.logo}
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">{company.name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                                {company.industry}
                              </span>
                              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">Tier_1_Match</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-4xl font-black text-white leading-none mb-1 group-hover:text-glow transition-all">
                            {company.matchScore}%
                          </div>
                          <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest font-bold">Compatibility_Index</span>
                        </div>
                      </div>

                      <p className="text-[#a1a1aa] text-sm leading-relaxed mb-8 font-light italic border-l-2 border-[#27272a] pl-6 py-1 group-hover:border-cyan-500/30 transition-all">
                        "{company.matchReason}"
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {company.matchedLanguages?.map((skill: string) => (
                          <span key={skill} className="px-3 py-1 rounded-md bg-[#27272a] text-[#fafafa] text-[10px] font-mono uppercase tracking-wider border border-transparent hover:border-cyan-500/30 transition-all">
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

      <footer className="py-20 border-t border-[#27272a]/50 text-center">
        <p className="text-[10px] font-mono text-[#52525b] uppercase tracking-[0.4em]">
          &copy; 2026 // Autonomous_Career_Intelligence
        </p>
      </footer>
    </main>
  );
}
