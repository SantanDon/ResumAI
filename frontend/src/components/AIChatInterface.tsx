import React, { useState, useEffect, useRef } from 'react';
import { UploadCV } from './UploadCV';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CVSummary {
  overview: string;
  keySkills: string[];
  experience: string[];
}

interface TailoringResult {
  message: string;
  pdfPath?: string;
  changeLog: { type: 'added' | 'removed' | 'modified'; item: string; reason: string }[];
}

interface AIChatInterfaceProps {
  onBack: () => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onBack }) => {
  const [userId, setUserId] = useState<string>('default');
  const [cvSummary, setCvSummary] = useState<CVSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJobTailorInput, setShowJobTailorInput] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<'upload' | 'chat'>('upload');
  const [parsingComplete, setParsingComplete] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        setCvSummary(data.summary);
        setView('chat');
        setMessages([
          {
            role: 'system',
            content: `✨ **CV Summary**\n\n${data.summary.overview}\n\n**Key Skills:** ${data.summary.keySkills.join(', ')}`,
          },
        ]);
      } else {
        console.error('Failed to fetch summary:', data.error);
      }
    } catch (error) {
      console.error('Error fetching CV summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
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
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceCV = async () => {
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: 'Enhance My CV' },
    ]);

    try {
      const response = await fetch('http://localhost:3001/api/cv/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `✨ **Enhancement Complete!**\n\n${data.suggestions.join('\n\n')}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error enhancing CV.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTailorForJob = async () => {
    if (!jobDescription.trim()) return;

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: `Tailor for Job: ${jobDescription.slice(0, 100)}...` },
    ]);

    try {
      const response = await fetch('http://localhost:3001/api/cv/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobDescription }),
      });
      const data = await response.json();
      
      if (data.success) {
        const result: TailoringResult = data.result;
        const changeLogText = result.changeLog
          .map((c) => `• **${c.type.toUpperCase()}**: ${c.item}\n  _Reason: ${c.reason}_`)
          .join('\n\n');

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `${result.message}\n\n**Change Log:**\n${changeLogText}\n\n${
              result.pdfPath ? `📄 [Download Tailored CV](${result.pdfPath})` : ''
            }`,
          },
        ]);
        setShowJobTailorInput(false);
        setJobDescription('');
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error tailoring CV.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "What are my strongest skills?",
    "How can I improve my summary?",
    "Suggest 3 job titles for me",
    "Find gaps in my experience"
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 glass rounded-xl text-white hover:bg-white/20 transition-all"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">💬 CV Chat Assistant</h1>
          <div className="w-24"></div>
        </div>

        {view === 'upload' && (
          <div className="glass rounded-3xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              Upload Your CV to Start
            </h2>
            <UploadCV onCVParsed={handleCVParsed} />
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleProceedToChat}
                disabled={!parsingComplete || isLoading}
                className={`
                  px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2
                  ${parsingComplete 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg hover:shadow-green-500/30 transform hover:scale-105 cursor-pointer' 
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600'}
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Proceed to Chat 🚀
                  </>
                )}
              </button>
            </div>
            {!parsingComplete && (
              <p className="text-center text-gray-500 mt-3 text-sm">
                Please upload a CV to proceed
              </p>
            )}
          </div>
        )}

        {view === 'chat' && cvSummary && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Chat Area */}
            <div className="md:col-span-2 glass rounded-3xl p-6 flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : msg.role === 'system'
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                          : 'glass-dark text-gray-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="glass-dark p-4 rounded-2xl">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-4 py-2 glass-dark hover:bg-white/10 text-purple-300 text-sm rounded-full border border-purple-500/30 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Job Tailor Input */}
              {showJobTailorInput && (
                <div className="mb-4 glass-dark p-4 rounded-xl">
                  <label className="text-white font-medium mb-2 block">
                    Paste Job Description:
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                    placeholder="Paste the job description here..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleTailorForJob}
                      disabled={isLoading || !jobDescription.trim()}
                      className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      Tailor CV
                    </button>
                    <button
                      onClick={() => setShowJobTailorInput(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your CV..."
                  className="flex-1 p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Context & Quick Actions */}
            <div className="space-y-4">
              {/* CV Summary Card */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">
                  📊 CV Overview
                </h3>
                <p className="text-gray-200 text-sm mb-4">{cvSummary.overview}</p>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Top Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {cvSummary.keySkills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-pink-300 mb-4">
                  ⚡ Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEnhanceCV}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    ✨ Enhance My CV
                  </button>
                  <button
                    onClick={() => setShowJobTailorInput(true)}
                    disabled={isLoading || showJobTailorInput}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    🎯 Tailor for Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
