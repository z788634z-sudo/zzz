import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isLoading }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <div className="relative border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-2xl hover:bg-slate-800/50 transition-all duration-300 group">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-lg font-medium text-indigo-300 animate-pulse">
                Decoding Social Signals...
              </p>
              <p className="text-sm text-slate-400">Analyzing micro-expressions and timestamps</p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors mb-4 ring-1 ring-slate-600">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">
                Upload Chat Screenshots
              </h3>
              <p className="text-slate-400 max-w-sm mb-6">
                Drop your WeChat/WhatsApp/Discord screenshots here. The AI will reconstruct the conversation flow.
              </p>
              <div className="flex gap-3 text-xs text-slate-500 bg-slate-950/50 px-4 py-2 rounded-lg border border-slate-800">
                <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> JPG</span>
                <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> PNG</span>
                <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> WEBP</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
