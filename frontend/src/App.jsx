import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AudioInput from './components/AudioInput';
import ResultsChart from './components/ResultsChart';
import HistoryDashboard from './components/HistoryDashboard';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const email = prompt("Enter email:");
    const password = prompt("Enter password:");
    if (!email || !password) return;
    
    // Quick and dirty auth for prototype
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) alert(signUpError.message);
        else alert("Signed up! You can now log in.");
      } else {
        alert(error.message);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setResults(null);
  };

  const handleAudioSelect = async (file) => {
    if (!user) {
      alert("Please sign in first to analyze audio.");
      return;
    }
    
    setIsProcessing(true);
    setResults(null);
    
    try {
      // 1. Send to FastAPI for Prediction
      const formData = new FormData();
      formData.append("file", file);
      
      const apiUrl = import.meta.env.PROD ? '/_/backend' : 'http://localhost:8000';
      const apiResponse = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData,
      });
      
      if (!apiResponse.ok) {
        const err = await apiResponse.json();
        throw new Error(err.detail || "Error from FastAPI server");
      }
      
      const predictionData = await apiResponse.json();
      setResults(predictionData);

      // 2. Upload Audio to Supabase Storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-uploads')
        .getPublicUrl(fileName);

      // 3. Save to Predictions History
      const { error: dbError } = await supabase
        .from('predictions_history')
        .insert([{
          user_id: user.id,
          audio_file_url: publicUrl,
          predicted_emotion: predictionData.predicted_emotion,
          confidence_score: predictionData.confidence_score
        }]);

      if (dbError) throw dbError;
      
      // Trigger history refresh
      setRefreshHistory(prev => prev + 1);

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingAuth) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Resonance SER
        </h1>
        
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm hidden md:flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> {user.email}
              </span>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-medium shadow-lg shadow-blue-600/20"
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {!user ? (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold mb-4">Discover the Emotion in Your Voice</h2>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Our advanced Deep Learning models analyze the acoustic features of human speech to accurately detect emotions like happiness, sadness, anger, and more.
            </p>
            <button 
              onClick={handleSignIn}
              className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 transition font-semibold text-lg shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              Get Started Now
            </button>
          </div>
        ) : (
          <>
            <AudioInput onAudioSelect={handleAudioSelect} isProcessing={isProcessing} />
            <ResultsChart results={results} />
            <HistoryDashboard user={user} refreshTrigger={refreshHistory} />
          </>
        )}
      </main>
    </div>
  );
}
