import React, { useState } from 'react';
import { searchWithGrounding } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Search, Globe, ExternalLink } from 'lucide-react';

export const SearchGrounding: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{text: string; sources: any[]} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchWithGrounding(query);
      
      // Parse grounding chunks for display
      const chunks = data.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .filter((c: any) => c.web)
        .map((c: any) => ({
            title: c.web.title,
            uri: c.web.uri
        }));

      setResult({
          text: data.text || "No text returned",
          sources: sources
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Fact Checker</h2>
            <p className="text-slate-400">Verify chat topics with Google Search Grounding.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8 relative">
            <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ex: 'Who won the most bronze medals in Paris 2024?' or 'Latest memes about programming'"
                className="w-full bg-slate-900 border border-slate-700 rounded-full py-4 px-6 pl-14 text-white focus:ring-2 focus:ring-sky-500 outline-none shadow-lg"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
            <button 
                type="submit" 
                disabled={loading || !query}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50"
            >
                {loading ? 'Searching...' : 'Search'}
            </button>
        </form>

        {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
                    <h3 className="text-lg font-bold text-sky-400 mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5" /> AI Overview
                    </h3>
                    <div className="prose prose-invert max-w-none text-slate-300">
                        <ReactMarkdown>{result.text}</ReactMarkdown>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sources</h3>
                    {result.sources.length > 0 ? (
                        result.sources.map((source, idx) => (
                            <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-slate-800 transition-colors group"
                            >
                                <div className="text-sm font-medium text-sky-300 mb-1 group-hover:underline line-clamp-2">
                                    {source.title}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                    <ExternalLink className="w-3 h-3" />
                                    {new URL(source.uri).hostname}
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="text-slate-600 text-sm italic">No web sources returned.</div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
