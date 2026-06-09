import React, { useState, useRef } from 'react';
import { UploadCloud, Mic, Square } from 'lucide-react';

export default function AudioInput({ onAudioSelect, isProcessing }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onAudioSelect(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Passing as .wav so FastAPI accepts it
        const file = new File([blob], "recording.wav", { type: 'audio/wav' });
        chunksRef.current = [];
        onAudioSelect(file);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-8 text-center shadow-lg relative overflow-hidden">
      {isProcessing && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-400 font-medium animate-pulse">Analyzing emotion...</p>
          </div>
        </div>
      )}
      
      <h2 className="text-2xl font-semibold mb-6 text-slate-200">Upload or Record Audio</h2>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <label className="flex flex-col items-center justify-center w-full md:w-1/2 h-48 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition">
          <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
          <p className="mb-2 text-sm text-slate-300">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">WAV or MP3 (max 10MB)</p>
          <input type="file" className="hidden" accept=".wav,.mp3,audio/*" onChange={handleFileChange} />
        </label>

        <div className="text-slate-500 font-medium">OR</div>

        <div className="flex flex-col items-center justify-center w-full md:w-1/2 h-48 border-2 border-slate-700 rounded-xl bg-slate-800/50">
          {!isRecording ? (
            <button onClick={startRecording} className="flex flex-col items-center text-slate-300 hover:text-white transition">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/50 hover:bg-red-500/40">
                <Mic className="w-8 h-8 text-red-500" />
              </div>
              <span className="font-medium">Start Recording</span>
            </button>
          ) : (
            <button onClick={stopRecording} className="flex flex-col items-center text-slate-300 hover:text-white transition">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-4 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                <Square className="w-6 h-6 text-white fill-current" />
              </div>
              <span className="font-medium text-red-400">Recording... Click to Stop</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
