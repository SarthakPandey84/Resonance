import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock } from 'lucide-react';

export default function HistoryDashboard({ user, refreshTrigger }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, refreshTrigger]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('predictions_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setHistory(data);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
        <Clock className="w-6 h-6 text-blue-500" />
        Recent Predictions
      </h2>
      
      {history.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No predictions yet. Record some audio!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Emotion</th>
                <th className="py-3 px-4 font-medium">Confidence</th>
                <th className="py-3 px-4 font-medium">Audio</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                  <td className="py-4 px-4 text-slate-300">
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-200 capitalize">
                    {item.predicted_emotion}
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    {(item.confidence_score * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-4">
                    <audio controls src={item.audio_file_url} className="h-8 w-48 rounded"></audio>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
