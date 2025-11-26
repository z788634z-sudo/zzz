import React, { useState } from 'react';
import { generateVeoVideo } from '../services/geminiService';
import { Upload, Video, Play, AlertCircle } from 'lucide-react';

export const VideoStudio: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking_key' | 'generating' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setVideoUrl(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    
    setStatus('checking_key');
    try {
      // API Key Check
      // Use cast to any to avoid TypeScript conflicts if aistudio is globally defined with different types
      const aiStudio = (window as any).aistudio;
      
      if (aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
          await aiStudio.openSelectKey();
          // Race condition mitigation: assume success or check again. 
          // Proceeding to generate...
        }
      }

      setStatus('generating');
      setStatusMsg("Initializing Veo model...");
      
      const url = await generateVeoVideo(file, prompt, ratio);
      setVideoUrl(url);
      setStatus('idle');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      if (e.message?.includes("Requested entity was not found")) {
        setStatusMsg("API Key issue. Please re-select your key.");
        const aiStudio = (window as any).aistudio;
        if (aiStudio) {
            aiStudio.openSelectKey();
        }
      } else {
        setStatusMsg("Generation failed. Veo can take a minute to process.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Veo Video Studio</h2>
        <p className="text-slate-400">Animate your images with generative video.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/30 text-yellow-500 text-xs border border-yellow-800">
           <AlertCircle className="w-3 h-3" />
           Requires Paid API Key
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="relative group border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-2xl h-48 flex flex-col items-center justify-center hover:bg-slate-800/50 transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {file ? (
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                className="h-full w-full object-cover rounded-xl opacity-60" 
              />
            ) : (
              <div className="text-center text-slate-500">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Upload Start Image</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
             <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Prompt (Optional)</label>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the motion (e.g. The cat blinks and looks around)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
             </div>
             
             <div>
                 <label className="text-sm font-medium text-slate-300 block mb-2">Aspect Ratio</label>
                 <div className="flex gap-4">
                     <button 
                        onClick={() => setRatio('16:9')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${ratio === '16:9' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                     >
                        16:9 (Landscape)
                     </button>
                     <button 
                        onClick={() => setRatio('9:16')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${ratio === '9:16' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                     >
                        9:16 (Portrait)
                     </button>
                 </div>
             </div>

             <button
                onClick={handleGenerate}
                disabled={!file || status === 'generating'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
              >
                {status === 'generating' ? (
                   <span className="animate-pulse">Rendering Video...</span>
                ) : (
                   <>
                     <Video className="w-5 h-5" /> Generate Video
                   </>
                )}
              </button>
              
              {status === 'error' && (
                  <p className="text-red-400 text-sm text-center">{statusMsg}</p>
              )}
          </div>
        </div>

        {/* Video Output */}
        <div className="border border-slate-700 bg-black rounded-2xl flex items-center justify-center relative overflow-hidden h-[400px]">
           {videoUrl ? (
             <video controls autoPlay loop className="w-full h-full object-contain">
                 <source src={videoUrl} type="video/mp4" />
             </video>
           ) : (
             <div className="text-center text-slate-700">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Preview will appear here</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};