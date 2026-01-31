'use client';

import { useState } from 'react';

interface ScrapeResult {
  name: string;
  url: string;
  languages: string[];
  frameworks: string[];
  skills: string[];
  qualities: string[];
}

export default function ScrapePage() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify({ urls: urlList }),
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

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Career Page Scraper</h1>
        <p className="text-[#71717a] mb-8">Enter company career page URLs to extract skills</p>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-8">
          <label className="block text-sm font-medium mb-2">Career Page URLs (one per line)</label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://stripe.com/jobs&#10;https://optiver.com/working-at-optiver/"
            className="w-full h-40 bg-[#09090b] border border-[#27272a] rounded-lg p-4 text-sm font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
          />
          <button
            onClick={handleScrape}
            disabled={loading}
            className="mt-4 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg disabled:opacity-50"
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </button>
          {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Results ({results.length} companies)</h2>
            {results.map((company, index) => (
              <div key={index} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-lg font-bold text-cyan-400">{company.name}</h3>
                <a href={company.url} target="_blank" className="text-xs text-[#71717a]">{company.url}</a>
                
                {company.languages.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[10px] font-mono text-[#52525b] uppercase">Languages</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {company.languages.map((lang) => (
                        <span key={lang} className="px-2 py-0.5 rounded bg-cyan-500/10 text-[10px] text-cyan-400">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}

                {company.frameworks.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-mono text-[#52525b] uppercase">Frameworks</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {company.frameworks.map((fw) => (
                        <span key={fw} className="px-2 py-0.5 rounded bg-purple-500/10 text-[10px] text-purple-400">{fw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {company.skills.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-mono text-[#52525b] uppercase">Skills</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {company.skills.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-green-500/10 text-[10px] text-green-400">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {company.qualities.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-mono text-[#52525b] uppercase">Qualities</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {company.qualities.map((q) => (
                        <span key={q} className="px-2 py-0.5 rounded bg-orange-500/10 text-[10px] text-orange-400">{q}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
