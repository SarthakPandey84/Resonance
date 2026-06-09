import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ResultsChart({ results }) {
  if (!results) return null;

  const data = Object.entries(results.all_scores).map(([emotion, score]) => ({
    name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    score: (score * 100).toFixed(1)
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-8 shadow-lg">
      <h2 className="text-2xl font-semibold mb-2 text-slate-200">Analysis Results</h2>
      <p className="text-slate-400 mb-8">
        Predicted Emotion: <span className="text-blue-400 font-bold text-xl ml-2">{results.predicted_emotion.toUpperCase()}</span>
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#1e293b' }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }}
              formatter={(value) => [`${value}%`, 'Confidence']}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#475569'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
