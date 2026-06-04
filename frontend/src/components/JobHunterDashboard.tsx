import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Icons } from './ui/Icons';

// Import child components
import { MassApplyInterface } from './MassApplyInterface';
import { EnhancedChatInterface } from './EnhancedChatInterface';
import { MassMailInterface } from './MassMailInterface';
import { CVEditor } from './CVEditor';
import { MasterCVViewer } from './MasterCVViewer';
import { UploadCV } from './UploadCV';
import { AgentControlCenter } from './AgentControlCenter';

type Tab = 'scout' | 'agent' | 'evolution' | 'chat' | 'applications' | 'settings';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

export function JobHunterDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('agent');
  
  // Agent Chat States
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('Consensus Swarm (Ollama)');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [parsedUserId, setParsedUserId] = useState<string>('demo@resumai.com');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  
  // CV Evolution sub-tabs
  const [evolutionTab, setEvolutionTab] = useState<'upload' | 'edit' | 'preview'>('upload');



  useEffect(() => {
    if (user?.email) {
      setParsedUserId(user.email);
    } else {
      setParsedUserId('demo@resumai.com');
    }
  }, [user]);

  // References for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAgentLoading]);

  // Handle Logout
  const handleLogout = () => {
    logout();
    localStorage.removeItem('resumai_demo');
    window.location.reload();
  };

  // Model selection options
  const models = [
    'Consensus Swarm (Ollama)',
    'Llama 3.2 1B (Single)',
    'Claude 3.5 Sonnet (Mock)'
  ];

  // Quick prompt suggestions
  const suggestions = [
    { text: 'Optimize my CV for a senior tech role', query: 'Optimize my CV for a senior tech role using power verbs and quantified metrics.' },
    { text: 'Check my ATS compatibility score', query: 'Please run an ATS compatibility check on my CV and identify missing skills.' },
    { text: 'Identify career gaps or skill shortages', query: 'Analyze my experience list to find potential career gaps or missing technical skills.' },
    { text: 'Draft an outreach email to a recruiter', query: 'Draft a professional cold email to a tech recruiter expressing interest in Software Engineering roles.' }
  ];

  // Handle File Upload and Parse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      setAttachedFileName(file.name);
      
      // Auto-upload and parse in background
      setIsUploading(true);
      const formData = new FormData();
      formData.append('cv', file);

      try {
        const response = await fetch('http://localhost:3001/api/cv/parse', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          setParsedUserId(data.userId);
          // Show a local chat message notifying the user
          setChatMessages(prev => [
            ...prev,
            {
              id: `sys_${Date.now()}`,
              role: 'system',
              content: `📎 CV parsed successfully! Loaded as active resume profile. (User ID: ${data.userId})`,
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('File parsing failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setAttachedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit query in ResumAI Agent View
  const handleSendAgentMessage = async (queryText = inputText) => {
    if (!queryText.trim() && !attachedFile) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAgentLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/cv/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: parsedUserId, 
          message: queryText,
          model: selectedModel
        }),
      });
      const data = await response.json();
      
      const assistantMsg: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.success ? data.response : 'Sorry, I encountered an issue connecting to the AI Swarm backend.',
        timestamp: new Date(),
        modelUsed: selectedModel
      };

      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      // Mock fallback if server is down or during development
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: `ai_fallback_${Date.now()}`,
          role: 'assistant',
          content: `I received your request: "${queryText}".\n\n(Swarm Engine offline fallback) Here's a brief response: Since I'm currently running in demo mode, please make sure your local Ollama server is running (\`ollama serve\`) and that you have pulled the required model (\`ollama pull llama3.2:1b\`). Once the backend server is active, I will utilize the 5-worker consensus swarm to analyze your resume with high-fidelity consensus voting.`,
          timestamp: new Date(),
          modelUsed: selectedModel
        };
        setChatMessages(prev => [...prev, fallbackMsg]);
      }, 1000);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Navigation Items Sidebar rendering
  const navigationItems = [
    { id: 'agent', label: 'ResumAI Agent', icon: Icons.Sparkles },
    { id: 'scout', label: 'Scout Jobs', icon: Icons.Briefcase },
    { id: 'evolution', label: 'CV Evolution', icon: Icons.FileText },
    { id: 'chat', label: 'CV Chat', icon: Icons.MessageSquare },
    { id: 'applications', label: 'Applications', icon: Icons.Send },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans">
      
      {/* LEFT SIDEBAR: Kimi Interface Style */}
      <aside className="w-64 flex flex-col bg-zinc-950 border-r border-zinc-900 h-full select-none flex-shrink-0">
        
        {/* Brand/Logo Section */}
        <div className="p-6 flex items-center gap-3 border-b border-zinc-900/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Icons.Sparkles className="text-white" size={16} />
          </div>
          <div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              ResumAI
            </span>
            <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-widest mt-[-2px]">
              Swarm Platform
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/5 border border-white/10 text-white font-medium shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`transition-transform group-hover:scale-105 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`} size={20} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile & logout bottom panel */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/90">
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              {user && user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                  <Icons.User className="text-violet-400" size={16} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-white">{user ? user.name : 'Demo Profile'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user ? user.email : 'local@demo.mode'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-zinc-400 transition-colors ml-1"
            >
              <Icons.ChevronRight className="rotate-180" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
        
        {/* Decorative subtle background glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-900/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-900/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Tab Selection Switch */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.8 }}
              className="h-full"
            >
              {/* Scout Jobs Tab */}
              {activeTab === 'scout' && (
                <MassApplyInterface onBack={() => setActiveTab('agent')} userId={parsedUserId} />
              )}

              {/* CV Chat Tab */}
              {activeTab === 'chat' && (
                <EnhancedChatInterface onBack={() => setActiveTab('agent')} userId={parsedUserId} />
              )}

              {/* Applications (Mass Mail) Tab */}
              {activeTab === 'applications' && (
                <MassMailInterface onBack={() => setActiveTab('agent')} />
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-8 max-w-4xl mx-auto space-y-8 w-full max-w-full px-8 md:px-16 lg:px-24">
                  <div className="flex items-center gap-3 mb-6">
                    <Icons.Settings className="text-violet-400" size={32} />
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
                      <p className="text-sm text-zinc-400">Configure your local swarm architecture and parameters</p>
                    </div>
                  </div>

                  {/* Models Section */}
                  <div className="lumen-container rounded-3xl p-6 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                      <Icons.Rocket className="text-violet-400" size={18} />
                      Swarm Consensus Configuration
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-zinc-300 font-semibold mb-2">Primary Swarm Consensus Model</label>
                        <select 
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
                        >
                          {models.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <p className="text-xs text-zinc-500 mt-2">The model used by the swarm worker nodes for voting consensus (Consensus requires 5 running instances of llama3.2:1b)</p>
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-300 font-semibold mb-2">Local Ollama Instance URL</label>
                        <input 
                          type="text" 
                          defaultValue="http://localhost:11434"
                          className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                        <p className="text-xs text-zinc-500 mt-2">The URL hosting the Ollama server for LLM worker distribution</p>
                      </div>
                    </div>
                  </div>

                  {/* Security & System Info */}
                  <div className="lumen-container rounded-3xl p-6 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                      <Icons.Check className="text-pink-400" size={18} />
                      Platform Security & Privacy
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Icons.Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">Local Data Preservation</p>
                          <p className="text-xs text-zinc-400">All resume analysis remains cached in your local SQLite store CWD server database. Your CV metrics never exit your environment.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Icons.Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">Local Sandboxing Enabled</p>
                          <p className="text-xs text-zinc-400">SMTP and mass mailings check safety guidelines via the Swarm consensus voting engine before delivery dispatch.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CV Evolution Tab (Consolidated editor and viewer) */}
              {activeTab === 'evolution' && (
                <div className="h-full flex flex-col bg-transparent w-full max-w-full px-8 md:px-16 lg:px-24">
                  {/* Header Navigation Tab Menu */}
                  <div className="py-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">CV Evolution</h1>
                      <p className="text-xs text-zinc-400">Upload, tweak, and download ATS-ready Harvard formatted documents</p>
                    </div>
                    
                    {/* Switcher Buttons */}
                    <div className="flex bg-zinc-900/60 border border-white/5 p-1 rounded-xl">
                      <button 
                        onClick={() => setEvolutionTab('upload')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          evolutionTab === 'upload' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Upload CV
                      </button>
                      <button 
                        onClick={() => setEvolutionTab('edit')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          evolutionTab === 'edit' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        CV Wizard Editor
                      </button>
                      <button 
                        onClick={() => setEvolutionTab('preview')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          evolutionTab === 'preview' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Master CV Viewer
                      </button>
                    </div>
                  </div>

                  {/* Evolution Views */}
                  <div className="flex-1 overflow-y-auto py-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={evolutionTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      >
                        {evolutionTab === 'upload' && (
                          <div className="p-8 max-w-2xl mx-auto mt-8 lumen-container rounded-3xl">
                            <div className="text-center mb-8">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
                                <Icons.FileText className="text-white" size={24} />
                              </div>
                              <h2 className="text-2xl font-bold text-white">Upload and Parse Your CV</h2>
                              <p className="text-sm text-zinc-400 mt-2">Our AI Swarm parses your PDF resume and populates the master profile database database records automatically.</p>
                            </div>
                            <UploadCV onCVParsed={(uid) => {
                              setParsedUserId(uid);
                              setEvolutionTab('edit');
                            }} onFileSelect={() => {}} />
                          </div>
                        )}
                        {evolutionTab === 'edit' && (
                          <CVEditor onBack={() => setEvolutionTab('upload')} />
                        )}
                        {evolutionTab === 'preview' && (
                          <div className="p-4">
                            <MasterCVViewer userId={parsedUserId} />
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ResumAI Agent (Autonomous Command Center) */}
              {activeTab === 'agent' && (
                <AgentControlCenter userId={parsedUserId} onBack={() => setActiveTab('scout')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
