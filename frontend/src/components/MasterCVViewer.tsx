import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Edit2, Save, Plus, Sparkles, ChevronDown, Eye, EyeOff, Download } from 'lucide-react';
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
  visible?: boolean;
}

interface MasterCVViewerProps {
  userId?: string;
}

type TemplateType = 'Modern' | 'Classic' | 'Minimal';

export const MasterCVViewer: React.FC<MasterCVViewerProps> = ({ userId: propUserId = 'demo@resumai.com' }) => {
  const [entries, setEntries] = useState<MasterCVEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [userId, setUserId] = useState(propUserId); 
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'templates'>('editor');
  
  // Custom template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Modern');

  // Add entry modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionType, setNewSectionType] = useState('skill');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  const sectionTypes = ['name', 'email', 'phone', 'location', 'summary', 'skill', 'experience', 'education'];

  useEffect(() => {
    setUserId(propUserId);
  }, [propUserId]);

  useEffect(() => {
    fetchMasterCV();
  }, [userId]);

  const fetchMasterCV = async () => {
    try {
      const response = await fetch(`/api/cv/master/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setEntries((data.masterCV || []).map((e: any) => ({
          ...e,
          visible: e.visible !== 0
        })));
      }
    } catch (error) {
      console.error('Failed to fetch MasterCV:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/cv/master/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEntries(entries.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleEditStart = (entry: MasterCVEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/cv/master/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      if (response.ok) {
        setEntries(entries.map(e => e.id === id ? { ...e, content: editContent } : e));
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
    } finally {
      setEditingId(null);
    }
  };

  const handleToggleVisibility = async (entry: MasterCVEntry) => {
    const nextVisible = entry.visible === false ? true : false;
    try {
      const response = await fetch(`/api/cv/master/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: nextVisible })
      });
      if (response.ok) {
        setEntries(entries.map(e => e.id === entry.id ? { ...e, visible: nextVisible } : e));
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleAddEntry = async () => {
    if (!newContent.trim()) return;
    setIsAdding(true);
    try {
      const response = await fetch('/api/cv/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          section_type: newSectionType,
          content: newContent,
          visible: true
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEntries([...entries, { id: data.id, section_type: newSectionType, content: newContent, visible: true }]);
          setNewContent('');
          setShowAddModal(false);
        }
      }
    } catch (error) {
      console.error('Failed to add entry:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportPDF = () => {
    window.open(`/api/cv/master/${userId}/download-pdf`, '_blank');
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch(`/api/cv/master/${userId}/export`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_') || 'master'}_cv.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export JSON:', error);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const response = await fetch(`/api/cv/master/${userId}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (response.ok) {
          fetchMasterCV();
        }
      } catch (err) {
        console.error('Failed to parse or import JSON:', err);
      }
    };
    reader.readAsText(file);
  };

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await fetch('/api/cv/parse', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.userId) {
            setUserId(data.userId);
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

  // Helper variables for live template view
  const nameEntry = entries.find(e => e.section_type.toLowerCase() === 'name');
  const name = nameEntry && nameEntry.visible !== false ? nameEntry.content : '';

  const summaryEntry = entries.find(e => e.section_type.toLowerCase().includes('summary') || e.section_type.toLowerCase().includes('objective'));
  const summary = summaryEntry && summaryEntry.visible !== false ? summaryEntry.content : '';

  const emailEntry = entries.find(e => e.section_type.toLowerCase() === 'email');
  const email = emailEntry && emailEntry.visible !== false ? emailEntry.content : '';

  const phoneEntry = entries.find(e => e.section_type.toLowerCase() === 'phone');
  const phone = phoneEntry && phoneEntry.visible !== false ? phoneEntry.content : '';

  const locationEntry = entries.find(e => e.section_type.toLowerCase() === 'location');
  const location = locationEntry && locationEntry.visible !== false ? locationEntry.content : '';
  
  const skills = entries.filter(e => e.section_type.toLowerCase().includes('skill') && e.visible !== false).map(e => e.content);
  const experience = entries.filter(e => (e.section_type.toLowerCase().includes('experience') || e.section_type.toLowerCase().includes('work') || e.section_type.toLowerCase().includes('job')) && e.visible !== false);
  const education = entries.filter(e => (e.section_type.toLowerCase().includes('education') || e.section_type.toLowerCase().includes('degree')) && e.visible !== false);

  return (
    <div className="relative min-h-screen w-full font-sans">
      <div className="fixed inset-0 z-[-1] bg-black" />
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles
          quantity={120}
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
        <div className="fixed left-0 right-0 bottom-4 z-50">
          <GooeyNav
            items={gooeyNavItems}
            activeId={activeTab}
            className="max-w-md mx-auto"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-12 pb-24">
          <div className="w-full space-y-8">
            <div className="space-y-3 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <AsciiText
                  text="RESUMAI"
                  className="text-white text-center"
                  fps={6}
                />
                <div className="text-xl text-white font-extrabold tracking-tight">Master Profile Database</div>
              </div>
              <BlurText
                text="Powered by Consensus Engine Consensus Swarm • Modify your profiles live"
                className="text-sm text-slate-400"
                delay={0.5}
              />
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'editor' && (
                <motion.div 
                  key="editor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 gap-8 lg:grid-cols-3"
                >
                  <div className="lg:col-span-3">
                    <div 
                      className={`relative cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/40 p-10 text-center backdrop-blur-xl transition-all hover:border-zinc-800 ${isDragging ? 'border-2 border-purple-500 bg-purple-500/10' : ''}`}
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
                        <div className="mb-4 rounded-2xl bg-purple-500/10 p-5 transition-transform hover:scale-110">
                          <Upload className="h-8 w-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Upload CV (PDF)</h3>
                        <p className="mt-2 text-sm text-slate-400">Drag & drop a PDF here, or click to browse</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-white">Profile Records</h2>
                        <p className="text-xs text-zinc-500 mt-1">Granular pieces representing your career profile</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="import-json-input"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportJSON}
                        />
                        <ModernButton onClick={handleExportJSON} className="!bg-zinc-850 hover:!bg-zinc-750 !text-slate-300 border border-white/5">
                          <Download className="h-4 w-4" /> Export JSON
                        </ModernButton>
                        <ModernButton onClick={() => document.getElementById('import-json-input')?.click()} className="!bg-zinc-850 hover:!bg-zinc-750 !text-slate-300 border border-white/5">
                          <Upload className="h-4 w-4" /> Import JSON
                        </ModernButton>
                        <ModernButton onClick={() => setShowAddModal(true)}>
                          <Plus className="h-4 w-4" /> Add Entry
                        </ModernButton>
                      </div>
                    </div>

                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
                        ))}
                      </div>
                    ) : entries.length === 0 ? (
                      <SpotlightCard className="flex flex-col items-center justify-center py-16 text-center border-white/5 bg-zinc-950/40">
                        <FileText className="mb-4 h-12 w-12 text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-300">No profile details parsed</h3>
                        <p className="mt-2 text-sm text-slate-500">Upload a resume above or click Add Entry to begin styling</p>
                      </SpotlightCard>
                    ) : (
                      <AnimatedList className="space-y-4">
                        {entries.map((entry) => (
                          <SpotlightCard key={entry.id} className={`group relative !p-6 border-white/5 bg-zinc-950/30 backdrop-blur-xl transition-all ${entry.visible === false ? 'opacity-40 border-dashed border-zinc-850' : ''}`}>
                            <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button 
                                onClick={() => handleToggleVisibility(entry)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                                title={entry.visible === false ? "Show in template preview" : "Hide in template preview"}
                              >
                                {entry.visible === false ? <EyeOff className="h-3.5 w-3.5 text-zinc-500" /> : <Eye className="h-3.5 w-3.5 text-purple-450" />}
                              </button>
                              <button 
                                onClick={() => handleEditStart(entry)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(entry.id)}
                                className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            
                            <div className="mb-2 inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                              {entry.section_type}
                            </div>
                            
                            {editingId === entry.id ? (
                              <div className="mt-3 space-y-3">
                                <textarea
                                  className="w-full rounded-xl border border-white/10 bg-zinc-950/80 p-4 text-sm text-slate-200 focus:border-purple-500 focus:outline-none transition-colors"
                                  rows={3}
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => setEditingId(null)}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <ModernButton onClick={() => handleSave(entry.id)} className="!px-4 !py-2 !text-xs">
                                    <Save className="h-3.5 w-3.5" /> Save Changes
                                  </ModernButton>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
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
                  <SpotlightCard className="border-white/5 bg-zinc-950/40 backdrop-blur-xl">
                    <h3 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-violet-400" size={20} />
                      Job Skill Matcher
                    </h3>
                    <p className="text-xs text-zinc-500 mb-6">Compare the alignment of your profile details against a job spec</p>
                    <textarea 
                      className="mb-4 h-48 w-full rounded-2xl border border-white/10 bg-zinc-950/50 p-4 text-sm text-slate-200 placeholder-slate-600 focus:border-purple-500 focus:outline-none"
                      placeholder="Paste job description details..."
                    />
                    <ModernButton className="w-full justify-center">
                      Analyze Alignment Gaps
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
                  <div className="flex justify-center gap-3">
                    {(['Modern', 'Classic', 'Minimal'] as TemplateType[]).map((t) => (
                      <button 
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={`rounded-full px-6 py-2.5 text-xs font-semibold border transition-all duration-200 ${
                          selectedTemplate === t 
                            ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20' 
                            : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  
                  {/* Dynamic Template Viewport */}
                  <div className="w-full max-w-3xl mx-auto rounded-3xl bg-zinc-900/40 border border-white/5 p-4 shadow-xl">
                    {selectedTemplate === 'Modern' && (
                      <div className="aspect-[1/1.41] w-full bg-white text-slate-800 rounded-2xl p-10 md:p-12 shadow-2xl relative flex flex-col font-sans text-left overflow-y-auto">
                        <div className="grid grid-cols-3 gap-8 flex-1">
                          {/* Sidebar */}
                          <div className="col-span-1 border-r border-slate-100 pr-6 space-y-6">
                            <div>
                              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{name}</h1>
                              <p className="text-[10px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">Applicant</p>
                            </div>
                            
                            <div className="space-y-2 text-[10px] text-slate-600">
                              {email && <div className="truncate font-medium">{email}</div>}
                              {phone && <div className="font-medium">{phone}</div>}
                              {location && <div className="font-medium">{location}</div>}
                            </div>

                            {skills.length > 0 && (
                              <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1">Skills</h3>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {skills.map((s, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-medium">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Main Body */}
                          <div className="col-span-2 space-y-6">
                            {summary && (
                              <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1">Summary</h3>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{summary}</p>
                              </div>
                            )}

                            {experience.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1">Experience</h3>
                                <div className="space-y-3">
                                  {experience.map((exp, idx) => (
                                    <div key={idx} className="text-[11px] text-slate-600 leading-relaxed pl-1 border-l-2 border-slate-100">
                                      {exp.content}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {education.length > 0 && (
                              <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1">Education</h3>
                                <div className="space-y-2">
                                  {education.map((edu, idx) => (
                                    <div key={idx} className="text-[11px] text-slate-600 leading-relaxed pl-1 border-l-2 border-slate-100">
                                      {edu.content}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTemplate === 'Classic' && (
                      <div className="aspect-[1/1.41] w-full bg-white text-slate-800 rounded-2xl p-10 md:p-12 shadow-2xl relative flex flex-col font-serif text-left overflow-y-auto">
                        <div className="text-center space-y-2">
                          <h1 className="text-3xl font-bold text-slate-900 tracking-wide font-serif">{name}</h1>
                          <div className="text-xs text-slate-600 flex justify-center gap-4 flex-wrap font-sans">
                            {email && <span>{email}</span>}
                            {phone && <span>{phone}</span>}
                            {location && <span>{location}</span>}
                          </div>
                        </div>
                        
                        <div className="mt-8 space-y-6">
                          {summary && (
                            <div className="space-y-1.5">
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Profile</h3>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{summary}</p>
                            </div>
                          )}

                          {experience.length > 0 && (
                            <div className="space-y-2.5">
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Professional Experience</h3>
                              <div className="space-y-3">
                                {experience.map((exp, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {exp.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {education.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Education</h3>
                              <div className="space-y-2">
                                {education.map((edu, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-600 leading-relaxed">
                                    {edu.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {skills.length > 0 && (
                            <div className="space-y-1.5">
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Technical Skills</h3>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {skills.join(' • ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedTemplate === 'Minimal' && (
                      <div className="aspect-[1/1.41] w-full bg-white text-zinc-800 rounded-2xl p-10 md:p-12 shadow-2xl relative flex flex-col font-mono text-left overflow-y-auto">
                        <div className="space-y-3">
                          <h1 className="text-2xl font-bold text-zinc-950 tracking-tighter">{name}</h1>
                          <div className="text-[10px] text-zinc-500 space-x-4">
                            {email && <span>email: {email}</span>}
                            {phone && <span>tel: {phone}</span>}
                            {location && <span>loc: {location}</span>}
                          </div>
                        </div>

                        <div className="mt-8 space-y-6">
                          {summary && (
                            <div className="space-y-1">
                              <h3 className="text-[10px] font-bold text-zinc-950 uppercase tracking-wider">// SUMMARY</h3>
                              <p className="text-[10px] text-zinc-600 leading-relaxed font-sans">{summary}</p>
                            </div>
                          )}

                          {experience.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-[10px] font-bold text-zinc-950 uppercase tracking-wider">// EXPERIENCE</h3>
                              <div className="space-y-3 font-sans">
                                {experience.map((exp, idx) => (
                                  <div key={idx} className="text-[10px] text-zinc-600 leading-relaxed">
                                    {exp.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {education.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-[10px] font-bold text-zinc-950 uppercase tracking-wider">// EDUCATION</h3>
                              <div className="space-y-2 font-sans">
                                {education.map((edu, idx) => (
                                  <div key={idx} className="text-[10px] text-zinc-600 leading-relaxed">
                                    {edu.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {skills.length > 0 && (
                            <div className="space-y-1">
                              <h3 className="text-[10px] font-bold text-zinc-950 uppercase tracking-wider">// SKILLS</h3>
                              <p className="text-[10px] text-zinc-600 leading-relaxed">
                                {skills.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-6">
                    <ModernButton onClick={handleExportPDF} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/25">
                      <FileText className="h-5 w-5" /> Export to PDF
                    </ModernButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ADD ENTRY GLASS MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-900/90 border border-white/10 p-8 rounded-3xl shadow-2xl relative"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="text-purple-400" size={20} />
                Add Record Entry
              </h3>
              
              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Section Category</label>
                  <button
                    type="button"
                    onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                    className="w-full bg-zinc-950/60 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-left text-sm text-white flex justify-between items-center transition-all focus:outline-none"
                  >
                    <span className="capitalize">{newSectionType}</span>
                    <ChevronDown className={`transform transition-transform ${showSectionDropdown ? 'rotate-180' : ''}`} size={16} />
                  </button>
                  
                  {showSectionDropdown && (
                    <div className="absolute left-0 right-0 mt-2 z-50 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                      {sectionTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setNewSectionType(type);
                            setShowSectionDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors capitalize ${newSectionType === type ? 'text-purple-400 font-semibold bg-white/5' : 'text-zinc-300'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Content Details</label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Provide information or detailed description..."
                    className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <ModernButton onClick={handleAddEntry} disabled={isAdding || !newContent.trim()}>
                  {isAdding ? 'Adding Entry...' : 'Add Entry'}
                </ModernButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
