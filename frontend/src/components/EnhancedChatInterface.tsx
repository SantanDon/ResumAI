import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCV } from './UploadCV';
import { Button, Card, Badge, Input } from './ui';
import { Icons } from './ui/Icons';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'cv-preview' | 'action' | 'cover-letter';
}

interface CVData {
  personalInfo: any;
  experience: any[];
  education: any[];
  skills: any[];
  projects?: any[];
  improvements?: string[];
  enhancementScore?: number;
}

interface CoverLetterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (jobTitle: string, companyName: string, jobDescription?: string) => void;
  isLoading: boolean;
}

const CoverLetterDialog: React.FC<CoverLetterDialogProps> = ({ isOpen, onClose, onGenerate, isLoading }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = () => {
    if (jobTitle.trim() && companyName.trim()) {
      onGenerate(jobTitle, companyName, jobDescription || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Icons.FileText className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Generate Cover Letter</h3>
              <p className="text-xs text-white/70">Natural, human-sounding letters</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <Icons.X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/85 mb-1.5">Job Title *</label>
            <Input
              variant="glass"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-white/85 mb-1.5">Company Name *</label>
            <Input
              variant="glass"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-white/85 mb-1.5">Job Description (optional)</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description for a more tailored letter..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 resize-none h-24 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!jobTitle.trim() || !companyName.trim() || isLoading}
            isLoading={isLoading}
            className="flex-1"
            leftIcon={!isLoading && <Icons.Sparkles size={16} />}
          >
            Generate
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface EnhancedChatInterfaceProps {
  onBack: () => void;
  userId?: string;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({ onBack, userId: initialUserId = 'demo@resumai.com' }) => {
  const [userId, setUserId] = useState<string>(initialUserId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'upload' | 'chat'>('upload');
  const [parsingComplete, setParsingComplete] = useState(false);
  const [regeneratedCV, setRegeneratedCV] = useState<CVData | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('technology');
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const industries = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'engineering', name: 'Engineering', icon: '⚙️' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'legal', name: 'Legal', icon: '⚖️' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkExistingCV = async () => {
      if (!userId) return;
      try {
        const response = await fetch('/api/cv/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await response.json();
        if (data.success && data.summary) {
          setView('chat');
          setParsingComplete(true);
          setMessages(prev => {
            if (prev.length === 0) {
              return [{
                id: `sys_${Date.now()}`,
                role: 'system',
                content: `✨ **Welcome back to CV Assistant!**\n\n${data.summary.overview}\n\n**Your Top Skills:** ${data.summary.keySkills.slice(0, 5).join(', ')}\n\nI can help you:\n• 🔄 Regenerate your CV in Harvard format\n• ✨ Enhance bullet points with power words\n• 🎯 Tailor for specific jobs\n• 📊 Analyze ATS compatibility`,
                timestamp: new Date(),
                type: 'text'
              }];
            }
            return prev;
          });
        }
      } catch (error) {
        console.log('No existing CV for user:', userId);
      }
    };
    checkExistingCV();
  }, [userId]);

  const addMessage = (role: Message['role'], content: string, type?: Message['type']) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      role,
      content,
      timestamp: new Date(),
      type: type || 'text'
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleCVParsed = (parsedUserId: string) => {
    setUserId(parsedUserId);
    setParsingComplete(true);
  };

  const handleProceedToChat = async () => {
    if (!parsingComplete) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/cv/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        setView('chat');
        addMessage('system', `✨ **Welcome to CV Assistant!**\n\n${data.summary.overview}\n\n**Your Top Skills:** ${data.summary.keySkills.slice(0, 5).join(', ')}\n\nI can help you:\n• 🔄 Regenerate your CV in Harvard format\n• ✨ Enhance bullet points with power words\n• 🎯 Tailor for specific jobs\n• 📊 Analyze ATS compatibility`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim() || isLoading) return;
    addMessage('user', text);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/cv/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text }),
      });
      const data = await response.json();
      if (data.success) {
        addMessage('assistant', data.response);
      }
    } catch (error) {
      addMessage('assistant', 'Sorry, there was an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCV = async () => {
    setIsLoading(true);
    addMessage('user', `🔄 Regenerate my CV in Harvard format for ${selectedIndustry}`);

    try {
      const response = await fetch('/api/cv/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, industry: selectedIndustry }),
      });
      const data = await response.json();
      
      if (data.success) {
        setRegeneratedCV(data.cv);
        const improvements = data.cv.improvements?.join('\n• ') || 'Applied Harvard format';
        addMessage('assistant', `✅ **CV Regenerated Successfully!**\n\n**Enhancement Score:** ${data.cv.enhancementScore}/100\n\n**Improvements Made:**\n• ${improvements}\n\nYour CV now follows Harvard OCS guidelines and 2024-2025 best practices for maximum ATS compatibility.`, 'cv-preview');
      }
    } catch (error) {
      addMessage('assistant', 'Error regenerating CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceBullet = async () => {
    setIsLoading(true);
    addMessage('user', '✨ Enhance my CV bullet points');

    try {
      const response = await fetch('/api/cv/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        addMessage('assistant', `✨ **Enhancement Suggestions:**\n\n${data.suggestions.join('\n\n')}`);
      }
    } catch (error) {
      addMessage('assistant', 'Error enhancing CV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleATSCheck = async () => {
    setIsLoading(true);
    addMessage('user', '📊 Check ATS compatibility');

    try {
      const response = await fetch('/api/cv/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        const { score, issues, recommendations } = data.analysis;
        const issuesList = issues.slice(0, 3).map((i: any) => `• **${i.type}:** ${i.message}`).join('\n');
        addMessage('assistant', `📊 **ATS Compatibility Score: ${score}/100**\n\n${score >= 80 ? '✅ Great!' : score >= 60 ? '⚠️ Needs improvement' : '❌ Significant issues'}\n\n**Issues Found:**\n${issuesList || 'None!'}\n\n**Recommendations:**\n${recommendations.slice(0, 2).join('\n')}`);
      }
    } catch (error) {
      addMessage('assistant', 'Error checking ATS compatibility.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!regeneratedCV) return;
    
    setIsLoading(true);
    addMessage('user', '📥 Download CV as PDF');

    try {
      const response = await fetch('/api/cv/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData: regeneratedCV }),
      });
      const data = await response.json();
      
      if (data.success) {
        // Convert base64 to blob and trigger download
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename || 'CV.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        addMessage('assistant', `✅ **PDF Downloaded!**\n\nYour CV has been saved as "${data.filename}". The PDF is ATS-optimized with selectable text for maximum compatibility.`);
      }
    } catch (error) {
      addMessage('assistant', 'Error generating PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCoverLetter = async (jobTitle: string, companyName: string, jobDescription?: string) => {
    setIsLoading(true);
    setShowCoverLetterDialog(false);
    addMessage('user', `📝 Generate cover letter for ${jobTitle} at ${companyName}`);

    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          jobTitle, 
          companyName, 
          jobDescription 
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setGeneratedCoverLetter(data.coverLetter);
        const skillsText = data.matchedSkills?.length > 0 
          ? `\n\n**Matched Skills:** ${data.matchedSkills.join(', ')}` 
          : '';
        const suggestionsText = data.suggestions?.length > 0 
          ? `\n\n**Tips:** ${data.suggestions.join(' • ')}` 
          : '';
        
        addMessage('assistant', `✅ **Cover Letter Generated!**\n\n**Word Count:** ${data.wordCount}${skillsText}${suggestionsText}\n\n---\n\n${data.coverLetter}`, 'cover-letter');
      } else {
        addMessage('assistant', `Error: ${data.error || 'Failed to generate cover letter'}`);
      }
    } catch (error) {
      addMessage('assistant', 'Error generating cover letter. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCoverLetter = () => {
    if (generatedCoverLetter) {
      navigator.clipboard.writeText(generatedCoverLetter);
      addMessage('system', '📋 Cover letter copied to clipboard!');
    }
  };

  const quickActions = [
    { label: 'Regenerate CV', icon: Icons.Zap, action: handleRegenerateCV, variant: 'primary' as const },
    { label: 'Cover Letter', icon: Icons.FileText, action: () => setShowCoverLetterDialog(true), variant: 'secondary' as const },
    { label: 'Enhance Bullets', icon: Icons.Sparkles, action: handleEnhanceBullet, variant: 'secondary' as const },
    { label: 'ATS Check', icon: Icons.Target, action: handleATSCheck, variant: 'secondary' as const },
  ];

  const quickPrompts = [
    "What are my strongest skills?",
    "How can I improve my summary?",
    "Suggest job titles for me",
    "Find gaps in my experience"
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button variant="ghost" onClick={onBack} leftIcon={<Icons.ArrowLeft size={18} />}>
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Icons.Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">CV Assistant</h1>
              <p className="text-xs text-white/70">Powered by AI</p>
            </div>
          </div>
          
          <div className="w-24" />
        </motion.div>

        {/* Upload View */}
        <AnimatePresence mode="wait">
          {view === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <Card variant="glass" padding="lg" className="border-white/10">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/30 flex items-center justify-center border border-primary-500/20">
                    <Icons.Upload className="text-primary-400" size={36} />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Upload Your CV</h2>
                  <p className="text-white/70">Get AI-powered insights and enhancements</p>
                </div>
                
                <UploadCV onCVParsed={handleCVParsed} />
                
                <div className="mt-8">
                  <Button
                    onClick={handleProceedToChat}
                    disabled={!parsingComplete}
                    isLoading={isLoading}
                    variant="primary"
                    size="lg"
                    className="w-full"
                    rightIcon={!isLoading && <Icons.ArrowRight size={18} />}
                  >
                    {isLoading ? 'Analyzing...' : 'Start Chat'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Chat View */}
          {view === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-4 gap-6"
            >
              {/* Main Chat Area */}
              <div className="lg:col-span-3">
                <Card variant="glass" padding="none" className="flex flex-col h-[700px] overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="success" size="sm" dot>Online</Badge>
                      <span className="text-sm text-white/85">AI Assistant</span>
                    </div>
                    
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowIndustrySelector(!showIndustrySelector)}
                        rightIcon={<Icons.ChevronDown size={14} />}
                      >
                        {industries.find(i => i.id === selectedIndustry)?.icon}{' '}
                        {industries.find(i => i.id === selectedIndustry)?.name}
                      </Button>
                      
                      <AnimatePresence>
                        {showIndustrySelector && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 z-50 bg-zinc-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-2 shadow-2xl min-w-[180px]"
                          >
                            {industries.map(ind => (
                              <button
                                key={ind.id}
                                onClick={() => { setSelectedIndustry(ind.id); setShowIndustrySelector(false); }}
                                className={cn(
                                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all',
                                  selectedIndustry === ind.id 
                                    ? 'bg-primary-500/20 text-primary-300' 
                                    : 'text-white/85 hover:bg-white/5'
                                )}
                              >
                                <span>{ind.icon}</span>
                                <span>{ind.name}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                        >
                          <div className={cn('max-w-[85%]', msg.role === 'user' ? 'order-2' : 'order-1')}>
                            {msg.role !== 'user' && (
                              <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <Icons.Sparkles className="text-white" size={12} />
                              </div>
                              <span className="text-xs text-white/70">AI Assistant</span>
                              </div>
                            )}
                            <div className={cn(
                              'p-4 rounded-2xl text-sm leading-relaxed',
                              msg.role === 'user'
                              ? 'bg-primary-500 text-white rounded-br-md'
                              : msg.role === 'system'
                              ? 'bg-info/10 text-white border border-info/20 rounded-bl-md'
                              : 'bg-white/5 text-white/90 border border-white/10 rounded-bl-md'
                            )}>
                              {msg.role === 'user' ? (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                              ) : (
                                <div 
                                  className="prose prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: msg.content }}
                                />
                              )}
                            </div>
                            <div className={cn('text-xs text-white/60 mt-1', msg.role === 'user' ? 'text-right' : '')}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing Indicator */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-md">
                          <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Prompts */}
                  <div className="px-4 pb-2">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          disabled={isLoading}
                          className="whitespace-nowrap px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/85 text-xs rounded-full border border-white/10 transition-all hover:border-white/20 disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-3">
                      <Input
                        variant="glass"
                        inputSize="lg"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask me anything about your CV..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !inputValue.trim()}
                        variant="primary"
                        size="lg"
                        rightIcon={<Icons.Send size={18} />}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Quick Actions */}
                <Card variant="glass" padding="md">
                  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {quickActions.map((action, idx) => (
                      <Button
                        key={idx}
                        onClick={action.action}
                        disabled={isLoading}
                        variant={action.variant}
                        size="md"
                        className="w-full justify-start"
                        leftIcon={<action.icon size={16} />}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* CV Preview Card */}
                <AnimatePresence>
                  {regeneratedCV && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card variant="glass" padding="md">
                        <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                          Regenerated CV
                        </h3>
                        <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-3.5 text-zinc-200 text-xs max-h-64 overflow-y-auto space-y-3 font-sans">
                          <div className="text-center border-b border-white/5 pb-2 mb-2">
                            <div className="font-bold text-white text-sm">{regeneratedCV.personalInfo?.fullName}</div>
                            <div className="text-zinc-400 text-[10px] mt-0.5">{regeneratedCV.personalInfo?.email}</div>
                          </div>
                          {regeneratedCV.experience?.slice(0, 2).map((exp: any, idx: number) => (
                            <div key={idx} className="bg-white/5 border border-white/5 p-2 rounded-lg">
                              <div className="font-bold text-[10px] text-white">{exp.role}</div>
                              <div className="text-zinc-400 text-[9px] mt-0.5">{exp.company}</div>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          className="w-full mt-3"
                          leftIcon={<Icons.Download size={14} />}
                          onClick={handleDownloadPDF}
                          isLoading={isLoading}
                        >
                          Download PDF
                        </Button>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cover Letter Preview Card */}
                <AnimatePresence>
                  {generatedCoverLetter && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card variant="glass" padding="md">
                        <h3 className="text-xs font-semibold text-white/77 uppercase tracking-wider mb-3">
                          Cover Letter
                        </h3>
                        <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-3.5 text-zinc-300 text-xs max-h-48 overflow-y-auto font-sans leading-relaxed">
                          <div className="whitespace-pre-wrap">{generatedCoverLetter.substring(0, 300)}...</div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-3"
                          leftIcon={<Icons.Copy size={14} />}
                          onClick={handleCopyCoverLetter}
                        >
                          Copy to Clipboard
                        </Button>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats Card */}
                <Card variant="glass" padding="md">
                  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                    Session Stats
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Messages</span>
                      <span className="text-white font-medium">{messages.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Industry</span>
                      <Badge variant="primary" size="sm">
                        {industries.find(i => i.id === selectedIndustry)?.name}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cover Letter Dialog */}
      <AnimatePresence>
        <CoverLetterDialog
          isOpen={showCoverLetterDialog}
          onClose={() => setShowCoverLetterDialog(false)}
          onGenerate={handleGenerateCoverLetter}
          isLoading={isLoading}
        />
      </AnimatePresence>
    </div>
  );
};
