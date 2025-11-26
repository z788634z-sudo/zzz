import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';

export const LiveCoach: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Refs for audio handling to persist across renders
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // Type 'any' for the session object from connect
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Log helper
  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

  // Audio Utils
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length; // Mono channel
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Simple PCM WAV-like encoding for the API input
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      data: base64,
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are a friendly social dynamics coach. Help the user practice conversation or analyze their tone.",
        },
        callbacks: {
            onopen: () => {
                setConnected(true);
                addLog("Connected to Live API");
                
                // Input Processing
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                source.connect(processor);
                processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                // Audio Output
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    setIsSpeaking(true);
                    const bytes = decode(audioData);
                    const buffer = await decodeAudioData(bytes, outputCtx);
                    
                    const source = outputCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputCtx.destination);
                    
                    const now = outputCtx.currentTime;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                    
                    sourcesRef.current.add(source);
                    source.onended = () => {
                        sourcesRef.current.delete(source);
                        if(sourcesRef.current.size === 0) setIsSpeaking(false);
                    };
                }
                
                if (msg.serverContent?.interrupted) {
                    sourcesRef.current.forEach(s => s.stop());
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    setIsSpeaking(false);
                    addLog("Interrupted");
                }
            },
            onclose: () => {
                setConnected(false);
                addLog("Disconnected");
            },
            onerror: (e) => {
                console.error(e);
                addLog("Error occurred");
            }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      addLog("Failed to start session");
    }
  };

  const stopSession = () => {
     if (mediaStreamRef.current) {
         mediaStreamRef.current.getTracks().forEach(t => t.stop());
     }
     if (audioContextRef.current) {
         audioContextRef.current.close();
     }
     // No explicit close method on sessionPromise usually exposed in this simplified flow, 
     // but stopping the stream/context effectively ends the client side.
     // If the SDK exposes session.close(), we should call it. 
     // Based on prompt example: session.close() is mentioned for cleanup.
     sessionRef.current?.then((s: any) => s.close && s.close());
     
     setConnected(false);
     setIsSpeaking(false);
     setLogs([]);
  };

  useEffect(() => {
      return () => {
          stopSession();
      };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8 flex flex-col items-center justify-center min-h-[500px] space-y-8">
       <div className="text-center">
           <h2 className="text-3xl font-bold text-white mb-2">Live Coach</h2>
           <p className="text-slate-400">Practice your social skills in real-time.</p>
       </div>

       <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${connected ? 'bg-indigo-900/40 ring-4 ring-indigo-500/30' : 'bg-slate-800 ring-4 ring-slate-700'}`}>
           {connected ? (
               <div className="relative">
                   <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-40 ${isSpeaking ? 'animate-pulse scale-150' : ''}`}></div>
                   <Volume2 className={`w-16 h-16 text-indigo-400 relative z-10 ${isSpeaking ? 'animate-bounce' : ''}`} />
               </div>
           ) : (
               <MicOff className="w-16 h-16 text-slate-500" />
           )}
       </div>

       <div className="flex gap-4">
           {!connected ? (
               <button onClick={startSession} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-indigo-900/50">
                   <Mic className="w-5 h-5" /> Start Session
               </button>
           ) : (
               <button onClick={stopSession} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-900/50">
                   <Radio className="w-5 h-5" /> End Session
               </button>
           )}
       </div>
       
       <div className="w-full bg-slate-900 p-4 rounded-xl border border-slate-800 h-32 overflow-y-auto font-mono text-xs text-slate-400">
           {logs.map((log, i) => (
               <div key={i}>&gt; {log}</div>
           ))}
           {logs.length === 0 && <div className="opacity-30 italic">System logs...</div>}
       </div>
    </div>
  );
};
