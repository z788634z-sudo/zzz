import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import { FileUpload } from './components/FileUpload';
import { EnergyGraph } from './components/EnergyGraph';
import { InsightsPanel } from './components/InsightsPanel';
import { ImageEditor } from './components/ImageEditor';
import { VideoStudio } from './components/VideoStudio';
import { LiveCoach } from './components/LiveCoach';
import { SearchGrounding } from './components/SearchGrounding';
import { analyzeChatEnergy } from './services/geminiService';
import { AnalysisResult, AnalysisMode } from './types';
import { Users, Briefcase, RefreshCw, MessageSquare, Image, Video, Mic, Globe } from 'lucide-react';

type ToolMode = 'decoder' | 'editor' | 'video' | 'live' | 'search';

const App: React.FC = () => {
  const [toolMode, setToolMode] = useState<ToolMode>('decoder');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('social');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeChatEnergy(files, analysisMode);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze group chat");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const NavItem = ({ mode, icon: Icon, label }: { mode: ToolMode, icon: any, label: string }) => (
    <button
      onClick={() => setToolMode(mode)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all w-20 ${
        toolMode === mode 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-24 border-r border-slate-800 bg-slate-950/80 backdrop-blur-md fixed h-full z-50 flex flex-col items-center py-6 gap-2">
         <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl mb-6 shadow-glow">
            <MessageSquare className="w-6 h-6 text-white" />
         </div>
         
         <NavItem mode="decoder" icon={Users} label="Decoder" />
         <NavItem mode="editor" icon={Image} label="Editor" />
         <NavItem mode="video" icon={Video} label="Veo" />
         <NavItem mode="live" icon={Mic} label="Live" />
         <NavItem mode="search" icon={Globe} label="Search" />
      </aside>

      {/* Main Content Area */}
      <div className="pl-24 w-full">
        {/* Header (Only for Decoder usually, but we keep it generic) */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 h-16 flex items-center px-8 justify-between">
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-cyan-200">
               {toolMode === 'decoder' && "Energy Decoder"}
               {toolMode === 'editor' && "Magic Editor"}
               {toolMode === 'video' && "Veo Studio"}
               {toolMode === 'live' && "Live Coach"}
               {toolMode === 'search' && "Fact Checker"}
             </h1>

             {toolMode === 'decoder' && (
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-full border border-slate-800">
                  <button
                    onClick={() => setAnalysisMode('social')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      analysisMode === 'social' 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Social
                  </button>
                  <button
                    onClick={() => setAnalysisMode('work')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      analysisMode === 'work' 
                        ? 'bg-emerald-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Work
                  </button>
                </div>
             )}
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          
          {/* DECODER VIEW */}
          {toolMode === 'decoder' && (
             <>
                {!result ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
                    <div className="text-center space-y-4 max-w-2xl">
                      <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Decode the <span className="text-indigo-400">Hidden Dynamics</span>
                      </h2>
                      <p className="text-lg text-slate-400">
                        Analyze chat logs for power structures, emotional undercurrents, and role archetypes.
                      </p>
                    </div>
                    
                    <FileUpload onUpload={handleUpload} isLoading={isAnalyzing} />
                    
                    {error && (
                      <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-200 max-w-md text-center">
                        {error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Analysis Report</h2>
                      <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Analyze New Group
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/50 rounded-2xl p-1 border border-slate-800 shadow-xl">
                          <EnergyGraph nodes={result.nodes} links={result.links} />
                        </div>
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                          <InsightsPanel 
                            insights={result.insights} 
                            energyFlow={result.energy_flow} 
                            topicBadges={result.topic_badges}
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl h-fit">
                          <h3 className="text-lg font-bold text-indigo-300 mb-4">Decoder's Notes</h3>
                          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                            <ReactMarkdown>{result.markdown_report}</ReactMarkdown>
                          </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                          <h3 className="text-lg font-bold text-slate-200 mb-4">Archetypes Detected</h3>
                          <div className="space-y-3">
                            {result.nodes.sort((a,b) => b.influence_score - a.influence_score).map(node => (
                              <div key={node.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-2 h-8 rounded-full" 
                                    style={{ backgroundColor: node.sentiment_color }}
                                  ></div>
                                  <div>
                                    <div className="font-bold text-slate-200">{node.id}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">{node.role}</div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-indigo-400 font-mono">INF: {node.influence_score}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
             </>
          )}

          {/* OTHER TOOLS */}
          {toolMode === 'editor' && <ImageEditor />}
          {toolMode === 'video' && <VideoStudio />}
          {toolMode === 'live' && <LiveCoach />}
          {toolMode === 'search' && <SearchGrounding />}

        </main>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);