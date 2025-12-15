import React, { useState, useEffect, useRef } from 'react';
import { UploadCV } from './UploadCV';
import { Icons } from './ui/Icons';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'cv-preview' | 'action';
}

interface CVData {
  personalInfo: any;
  experience: any[];
  education: any[];
  skills: any[];
  projects?: any[];
}

interface EnhancedChatInterfaceProps {
  onBack: () => void;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({ onBack }) => {
  const [userId, setUserId] = useState<string>('default');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'upload' | 'chat'>('upload');
  const [parsingComplete, setParsingComplete] = useState(false);
  const [regeneratedCV, setRegeneratedCV] = useState<CVData | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('technology');
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
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
      const response = await fetch('http://localhost:3001/api/cv/summary', {
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
      const response = await fetch('http://localhost:3001/api/cv/chat', {
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
      const response = await fetch('http://localhost:3001/api/cv/regenerate', {
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
      const response = await fetch('http://localhost:3001/api/cv/enhance', {
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
      const response = await fetch('http://localhost:3001/api/cv/ats-check', {
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


  const quickActions = [
    { label: '🔄 Regenerate CV', action: handleRegenerateCV, color: 'from-violet-500 to-purple-600' },
    { label: '✨ Enhance Bullets', action: handleEnhanceBullet, color: 'from-pink-500 to-rose-600' },
    { label: '📊 ATS Check', action: handleATSCheck, color: 'from-cyan-500 to-blue-600' },
  ];

  const quickPrompts = [
    "What are my strongest skills?",
    "How can I improve my summary?",
    "Suggest job titles for me",
    "Find gaps in my experience"
  ];

  return (
    <div className="min-h-screen">

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-all">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Icons.Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CV Assistant</h1>
                <p className="text-xs text-purple-300">Powered by AI</p>
              </div>
            </div>
            <div className="w-24"></div>
          </div>

          {view === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Icons.Upload className="text-white" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Upload Your CV</h2>
                  <p className="text-purple-200/70">Get AI-powered insights and enhancements</p>
                </div>
                
                <UploadCV onCVParsed={handleCVParsed} />
                
                <div className="mt-8">
                  <button
                    onClick={handleProceedToChat}
                    disabled={!parsingComplete || isLoading}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3
                      ${parsingComplete 
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-[1.02]' 
                        : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}`}
                  >
                    {isLoading ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                    ) : (
                      <>Start Chat <span className="text-xl">→</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}


          {view === 'chat' && (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Main Chat Area */}
              <div className="lg:col-span-3 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col h-[700px]">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-white font-medium">AI Assistant Online</span>
                  </div>
                  <button
                    onClick={() => setShowIndustrySelector(!showIndustrySelector)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 text-sm transition-all"
                  >
                    {industries.find(i => i.id === selectedIndustry)?.icon} {industries.find(i => i.id === selectedIndustry)?.name}
                    <span className="text-xs">▼</span>
                  </button>
                </div>

                {/* Industry Selector Dropdown */}
                {showIndustrySelector && (
                  <div className="absolute right-8 top-48 z-50 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/10 p-2 shadow-2xl">
                    {industries.map(ind => (
                      <button
                        key={ind.id}
                        onClick={() => { setSelectedIndustry(ind.id); setShowIndustrySelector(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-all ${selectedIndustry === ind.id ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5'}`}
                      >
                        <span>{ind.icon}</span>
                        <span>{ind.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                        {msg.role !== 'user' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Icons.Sparkles className="text-white" size={12} /></div>
                            <span className="text-xs text-purple-300">AI Assistant</span>
                          </div>
                        )}
                        <div className={`p-4 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-md'
                            : msg.role === 'system'
                            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-400/20 rounded-bl-md'
                            : 'bg-white/5 text-white/90 border border-white/10 rounded-bl-md'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                        </div>
                        <div className={`text-xs text-white/30 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-md">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
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
                        className="whitespace-nowrap px-4 py-2 bg-white/5 hover:bg-white/10 text-purple-300 text-sm rounded-full border border-purple-500/20 transition-all hover:border-purple-500/40"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask me anything about your CV..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !inputValue.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>


              {/* Sidebar */}
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={action.action}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 bg-gradient-to-r ${action.color} text-white font-medium rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CV Preview Card */}
                {regeneratedCV && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Regenerated CV</h3>
                    <div className="bg-white rounded-lg p-3 text-black text-xs max-h-64 overflow-y-auto">
                      <div className="text-center border-b pb-2 mb-2">
                        <div className="font-bold">{regeneratedCV.personalInfo?.fullName}</div>
                        <div className="text-gray-600 text-[10px]">{regeneratedCV.personalInfo?.email}</div>
                      </div>
                      {regeneratedCV.experience?.slice(0, 2).map((exp: any, idx: number) => (
                        <div key={idx} className="mb-2">
                          <div className="font-semibold text-[10px]">{exp.role}</div>
                          <div className="text-gray-500 text-[9px]">{exp.company}</div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">
                      📥 Download PDF
                    </button>
                  </div>
                )}

                {/* Stats Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Session Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Messages</span>
                      <span className="text-white font-medium">{messages.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Industry</span>
                      <span className="text-purple-300 font-medium">{industries.find(i => i.id === selectedIndustry)?.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
