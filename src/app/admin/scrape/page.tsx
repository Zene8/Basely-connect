// src/app/admin/scrape/page.tsx
'use client';

import { useState } from 'react';

interface SubPageData {
  url: string;
  title: string;
  content: string;
}

interface ScrapeResult {
  name: string;
  url: string;
  languages: string[];
  frameworks: string[];
  skills: string[];
  qualities: string[];
  description: string;
  culture: string;
  lookingFor: string;
  teams: string[];
  programs: string[];
  benefits: string[];
  locations: string[];
  subPages: SubPageData[];
}

export default function ScrapePage() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deepScrape, setDeepScrape] = useState(true);

  const handleScrape = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const urlList = urls.split('\n').map(u => u.trim()).filter(u => u.length > 0);

      if (urlList.length === 0) {
        setError('Please enter at least one URL');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList, deep: deepScrape }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scraping failed');
      setResults(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const TagSection = ({ title, tags, colorClass }: { title: string; tags: string[]; colorClass: string }) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest mb-1.5">{title}</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className={`px-2 py-0.5 rounded border text-[10px] font-mono ${colorClass}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const TextSection = ({ title, text }: { title: string; text: string }) => {
    if (!text) return null;
    return (
      <div className="mb-4 p-3 bg-[#0f0f11] rounded-lg">
        <div className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest mb-1">{title}</div>
        <p className="text-sm text-[#a1a1aa] leading-relaxed">{text}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔍 Comprehensive Career Scraper</h1>
        <p className="text-[#71717a] mb-8">
          Extract everything from career pages - follows subpages, gets all details
        </p>

        {/* Input Section */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-8">
          <label className="block text-sm font-medium mb-2">Career Page URLs (one per line)</label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={`https://www.mwam.com/join-us/\nhttps://optiver.com/working-at-optiver/\nhttps://stripe.com/jobs`}
            className="w-full h-32 bg-[#09090b] border border-[#27272a] rounded-lg p-4 text-sm font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
          />

          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deepScrape}
                onChange={(e) => setDeepScrape(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-[#a1a1aa]">Deep scrape (follow subpages: teams, graduates, internships)</span>
            </label>

            <button
              onClick={handleScrape}
              disabled={loading}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Scraping...
                </>
              ) : (
                'Start Scraping'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Quick Add */}
        <div className="mb-8 p-4 bg-[#18181b] border border-[#27272a] rounded-xl flex gap-4 items-center">
          <span className="text-sm text-[#71717a]">Quick add:</span>
          <button
            onClick={() => setUrls(`https://www.mwam.com/join-us/
https://www.gresearch.com/join-us/
https://careers.imc.com/
https://optiver.com/working-at-optiver/
https://bendingspoons.com/careers`)}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            Trading/Quant firms
          </button>
          <button
            onClick={() => setUrls(`https://stripe.com/jobs
https://www.figma.com/careers/
https://vercel.com/careers
https://linear.app/careers`)}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            Tech startups
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Results ({results.length} companies)</h2>

            {results.map((company, index) => (
              <div key={index} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[#27272a] bg-gradient-to-r from-cyan-500/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-cyan-400">{company.name}</h3>
                      <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#71717a] hover:text-white">
                        {company.url} ↗
                      </a>
                    </div>
                    <div className="text-right text-xs text-[#52525b]">
                      {company.subPages?.length > 0 && (
                        <div className="text-cyan-400">{company.subPages.length + 1} pages scraped</div>
                      )}
                    </div>
                  </div>

                  {company.description && (
                    <p className="mt-4 text-[#a1a1aa] text-sm leading-relaxed">{company.description}</p>
                  )}

                  {/* Locations */}
                  {company.locations && company.locations.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-[10px] text-[#52525b]">📍</span>
                      <div className="flex flex-wrap gap-1.5">
                        {company.locations.map((loc) => (
                          <span key={loc} className="px-2 py-0.5 rounded bg-[#27272a] text-[10px] text-white">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  {/* Left Column - Technical */}
                  <div>
                    <h4 className="text-sm font-bold mb-4 pb-2 border-b border-[#27272a]">💻 Technical Stack</h4>
                    <TagSection title="Languages" tags={company.languages} colorClass="bg-cyan-500/10 border-cyan-500/20 text-cyan-400" />
                    <TagSection title="Frameworks & Tools" tags={company.frameworks} colorClass="bg-purple-500/10 border-purple-500/20 text-purple-400" />
                    <TagSection title="Skills" tags={company.skills} colorClass="bg-green-500/10 border-green-500/20 text-green-400" />
                  </div>

                  {/* Right Column - Culture */}
                  <div>
                    <h4 className="text-sm font-bold mb-4 pb-2 border-b border-[#27272a]">🎯 Culture & Values</h4>
                    <TagSection title="Qualities They Seek" tags={company.qualities} colorClass="bg-orange-500/10 border-orange-500/20 text-orange-400" />
                    <TagSection title="Teams" tags={company.teams} colorClass="bg-blue-500/10 border-blue-500/20 text-blue-400" />
                    <TagSection title="Programs" tags={company.programs} colorClass="bg-yellow-500/10 border-yellow-500/20 text-yellow-400" />
                    <TagSection title="Benefits" tags={company.benefits} colorClass="bg-pink-500/10 border-pink-500/20 text-pink-400" />
                  </div>
                </div>

                {/* Detailed Text Sections */}
                <div className="p-6 border-t border-[#27272a]">
                  <TextSection title="Culture" text={company.culture} />
                  <TextSection title="What They're Looking For" text={company.lookingFor} />

                  {/* Subpages */}
                  {company.subPages && company.subPages.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest mb-2">📄 Subpages Scraped</div>
                      <div className="space-y-2">
                        {company.subPages.map((page, i) => (
                          <details key={i} className="bg-[#0f0f11] rounded-lg">
                            <summary className="p-3 cursor-pointer text-sm text-cyan-400 hover:text-cyan-300">
                              {page.title}
                              <span className="text-[10px] text-[#52525b] ml-2">{page.url.replace(/https?:\/\/[^/]+/, '')}</span>
                            </summary>
                            <div className="p-3 pt-0 text-xs text-[#71717a] max-h-40 overflow-y-auto">
                              {page.content.slice(0, 1000)}...
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
