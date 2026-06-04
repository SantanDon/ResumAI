import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader, AlertCircle, CheckCircle, Clock, XCircle, Send, Play, ArrowLeft, RefreshCw } from 'lucide-react';

interface QueueItem {
  id: string;
  job_description: string;
  job_url: string | null;
  company: string | null;
  title: string | null;
  status: 'pending' | 'processing' | 'completed' | 'needs_review' | 'error';
  tailored_cv_id: string | null;
  match_score: number | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

interface AutoApplyProgressProps {
  userId: string;
  onBack: () => void;
}

export const AutoApplyProgress: React.FC<AutoApplyProgressProps> = ({ userId, onBack }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, needsReview: 0, error: 0 });
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    fetchStats();
  }, [userId]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/hunter/scout/jobs/${userId}?status=all`);
      if (res.ok) {
        const d = await res.json();
        if (d.success) setQueue(d.jobs);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/hunter/apply/stats/${userId}`);
      if (res.ok) { const d = await res.json(); if (d.success) setStats(d.stats); }
    } catch { /* ignore */ }
  };

  const handleProcessAll = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/hunter/apply/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, maxConcurrent: 3 }),
      });
      if (res.ok) {
        await fetchQueue();
        await fetchStats();
      }
    } catch { /* ignore */ }
    setProcessing(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={18} className="text-green-400" />;
      case 'processing': return <Loader size={18} className="text-blue-400 animate-spin" />;
      case 'pending': return <Clock size={18} className="text-yellow-400" />;
      case 'needs_review': return <AlertCircle size={18} className="text-orange-400" />;
      case 'error': return <XCircle size={18} className="text-red-400" />;
      default: return <Clock size={18} className="text-white/30" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Sent';
      case 'processing': return 'Processing...';
      case 'pending': return 'Queued';
      case 'needs_review': return 'Needs Review';
      case 'error': return 'Failed';
      default: return status;
    }
  };

  return (
    <div className="min-h-full w-full py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Auto Apply Progress</h1>
              <p className="text-white/50 text-sm">Track your automated job applications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchStats} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={18} />
            </button>
            <button onClick={handleProcessAll} disabled={processing || stats.pending === 0}
              className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-lg text-primary-300 text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {processing ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
              {processing ? 'Processing...' : `Process Queue (${stats.pending})`}
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Queued', value: stats.pending, color: 'text-yellow-400' },
            { label: 'Sent', value: stats.completed, color: 'text-green-400' },
            { label: 'Review', value: stats.needsReview, color: 'text-orange-400' },
            { label: 'Failed', value: stats.error, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Queue list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={24} className="animate-spin text-primary-400" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-16">
            <Send size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40">No jobs in queue. Go to Job Hunter to find and queue jobs.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {statusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{item.title || 'Job'}</span>
                      {item.company && <span className="text-white/40 text-sm">@ {item.company}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/30 mt-0.5">
                      <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                      {item.match_score && <span>Match: {item.match_score}%</span>}
                      {item.error_message && <span className="text-red-400">{item.error_message}</span>}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  item.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                  item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  item.status === 'needs_review' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>{statusLabel(item.status)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
