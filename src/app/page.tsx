'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { CompanyMatch, SynthesizedPortfolio, GitHubAnalysis, Company } from '@/types';
import Image from 'next/image';
import { generatePortfolioPDF } from '@/lib/pdf';
import ReactMarkdown from 'react-markdown';

type ViewState = 'landing' | 'onboarding' | 'results';

export default function Home() {
  const { data: session, status } = useSession();

  // Navigation State
  const [view, setView] = useState<ViewState>('landing');
  const [showPartners, setShowPartners] = useState(false);
  const partnersPanelRef = useRef<HTMLDivElement | null>(null);

  // Input State
  const [manualUsername, setManualUsername] = useState('');
  const [personalStatement, setPersonalStatement] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [linkedinFileName, setLinkedinFileName] = useState('');

  // Status/Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [portfolio, setPortfolio] = useState<SynthesizedPortfolio | null>(null);
  const [githubProfile, setGithubProfile] = useState<GitHubAnalysis | null>(null);

  // Preferences State
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [targetSalary, setTargetSalary] = useState(120000);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null); // For Partner Modal

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('onboarding_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.personalStatement) setPersonalStatement(state.personalStatement);
        if (state.preferredIndustries) setPreferredIndustries(state.preferredIndustries);
        if (state.additionalContext) setAdditionalContext(state.additionalContext);
        if (state.excludedIds) setExcludedIds(state.excludedIds);
        if (state.targetSalary) setTargetSalary(state.targetSalary);
        if (state.manualUsername) setManualUsername(state.manualUsername);
        if (state.view === 'onboarding') setView('onboarding');
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    const stateToSave = {
      personalStatement,
      preferredIndustries,
      additionalContext,
      excludedIds,
      targetSalary,
      manualUsername,
      view
    };
    localStorage.setItem('onboarding_state', JSON.stringify(stateToSave));
  }, [personalStatement, preferredIndustries, additionalContext, excludedIds, targetSalary, manualUsername, view]);

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

  // Sync GitHub Profile when session exists
  useEffect(() => {
    const fetchProfile = async () => {
      // @ts-expect-error Session type extension needed
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

  useEffect(() => {
    if (session && manualUsername) {
      setManualUsername('');
    }
  }, [session, manualUsername]);

  useEffect(() => {
    if (showPartners && partnersPanelRef.current) {
      requestAnimationFrame(() => {
        partnersPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [showPartners]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'linkedin') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'cv') setCvFileName(file.name);
    else setLinkedinFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest/resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        if (type === 'cv') setResumeText(data.text);
        else setLinkedinText(data.text);
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleMatch = async () => {
    // @ts-expect-error Session type extension needed
    const username = session?.user?.username || session?.user?.name || (!session ? manualUsername : '');
    const hasGithub = !!username;
    const hasResume = !!resumeText;
    const hasLinkedin = !!linkedinText;
    const hasStatement = personalStatement.trim().length > 10;

    if (!hasGithub && !hasResume && !hasLinkedin && !hasStatement) {
      alert("Please provide at least one source of technical signal.");
      return;
    }

    setIsLoading(true);
    setMatches([]);
    setActiveStep(1);

    try {
      await new Promise(r => setTimeout(r, 1500));
      setActiveStep(2);

      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          resumeText,
          linkedinText,
          statement: personalStatement,
          excludedCompanyIds: excludedIds,
          preferredIndustries,
          additionalContext
        })
      });

      const data = await res.json();

      await new Promise(r => setTimeout(r, 1800));
      setActiveStep(3);

      if (data.matches) {
        setMatches(data.matches);
        setPortfolio(data.portfolio);
        setView('results');
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setActiveStep(0);
    }
  };

  const handleDownloadPDF = () => {
    if (portfolio) {
      generatePortfolioPDF(portfolio, matches);
    } else {
      const userData = {
        ...githubProfile,
        name: githubProfile?.name || session?.user?.name || (!session ? manualUsername : ''),
        statement: personalStatement,
        // @ts-expect-error Session type extension needed
        username: session?.user?.username || session?.user?.name || (!session ? manualUsername : '')
      };
      // Fallback if no synthesized portfolio yet
      const fallbackPortfolio = {
        name: userData.name,
        title: "Technical Candidate",
        summary: userData.bio || "Candidate summary.",
        technicalExpertise: [{ category: "Skills", skills: userData.languages || [] }],
        projectHighlights: [],
        experienceSummary: resumeText || "",
        careerGoals: userData.statement || ""
      };
      generatePortfolioPDF(fallbackPortfolio, matches);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-cyan-400 text-xs uppercase tracking-[0.3em] animate-pulse">Initializing_System</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative bg-[#020203] text-white selection:bg-cyan-500/30 overflow-x-hidden">

      {/* BACKGROUND ELEMENTS */}
      <div className="grid-overlay" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />

      {/* BLOOM FILTERS */}
      <div className="bloom bloom-tr" />
      <div className="bloom bloom-lm" />
      <div className="bloom bloom-br" />
      <div className="bloom bloom-center" />
      <div className="bloom bloom-random" />

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0c]/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-basely-navy/50 border border-gray-800 rounded-2xl p-10 font-mono shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full" />
            <div className="flex items-center gap-6 mb-10 relative">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-bold tracking-[0.2em] uppercase text-sm">Processing Match</h3>
                <span className="text-cyan-500/50 text-[10px] font-mono animate-pulse">SYSTEM_ANALYZING...</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] mb-8">Please wait while we process your match</p>
            <div className="space-y-8 relative">
              <div className={`flex items-center gap-5 transition-all duration-700 ${activeStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-2'}`}>
                <span className="text-cyan-500 text-[10px] w-4">01</span>
                <span className="text-gray-300 text-xs uppercase tracking-[0.2em]">Scanning_Global_Repositories</span>
              </div>
              <div className={`flex items-center gap-5 transition-all duration-700 ${activeStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-2'}`}>
                <span className="text-cyan-500 text-[10px] w-4">02</span>
                <span className="text-gray-300 text-xs uppercase tracking-[0.2em]">Normalizing_Semantic_Matches</span>
              </div>
              <div className={`flex items-center gap-5 transition-all duration-700 ${activeStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-2'}`}>
                <span className="text-cyan-500 text-[10px] w-4">03</span>
                <span className="text-gray-300 text-xs uppercase tracking-[0.2em]">Synthesizing_Affinity_Index</span>
              </div>
            </div>
            <div className="mt-16 pt-8 border-t border-gray-800/50 relative">
              <div className="flex justify-between text-[9px] text-gray-500 mb-3 tracking-widest uppercase">
                <span>Engine: GPT-4o</span>
                <span>Status: ACTIVE</span>
              </div>
              <div className="w-full bg-gray-900/50 h-1.5 rounded-full overflow-hidden border border-gray-800">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out" style={{ width: `${(activeStep / 3) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="absolute top-10 left-10 z-40 flex items-center gap-4 group cursor-pointer" onClick={() => setView('landing')}>
        <div className="flex flex-col leading-none">
          <span className="text-white font-bold text-xl tracking-tight">Basely</span>
          <span className="text-cyan-500 font-mono text-[9px] tracking-[0.3em] uppercase font-black opacity-90">Connect</span>
        </div>
      </div>

      <div className="absolute top-10 right-10 z-40">
        {session ? (
          <div className="flex items-center gap-5 bg-basely-navy/20 border border-gray-800/50 p-1.5 pr-5 rounded-full backdrop-blur-md">
            <Image
              src={session.user?.image || ''}
              alt="Profile"
              width={36}
              height={36}
              className="rounded-full border border-cyan-500/30"
              unoptimized
            />
            <div className="flex flex-col">
              <span className="text-white text-[10px] font-bold tracking-tight">@{(session.user as { username?: string }).username || 'connected'}</span>
              <button onClick={() => signOut()} className="text-[9px] text-gray-500 hover:text-cyan-400 uppercase tracking-widest font-black transition-colors text-left">Disconnect</button>
            </div>
          </div>
        ) : (
          <button onClick={() => signIn('github')} className="px-6 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/50 transition-all text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
            Connect Identity
          </button>
        )}
      </div>

      {/* LANDING VIEW */}
      {view === 'landing' && (
        <section className="min-h-screen relative flex flex-col items-center animate-fadeIn overflow-x-hidden">
          <div className="h-screen flex flex-col items-center justify-center w-full max-w-4xl mx-auto z-10 px-6">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 animate-slideUp">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
              Neural Alignment Protocol v4o
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-[0.9] animate-slideUp text-center">
              The Dev Tool to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-600">De-Noise Hiring.</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed font-light animate-slideUp opacity-80 text-center">
              Basely.Connect cross-references your engineering footprint with high-growth technical teams to find your optimal semantic fit.
            </p>
            <div className="flex flex-col items-center gap-6 animate-slideUp relative z-20">
              <button onClick={() => setView('onboarding')} className="px-10 py-4 bg-white text-black font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(34,211,238,0.3)] uppercase tracking-[0.3em] text-[11px]">
                Initiate Match Sequence
              </button>

              <button
                onClick={() => setShowPartners(!showPartners)}
                className="text-[10px] font-black font-mono text-gray-600 hover:text-cyan-500 uppercase tracking-[0.4em] transition-colors flex items-center gap-2"
              >
                {showPartners ? '// Close' : '// View_Partner_Ecosystem'}
              </button>
            </div>
          </div>

          {/* PARTNER ECOSYSTEM PREVIEW */}
          {showPartners && (
            <div ref={partnersPanelRef} className="w-full max-w-5xl mx-auto px-6 pb-20 animate-slideUp z-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="flex flex-wrap justify-center gap-6 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  {availableCompanies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompany(company)}
                      className="group flex flex-col items-center gap-2 w-20 shrink-0 outline-none"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-cyan-500/50 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300">
                        {company.logo && (company.logo.startsWith('http') || company.logo.startsWith('/')) ? (
                          <Image
                            src={company.logo}
                            alt={company.name}
                            fill
                            className="object-contain p-2"
                          />
                        ) : (
                          <span className="text-3xl">{company.logo || '🏢'}</span>
                        )}
                        {company.compensation && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_5px_cyan]" />
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 group-hover:text-cyan-400 uppercase tracking-tighter truncate w-full text-center transition-colors">
                        {company.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMPANY DETAILS MODAL */}
          {selectedCompany && (
            <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn" onClick={() => setSelectedCompany(null)}>
              <div className="max-w-4xl w-full bg-[#111214] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedCompany(null)} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex flex-col md:flex-row h-[80vh]">
                  {/* SIDEBAR */}
                  <div className="w-full md:w-1/3 bg-black/20 border-r border-gray-800/50 p-8 flex flex-col items-center text-center overflow-y-auto">
                    <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 p-4 relative mb-6">
                      {selectedCompany.logo && (selectedCompany.logo.startsWith('http') || selectedCompany.logo.startsWith('/')) ? (
                        <Image src={selectedCompany.logo} alt={selectedCompany.name} fill className="object-contain p-4" />
                      ) : (
                        <span className="text-6xl flex items-center justify-center h-full">{selectedCompany.logo || '🏢'}</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{selectedCompany.name}</h2>
                    <div className="text-[10px] font-black font-mono text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full mb-6">Verified Partner</div>

                    {selectedCompany.website && (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 transition-all flex items-center justify-center gap-2">
                        <span>Visit Website</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}

                    {selectedCompany.compensation && (
                      <div className="w-full bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
                        <div className="text-[9px] text-cyan-500 uppercase tracking-widest font-black mb-1">Total Compensation</div>
                        <div className="text-lg font-black text-white font-mono">{selectedCompany.compensation}</div>
                      </div>
                    )}

                    <div className="w-full space-y-4 text-left">
                      {selectedCompany.locations && selectedCompany.locations.length > 0 && (
                        <div>
                          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Hubs</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCompany.locations.map((loc: string) => (
                              <span key={loc} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-300 font-mono border border-white/5 flex items-center gap-1">
                                <span>📍</span> {loc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedCompany.roleTypes && selectedCompany.roleTypes.length > 0 && (
                        <div>
                          <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-2">Hiring For</div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCompany.roleTypes.map((role: string) => (
                              <span key={role} className="px-2 py-1 bg-indigo-500/10 rounded text-[10px] text-indigo-300 font-mono border border-indigo-500/20">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                      About the Team
                    </h3>
                    <p className="text-gray-300 leading-relaxed font-light mb-10 text-sm whitespace-pre-wrap">
                      {selectedCompany.description || "A leader in the technology space."}
                    </p>

                    {selectedCompany.benefits && (
                      <div className="bg-black/20 rounded-2xl p-6 border border-gray-800/50">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                          <span>🎁</span> Perks & Benefits
                        </h3>
                        {/* ReactMarkdown is great, but basic text rendering is safer if format varies */}
                        <div className="prose prose-invert prose-sm max-w-none text-gray-400 text-xs leading-loose">
                          <ReactMarkdown>{selectedCompany.benefits}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ONBOARDING VIEW */}
      {view === 'onboarding' && (
        <section className="min-h-screen flex flex-col justify-center px-6 animate-fadeIn pt-32 pb-20">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8 border-b border-gray-800/50 pb-6">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                  Technical Profile
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-2 py-1 rounded border border-cyan-500/20">SETUP_PHASE</span>
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                <span>Signal_Input</span>
                <div className="h-[1px] w-8 bg-gray-800"></div>
                <span>Analysis</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              {/* LEFT COLUMN - INPUTS */}
              <div className="lg:col-span-7 space-y-4 flex flex-col">

                {/* 1. GITHUB & IDENTITY - COMPACT */}
                <div className="bg-basely-navy/20 border border-gray-800/50 rounded-xl p-6 hover:border-cyan-500/20 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] text-cyan-500 border border-white/5 shrink-0">01</div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm mb-4 tracking-tight">Identity Sync</h3>
                      <div className={session ? "grid grid-cols-1" : "grid grid-cols-2 gap-4"}>
                        <div className="space-y-2">
                          {session ? (
                            <div className="w-full bg-cyan-900/10 border border-cyan-500/30 rounded-lg p-3 flex items-center gap-3">
                              <Image
                                src={session.user?.image || ''}
                                alt="GH"
                                width={32}
                                height={32}
                                className="rounded-full border border-cyan-500/30"
                                unoptimized
                              />
                              <div className="overflow-hidden">
                                <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider">Connected</div>
                                <div className="text-xs text-white font-mono truncate">@{(session.user as { username?: string }).username || session.user?.name}</div>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => signIn('github')} className="w-full h-full min-h-[50px] rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                              Connect GitHub
                            </button>
                          )}
                        </div>
                        {!session && (
                          <input
                            type="text"
                            value={manualUsername}
                            onChange={(e) => setManualUsername(e.target.value)}
                            placeholder="manual_username"
                            className="bg-black/40 border border-gray-800 rounded-lg px-4 text-xs font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-gray-700"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DOCUMENT UPLOAD - HORIZONTAL SPLIT */}
                <div className="bg-basely-navy/20 border border-gray-800/50 rounded-xl p-6 hover:border-cyan-500/20 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] text-cyan-500 border border-white/5 shrink-0">02</div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm mb-4 tracking-tight">Document Upload</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* CV */}
                        <label className={`relative flex items-center gap-3 p-4 border border-dashed rounded-lg cursor-pointer transition-all ${cvFileName ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-black/20 border-gray-800 hover:border-gray-600'}`}>
                          <input type="file" onChange={(e) => handleFileUpload(e, 'cv')} className="hidden" />
                          <span className="text-xl opacity-50">📄</span>
                          <div className="overflow-hidden">
                            <div className="text-[10px] font-bold text-white uppercase tracking-wider">{cvFileName ? 'CV_LOADED' : 'UPLOAD CV'}</div>
                            <div className="text-[9px] text-gray-500 font-mono truncate">{cvFileName || 'PDF/TXT Only'}</div>
                          </div>
                        </label>
                        {/* LinkedIn */}
                        <label className={`relative flex items-center gap-3 p-4 border border-dashed rounded-lg cursor-pointer transition-all ${linkedinFileName ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-black/20 border-gray-800 hover:border-gray-600'}`}>
                          <input type="file" onChange={(e) => handleFileUpload(e, 'linkedin')} className="hidden" />
                          <span className="text-xl opacity-50">💼</span>
                          <div className="overflow-hidden">
                            <div className="text-[10px] font-bold text-white uppercase tracking-wider">{linkedinFileName ? 'LI_LOADED' : 'LINKEDIN PDF'}</div>
                            <div className="text-[9px] text-gray-500 font-mono truncate">{linkedinFileName || 'Profile Export'}</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PERSONAL STATEMENT - CONDENSED */}
                <div className="bg-basely-navy/20 border border-gray-800/50 rounded-xl p-6 hover:border-cyan-500/20 transition-all flex-1">
                  <div className="flex items-start gap-4 h-full">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] text-cyan-500 border border-white/5 shrink-0">03</div>
                    <div className="flex-1 w-full h-full flex flex-col">
                      <h3 className="text-white font-bold text-sm mb-4 tracking-tight">Personal Statement</h3>
                      <textarea value={personalStatement} onChange={(e) => setPersonalStatement(e.target.value)} placeholder="Brief technical summary (stack, interests, goals)..." className="w-full bg-black/40 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 transition-all flex-1 min-h-[120px] resize-none font-mono leading-relaxed" />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - PREFERENCES */}
              <div className="lg:col-span-5 flex flex-col h-full">
                <div className="bg-[#111214]/90 border border-gray-800/50 rounded-xl p-6 hover:border-cyan-500/20 transition-all flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center text-[10px] text-cyan-500 border border-cyan-500/10 shrink-0">04</div>
                    <h3 className="text-white font-bold text-sm tracking-tight">Target Parameters</h3>
                  </div>

                  <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                    {/* INDUSTRIES */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      <label className="block text-[9px] text-gray-500 uppercase font-black tracking-widest mb-3">Industry & Domain</label>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 bg-black/20 border border-gray-800/50 rounded-lg p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Quant Trading', 'Hedge Funds', 'AI / ML', 'Software Dev',
                            'FinTech', 'Crypto / Web3', 'Infrastructure', 'Cybersecurity',
                            'DevTools', 'Consumer Tech'
                          ].map(ind => (
                            <button key={ind} onClick={() => setPreferredIndustries(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind])} className={`px-2.5 py-1.5 rounded text-[10px] font-bold border transition-all ${preferredIndustries.includes(ind) ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-black/20 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}`}>
                              {ind}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SALARY */}
                    <div className="shrink-0">
                      <label className="block text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Target Base Salary (GBP)</label>
                      <div className="bg-black/20 border border-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono text-gray-400">£30k</span>
                          <span className="text-sm font-mono text-cyan-400">
                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(targetSalary)}
                          </span>
                          <span className="text-xs font-mono text-gray-400">£300k</span>
                        </div>
                        <input
                          type="range"
                          min={30000}
                          max={300000}
                          step={5000}
                          value={targetSalary}
                          onChange={(e) => setTargetSalary(Number(e.target.value))}
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    </div>

                    {/* CONTEXT */}
                    <div className="shrink-0">
                      <label className="block text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Filters / Notes</label>
                      <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="Ex: Remote only, Series B+, >$180k base..." className="w-full bg-black/40 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 h-16 resize-none font-mono focus:outline-none focus:border-cyan-500/50" />
                    </div>

                    {/* EXCLUDES */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[9px] text-gray-500 uppercase font-black tracking-widest">Exclude Companies</label>
                        <span className="text-[9px] text-cyan-500 font-mono">{excludedIds.length} EXCLUDED</span>
                      </div>
                      <div className="bg-black/40 border border-gray-800 rounded-lg p-2 overflow-y-auto custom-scrollbar flex-1 min-h-[80px]">
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Map(availableCompanies.map(c => [c.name, c])).values()).map(c => (
                            <button key={c.id} onClick={() => setExcludedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} className={`text-[9px] font-mono px-2 py-1 rounded border truncate max-w-[120px] transition-all ${excludedIds.includes(c.id) ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-gray-800 text-gray-600 hover:border-gray-600'}`}>
                              {excludedIds.includes(c.id) ? '✕ ' : '+ '}{c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button onClick={handleMatch} disabled={isLoading} className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-[0.3em] rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 flex items-center justify-center gap-2 mt-auto">
                      <span>Execute Match</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RESULTS VIEW */}
      {view === 'results' && (
        <section className="pt-48 pb-32 px-6 animate-fadeIn">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 border-b border-gray-800/50 pb-12">
              <div className="max-w-2xl">
                <h2 className="text-5xl font-black text-white mb-6 tracking-tight uppercase">Affinity Report</h2>
                <p className="text-gray-500 text-sm font-mono italic">High resonance identified between your footprint and the following companies.</p>
              </div>
              <button onClick={handleDownloadPDF} className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export PDF Portfolio
              </button>
            </div>
            <div className="grid gap-8">
              {matches.map((company, idx) => (
                <MatchCard key={company.id} company={company} index={idx} />
              ))}
            </div>
            <div className="mt-20 text-center">
              <button onClick={() => setView('onboarding')} className="text-[10px] font-black font-mono text-gray-700 uppercase tracking-[0.4em] hover:text-cyan-500">{'//'} Reset_Sequence</button>
            </div>
          </div>
        </section>
      )}

      <footer className="py-20 border-t border-gray-900/50 text-center opacity-40">
        <p className="text-[9px] font-mono text-gray-700 uppercase tracking-[0.5em]">Basely.Connect {'//'} Neural_Alignment_v4o {'//'} 2026</p>
      </footer>
    </main>
  );
}

function MatchCard({ company, index }: { company: CompanyMatch; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="group bg-[#111214]/90 border border-gray-800/50 hover:border-cyan-500/30 rounded-3xl overflow-hidden transition-all duration-500 animate-slideUp" style={{ animationDelay: `${index * 150}ms` }}>
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-2 bg-gray-900/50 relative">
          <div className="absolute top-0 left-0 w-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-all duration-[2000ms] ease-out" style={{ height: `${company.matchScore}%` }} />
        </div>
        <div className="flex-1 p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-black/40 border border-gray-800/50 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                {company.logo && (company.logo.startsWith('http') || company.logo.startsWith('/')) ? (
                  <Image
                    src={company.logo}
                    alt={company.name}
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <span className="text-5xl">{company.logo || '🏢'}</span>
                )}
              </div>
              <div>
                <h4 className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors mb-2 tracking-tight">{company.name}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black font-mono text-cyan-500 uppercase tracking-widest bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">{company.industry}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="text-6xl font-black text-white font-mono italic tracking-tighter">{company.matchScore.toFixed(2)}%</div>
              <span className="text-[10px] font-black font-mono text-gray-700 uppercase tracking-widest">Affinity_Index</span>
            </div>
          </div>
          <div className="mb-10 border-l-2 border-gray-800/50 pl-8 py-2 group-hover:border-cyan-500/20 transition-all font-mono">
            <div className={`text-gray-400 text-sm leading-relaxed font-light italic transition-all prose prose-invert prose-sm max-w-none ${expanded ? '' : 'line-clamp-6'}`}>
              <ReactMarkdown>{company.matchReason}</ReactMarkdown>
            </div>
            {expanded && company.agentEvaluation && (
              <div className="mt-6 space-y-4 animate-fadeIn">
                {company.agentEvaluation.thought && (
                  <div className="p-4 bg-black/40 border border-gray-800 rounded-xl mb-4">
                    <div className="text-[9px] text-cyan-500 uppercase tracking-widest font-black mb-2">Agent Thought Process (ReAct)</div>
                    <div className="text-[10px] text-gray-500 font-mono leading-relaxed whitespace-pre-wrap italic">
                      {company.agentEvaluation.thought}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Technical</div>
                    <div className="text-xl font-black text-white">{((company.agentEvaluation.alignment.technical || 0) * 100).toFixed(2)}%</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Cultural</div>
                    <div className="text-xl font-black text-white">{((company.agentEvaluation.alignment.cultural || 0) * 100).toFixed(2)}%</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Industry</div>
                    <div className="text-xl font-black text-white">{((company.agentEvaluation.alignment.industry || 0) * 100).toFixed(2)}%</div>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-cyan-500 uppercase tracking-widest font-black mb-3">Key Strengths</div>
                  <div className="flex flex-wrap gap-2">
                    {company.agentEvaluation.strengths.map((s: string) => (
                      <span key={s} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setExpanded(!expanded)} className="mt-4 text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-300">{expanded ? '[-] Collapse' : '[+] Expand Analysis'}</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {company.matchedLanguages?.map((skill: string) => (
              <span key={skill} className="px-4 py-1.5 rounded-lg border border-gray-800/50 text-gray-400 text-[10px] font-black font-mono uppercase tracking-widest bg-black/20 group-hover:text-gray-300 transition-all">{skill}</span>
            ))}
          </div>
          {company.website && (
            <div className="mt-10 pt-8 border-t border-gray-800/50 flex justify-end">
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-500 hover:text-black font-black font-mono text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] group/btn">
                <span>Apply Signal</span>
                <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
