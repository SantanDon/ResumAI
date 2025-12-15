import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Edit2, Save, Plus, Sparkles } from 'lucide-react';
import { Particles } from './reactbits/Particles';
import { AsciiText } from './reactbits/AsciiText';
import { GooeyNav } from './reactbits/GooeyNav';
import { BlurText } from './reactbits/BlurText';
import { SpotlightCard } from './reactbits/SpotlightCard';
import { AnimatedList } from './reactbits/AnimatedList';
import { ModernButton } from './reactbits/ModernButton';
import { BorderBeam } from './reactbits/BorderBeam';

interface MasterCVEntry {
  id: number;
  section_type: string;
  content: string;
}

export const MasterCVViewer = () => {
  const [entries, setEntries] = useState<MasterCVEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userId, setUserId] = useState('default'); 
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'templates'>('editor');

  useEffect(() => {
    fetchMasterCV();
  }, [userId]);

  const fetchMasterCV = async () => {
    try {
      const response = await fetch(`/api/cv/master/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.masterCV || []);
      }
    } catch (error) {
      console.error('Failed to fetch MasterCV:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/cv/master/${id}`, { method: 'DELETE' });
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleSave = async (id: number) => {
    setEditingId(null);
  };

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await fetch('http://localhost:3001/api/cv/parse', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update userId to trigger fetchMasterCV
          if (data.userId) {
            setUserId(data.userId);
            // Also switch to editor tab to see results
            setActiveTab('editor');
          } else {
            fetchMasterCV();
          }
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const gooeyNavItems = [
    {
      id: 'editor',
      name: 'Editor',
      icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
      onClick: () => setActiveTab('editor')
    },
    {
      id: 'analysis',
      name: 'Analysis',
      icon: 'M9 7H7a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 4V2m0 2v2m0 0h2m-2 0h-2m4 0a5 5 0 1 1-10 0',
      onClick: () => setActiveTab('analysis')
    },
    {
      id: 'templates',
      name: 'Templates',
      icon: 'M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6Zm-4 8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2Zm-10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2Z',
      onClick: () => setActiveTab('templates')
    },
  ];

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Black Background Layer */}
      <div className="fixed inset-0 z-[-1] bg-black" />
      
      {/* Particles Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles
          quantity={300}
          staticity={50}
          spread={0}
          size={0.6}
          baseSize={0.6}
          sizeRandomness={0.5}
          colors={['#ffffff', '#a855f7', '#3b82f6']}
          uTime={0.1}
        />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Gooey Navigation */}
      <div className="fixed left-0 right-0 bottom-4 z-50">
        <GooeyNav
          items={gooeyNavItems}
          activeId={activeTab}
          className="max-w-md mx-auto"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 pt-16 pb-24">
        <div className="w-full space-y-12">

          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <AsciiText
                text="RESUMAI"
                className="text-white text-center"
                fps={6}
              />
              <div className="text-xl text-white font-bold">Swarm</div>
            </div>
            <BlurText
              text="Powered by Maximal Agentic Decomposition • Edit your MasterCV live"
              className="text-lg text-slate-400"
              delay={0.5}
            />
          </div>

          {/* Dynamic Content based on Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'editor' && (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 gap-8 lg:grid-cols-3"
              >
                {/* Upload Section */}
                <div className="lg:col-span-3">
                  <div 
                    className={`relative cursor-pointer overflow-hidden rounded-xl bg-black/20 p-12 text-center backdrop-blur-sm transition-all ${isDragging ? 'border-2 border-purple-500 bg-purple-500/10' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                    <BorderBeam size={300} duration={10} delay={0} colorFrom="#a855f7" colorTo="#3b82f6" />
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="mb-6 rounded-full bg-purple-500/10 p-6 transition-transform hover:scale-110">
                        <Upload className="h-10 w-10 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Upload CV (PDF)</h3>
                      <p className="mt-2 text-slate-400">Drag & drop a PDF here, or click to select</p>
                    </div>
                  </div>
                </div>

                {/* Master CV Entries */}
                <div className="lg:col-span-3">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Master CV Entries</h2>
                    <ModernButton onClick={() => {}}>
                      <Plus className="h-4 w-4" /> Add Entry
                    </ModernButton>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />
                      ))}
                    </div>
                  ) : entries.length === 0 ? (
                    <SpotlightCard className="flex flex-col items-center justify-center py-16 text-center">
                      <FileText className="mb-4 h-12 w-12 text-slate-600" />
                      <h3 className="text-xl font-medium text-slate-300">No CV entries found</h3>
                      <p className="mt-2 text-slate-500">Upload a CV or add entries to get started</p>
                    </SpotlightCard>
                  ) : (
                    <AnimatedList className="space-y-4">
                      {entries.map((entry) => (
                        <SpotlightCard key={entry.id} className="group relative !p-6">
                          <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button 
                              onClick={() => setEditingId(entry.id)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(entry.id)}
                              className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="mb-2 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                            {entry.section_type}
                          </div>
                          
                          {editingId === entry.id ? (
                            <div className="mt-2">
                              <textarea
                                className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-slate-200 focus:border-purple-500 focus:outline-none"
                                rows={3}
                                defaultValue={entry.content}
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditingId(null)}
                                  className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <ModernButton onClick={() => handleSave(entry.id)} className="!px-4 !py-1.5 !text-sm">
                                  <Save className="h-3 w-3" /> Save
                                </ModernButton>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-slate-300">{entry.content}</p>
                          )}
                        </SpotlightCard>
                      ))}
                    </AnimatedList>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mx-auto max-w-2xl"
              >
                <SpotlightCard>
                  <h3 className="mb-4 text-xl font-bold text-white">Skills Gap Analysis</h3>
                  <textarea 
                    className="mb-4 h-48 w-full rounded-xl border border-white/10 bg-black/20 p-4 text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Paste job description here..."
                  />
                  <ModernButton className="w-full justify-center">
                    Analyze Gaps
                  </ModernButton>
                </SpotlightCard>
              </motion.div>
            )}

            {activeTab === 'templates' && (
              <motion.div 
                key="templates"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="flex justify-center gap-4">
                  {['Modern', 'Classic', 'Minimal'].map((template) => (
                    <button 
                      key={template}
                      className="rounded-full bg-white/5 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      {template}
                    </button>
                  ))}
                </div>
                
                <SpotlightCard className="aspect-[1/1.4] w-full max-w-3xl mx-auto bg-white text-slate-900 !p-12">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900">Your Name</h1>
                    <p className="mt-2 text-xl text-slate-600">Professional Title</p>
                  </div>
                  <div className="mt-8 h-px w-full bg-slate-200" />
                  {/* CV Preview Content */}
                </SpotlightCard>

                <div className="flex justify-center">
                  <ModernButton className="bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/25">
                    <FileText className="h-5 w-5" /> Export to PDF
                  </ModernButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      </div>
    </div>
  );
};
