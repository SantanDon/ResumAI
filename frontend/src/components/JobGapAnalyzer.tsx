import React, { useState } from 'react';

export const JobGapAnalyzer: React.FC<{ userId: string }> = ({ userId }) => {
  const [jobDesc, setJobDesc] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/cv/analyze-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobDesc }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="glass rounded-3xl p-8">
      <h3 className="text-xl font-semibold text-white mb-4">Skills Gap Analysis</h3>
      <textarea
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
        placeholder="Paste job description here..."
        className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white h-32 mb-4 resize-none"
      />
      <button onClick={analyze} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:scale-105 disabled:opacity-50 transition-all">
        {loading ? 'Analyzing...' : 'Analyze Gaps'}
      </button>
      {analysis && (
        <div className="mt-6 space-y-4">
          <div className="glass-dark p-4 rounded-xl">
            <h4 className="font-semibold text-gray-200 mb-2">Your Skills</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.cvSkills.map((skill: string) => <span key={skill} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">{skill}</span>)}
            </div>
          </div>
          <div className="glass-dark p-4 rounded-xl">
            <h4 className="font-semibold text-gray-200 mb-2">Job Skills</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.jobSkills.map((skill: string) => <span key={skill} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">{skill}</span>)}
            </div>
          </div>
          <div className="glass-dark p-4 rounded-xl">
            <h4 className="font-semibold text-orange-300 mb-2">Gaps (Learn These)</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.gaps.map((gap: string) => <span key={gap} className="px-3 py-1 bg-orange-500/30 text-orange-200 rounded-full text-sm">{gap}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};