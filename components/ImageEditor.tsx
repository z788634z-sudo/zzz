import React, { useState } from 'react';
import { editImageWithPrompt } from '../services/geminiService';
import { Upload, Sparkles, Image as ImageIcon } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResultImage(null);
    }
  };

  const handleEdit = async () => {
    if (!file || !prompt) return;
    setLoading(true);
    try {
      const imgUrl = await editImageWithPrompt(file, prompt);
      setResultImage(imgUrl);
    } catch (e) {
      alert("Failed to edit image");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Magic Image Editor</h2>
        <p className="text-slate-400">Powered by Gemini 2.5 Flash Image</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="relative group border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-2xl h-64 flex flex-col items-center justify-center hover:bg-slate-800/50 transition-all">
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
                className="h-full w-full object-contain rounded-xl p-2" 
              />
            ) : (
              <div className="text-center text-slate-500">
                <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Upload Image to Edit</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Your instruction</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Add a retro filter, Remove the background person..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleEdit}
                disabled={!file || !prompt || loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Sparkles className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="border border-slate-700 bg-slate-900 rounded-2xl h-[500px] flex items-center justify-center relative overflow-hidden">
          {resultImage ? (
            <img 
              src={resultImage} 
              alt="Edited Result" 
              className="w-full h-full object-contain" 
            />
          ) : (
            <div className="text-center text-slate-600">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Generated image will appear here</p>
            </div>
          )}
          {loading && (
             <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm z-20">
                <div className="text-indigo-400 font-mono animate-pulse">Generating pixels...</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
