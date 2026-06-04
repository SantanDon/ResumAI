import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './ui/Icons';
// @ts-ignore
import agentBanner from '../assets/agent_dashboard_banner.png';

interface AgentControlCenterProps {
  userId: string;
  onBack?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function AgentControlCenter({ userId, onBack }: AgentControlCenterProps) {
  // States
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [agentReport, setAgentReport] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  const [requireHumanReview, setRequireHumanReview] = useState(true);
  const [targetRole, setTargetRole] = useState('Full Stack Engineer');
  const [preferredTone, setPreferredTone] = useState('professional');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isEnhancing, setIsEnhancing] = useState<number | null>(null);
  const [appliedEnhancements, setAppliedEnhancements] = useState<number[]>([]);
  const [addedSkills, setAddedSkills] = useState<number[]>([]);
  const [isAddingSkill, setIsAddingSkill] = useState<number | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [isCheckingAutomation, setIsCheckingAutomation] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState(false);
  const [expandedJobDesc, setExpandedJobDesc] = useState(false);

  // Custom Job outreach states
  const [customTitle, setCustomTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customRecruiterEmail, setCustomRecruiterEmail] = useState('');
  const [customJobDescription, setCustomJobDescription] = useState('');
  const [activeReportTab, setActiveReportTab] = useState<'scout' | 'custom'>('scout');
  const [customReport, setCustomReport] = useState<any>(null);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const fetchDiagnostics = async (uid = userId) => {
    setIsDiagnosing(true);
    try {
      const response = await fetch(`/api/hunter/agent/diagnose/${uid}`);
      const data = await response.json();
      if (data.success && data.diagnostics) {
        setDiagnostics(data.diagnostics);
        setAutoApply(!!data.diagnostics.settings.autoApplyEnabled);
        setRequireHumanReview(!!data.diagnostics.settings.requireHumanReview);
        setTargetRole(data.diagnostics.settings.targetRole || 'Full Stack Engineer');
        setPreferredTone(data.diagnostics.settings.preferredTone || 'professional');
      }
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleUpdateScoutSettings = async (updates: any) => {
    try {
      const response = await fetch(`/api/hunter/scout/settings/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        setDiagnostics((prev: any) => prev ? {
          ...prev,
          settings: {
            ...prev.settings,
            ...updates
          }
        } : null);
        if (updates.autoApply !== undefined) setAutoApply(updates.autoApply);
        if (updates.requireHumanReview !== undefined) setRequireHumanReview(updates.requireHumanReview);
        if (updates.targetRole !== undefined) setTargetRole(updates.targetRole);
        if (updates.preferredTone !== undefined) setPreferredTone(updates.preferredTone);
        showToast('Settings updated successfully!');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const runAgentCycle = async () => {
    setAgentStatus('running');
    setAgentReport(null);
    setAssessmentResult(null);
    setAppliedEnhancements([]);
    setAddedSkills([]);
    
    const newLogs = [
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating Autonomous Job Hunt pipeline for: ${userId}`,
      `[${new Date().toLocaleTimeString()}] 🤖 Configuring worker node consensus thresholds...`,
    ];
    setAgentLogs(newLogs);

    const logTick = (text: string) => {
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
    };

    setTimeout(() => logTick(`🔎 Sourcing fresh remote job listings from Adzuna & RemoteOK APIs...`), 1000);
    setTimeout(() => logTick(`📈 Fetching candidate Master CV profile from SQLite database...`), 2500);
    setTimeout(() => logTick(`🧬 Running consensus match scoring across 5 worker instances (llama3.2:1b)...`), 4000);
    setTimeout(() => logTick(`🎯 Identifying skills gaps and drafting resume optimization bullets...`), 5500);
    setTimeout(() => logTick(`📝 Generating tailored Cover Letter draft using "${preferredTone}" tone...`), 7000);
    setTimeout(() => logTick(`⚙️ Running human-verification automation assessment rules...`), 8500);
    
    try {
      const response = await fetch('/api/hunter/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      
      if (data.success && data.report) {
        logTick(`✅ Consensus cycle complete. Report generated!`);
        setAgentReport(data.report);
        setAgentStatus('completed');
        fetchDiagnostics();
      } else {
        logTick(`❌ Cycle failed: ${data.error || 'Unknown pipeline error'}`);
        setAgentStatus('error');
      }
    } catch (err) {
      logTick(`❌ Network communication error with Swarm orchestrator.`);
      setAgentStatus('error');
      console.error('Error running agent workflow:', err);
    }
  };

  const handleApplyEnhancement = async (originalBullet: string, improvedBullet: string, expectedImpact: number, index: number) => {
    setIsEnhancing(index);
    try {
      const response = await fetch('/api/hunter/evolution/apply-enhancement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          originalBullet,
          improvedBullet,
          expectedImpact
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAppliedEnhancements(prev => [...prev, index]);
        showToast('CV Experience updated successfully!');
      } else {
        showToast(data.error || 'Failed to update bullet point.', true);
      }
    } catch (err) {
      showToast('Error applying enhancement.', true);
      console.error('Error applying enhancement:', err);
    } finally {
      setIsEnhancing(null);
    }
  };

  const handleQueueJob = async () => {
    const report = activeReportTab === 'scout' ? agentReport : customReport;
    if (!report?.jobDetails) return;
    try {
      const { title, company, location, description, url } = report.jobDetails;
      const finalDescription = activeReportTab === 'custom' && customRecruiterEmail
        ? `Recruiter Email: ${customRecruiterEmail}\n\n${description}`
        : description;

      const response = await fetch('/api/hunter/apply/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          jobs: [
            {
              jobText: `Title: ${title}\nCompany: ${company}\nLocation: ${location}\nUrl: ${url}\n\n${finalDescription}`,
              jobUrl: url,
              title,
              company
            }
          ]
        }),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Job queued for automatic outreach successfully!');
        fetchDiagnostics();
      } else {
        showToast(data.error || 'Failed to queue job.', true);
      }
    } catch (err) {
      showToast('Error queueing job.', true);
      console.error('Error queueing job:', err);
    }
  };

  const handleAssessAutomation = async () => {
    const report = activeReportTab === 'scout' ? agentReport : customReport;
    if (!report?.jobDetails) return;
    setIsCheckingAutomation(true);
    setAssessmentResult(null);
    try {
      const response = await fetch('/api/hunter/apply/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobText: `${report.jobDetails.title}\n${report.jobDetails.company}\n${report.jobDetails.description}`,
          jobUrl: report.jobDetails.url
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAssessmentResult(data.assessment);
        showToast('Automation feasibility assessment complete!');
      } else {
        showToast('Failed to assess automation potential.', true);
      }
    } catch (err) {
      showToast('Error assessing automation.', true);
      console.error('Error assessing automation:', err);
    } finally {
      setIsCheckingAutomation(false);
    }
  };

  const handleAnalyzeCustomJob = async () => {
    if (!customJobDescription) {
      showToast('Please provide a job description.', true);
      return;
    }
    
    setIsAnalyzingCustom(true);
    setCustomReport(null);
    setAssessmentResult(null);
    
    const customLogs = [
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating Custom Application Analysis pipeline...`,
      `[${new Date().toLocaleTimeString()}] 📝 Sourcing provided job details: "${customTitle || 'Custom Role'}" at "${customCompany || 'Custom Company'}"`,
      `[${new Date().toLocaleTimeString()}] 📈 Fetching candidate Master CV profile from SQLite database...`,
      `[${new Date().toLocaleTimeString()}] 🧬 Running consensus match scoring across 5 worker instances (llama3.2:1b)...`,
      `[${new Date().toLocaleTimeString()}] 🎯 Identifying skills gaps and drafting resume optimization bullets...`,
      `[${new Date().toLocaleTimeString()}] 📝 Generating tailored Cover Letter draft...`,
    ];
    setAgentLogs(customLogs);

    const logTick = (text: string) => {
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
    };

    try {
      const response = await fetch('/api/hunter/agent/run-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          description: customJobDescription,
          title: customTitle,
          company: customCompany,
          url: customUrl,
          recruiterEmail: customRecruiterEmail
        }),
      });
      const data = await response.json();
      
      if (data.success && data.report) {
        logTick(`✅ Custom analysis complete. Report generated!`);
        setCustomReport(data.report);
        showToast('Custom job analyzed successfully!');
        fetchDiagnostics();
      } else {
        logTick(`❌ Custom analysis failed: ${data.error || 'Unknown pipeline error'}`);
        showToast(data.error || 'Failed to analyze custom job.', true);
      }
    } catch (err) {
      logTick(`❌ Network communication error with Swarm orchestrator.`);
      showToast('Error communicating with server.', true);
      console.error('Error analyzing custom job:', err);
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const handleAddSkillToCV = async (skill: string, bullet: string, index: number) => {
    setIsAddingSkill(index);
    try {
      const response = await fetch('/api/hunter/evolution/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cvVersion: 'v_evolving',
          changeType: 'add_skill',
          section: 'skill',
          oldContent: null,
          newContent: `${skill}: ${bullet}`,
          matchScoreBefore: 80,
          matchScoreAfter: 85
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAddedSkills(prev => [...prev, index]);
        showToast(`Added ${skill} experience to Master CV!`);
      } else {
        showToast('Failed to add skill.', true);
      }
    } catch (err) {
      showToast('Error adding skill.', true);
      console.error('Error adding skill:', err);
    } finally {
      setIsAddingSkill(null);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDiagnostics(userId);
    }
  }, [userId]);

  // Scroll logs to bottom whenever log list updates
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLogs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-20">
      
      {/* Toast Notifications */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-violet-600 border border-violet-500/30 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce font-sans text-sm font-semibold">
          <Icons.Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 border border-red-500/30 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce font-sans text-sm font-semibold">
          <Icons.X size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Banner Block - Premium styling */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 h-44 sm:h-52 flex flex-col justify-end p-6 sm:p-8 bg-zinc-950 shadow-2xl">
        <img src={agentBanner} alt="Agent Control banner" className="absolute inset-0 w-full h-full object-cover opacity-25 filter brightness-75 contrast-125 select-none pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                <Icons.Sparkles className="text-white" size={12} />
              </div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono">Autonomous Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">ResumAI Agent Control Center</h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">Deploy local consensus models to scout remote opportunities and optimize resume sections dynamically.</p>
          </div>

          <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-white/5 px-4 py-2 rounded-2xl backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${agentStatus === 'running' ? 'bg-violet-400' : 'bg-green-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${agentStatus === 'running' ? 'bg-violet-500' : 'bg-green-500'}`}></span>
            </span>
            <span className="text-xs font-semibold text-zinc-300 capitalize font-mono">
              {agentStatus === 'running' ? 'Active Hunt' : 'Agent Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration & Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scouting Targets Card */}
        <div className="lg:col-span-2 bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wider flex items-center gap-2 uppercase font-mono mb-2">
            <Icons.Target className="text-violet-400" size={16} />
            Scouting Targets & Parameters
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Target Role</label>
              <input 
                type="text" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                onBlur={() => handleUpdateScoutSettings({ targetRole })}
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans"
                placeholder="e.g. Full Stack Engineer"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Outreach Tone</label>
              <select 
                value={preferredTone}
                onChange={(e) => handleUpdateScoutSettings({ preferredTone: e.target.value })}
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans"
              >
                <option value="professional">Professional</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Automation Priority</label>
              <select 
                value={diagnostics?.settings?.automationPriority || 'balanced'}
                onChange={(e) => handleUpdateScoutSettings({ automationPriority: e.target.value })}
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans"
              >
                <option value="high">Max Automation</option>
                <option value="balanced">Balanced Fit</option>
                <option value="safety">Human Review Focused</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggles settings Card */}
        <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">Autonomous Mode</span>
              <span className="text-[10px] text-zinc-400">Queue & apply in background</span>
            </div>
            <button 
              onClick={() => handleUpdateScoutSettings({ autoApply: !autoApply })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${autoApply ? 'bg-violet-600' : 'bg-zinc-800'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${autoApply ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-3.5">
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">Require Human Review</span>
              <span className="text-[10px] text-zinc-400">Review outreach before send</span>
            </div>
            <button 
              onClick={() => handleUpdateScoutSettings({ requireHumanReview: !requireHumanReview })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${requireHumanReview ? 'bg-violet-600' : 'bg-zinc-800'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${requireHumanReview ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

      </div>

      {/* Diagnostics Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 shadow-md backdrop-blur-md">
          <span className="text-[10px] text-zinc-500 block uppercase font-mono">Sourced Jobs</span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {isDiagnosing ? '...' : diagnostics?.pipeline?.scrapedJobsCount || 0}
          </span>
        </div>
        <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 shadow-md backdrop-blur-md">
          <span className="text-[10px] text-zinc-500 block uppercase font-mono">Slack Sourced</span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {isDiagnosing ? '...' : diagnostics?.pipeline?.slackSourcedCount || 0}
          </span>
        </div>
        <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 shadow-md backdrop-blur-md">
          <span className="text-[10px] text-zinc-500 block uppercase font-mono">Avg Fit Score</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">
            {isDiagnosing ? '...' : diagnostics?.pipeline?.averageFitScore ? `${diagnostics.pipeline.averageFitScore}%` : 'N/A'}
          </span>
        </div>
        <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4 shadow-md backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">App Queue</span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {isDiagnosing ? '...' : diagnostics?.pipeline?.applicationsQueue?.stats?.pending || 0}
            </span>
          </div>
          <button 
            onClick={runAgentCycle}
            disabled={agentStatus === 'running'}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/10 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-100"
          >
            <Icons.Sparkles size={14} />
            <span>Run Hunt</span>
          </button>
        </div>
      </div>

      {/* Main Console & Outputs Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Terminal Logs & Stats Widget (5 columns width) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Scrolling Terminal Simulator */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col h-96">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-bold font-mono text-zinc-400 ml-2">agent_consensus_stdout.log</span>
              </div>
              <Icons.Code className="text-zinc-500" size={16} />
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-green-400 space-y-2 scrollbar-hide pr-1">
              {agentLogs.length === 0 ? (
                <span className="text-zinc-600">Console idle. Trigger an Autonomous Hunt Cycle to inspect worker node logging logs...</span>
              ) : (
                agentLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{log}</div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Capabilities Diagnostics Widget */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider flex items-center gap-2 uppercase font-mono">
              <Icons.Settings className="text-pink-400" size={16} />
              Capabilities Diagnostics
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Consensus Swarm Nodes</span>
                <span className="text-zinc-200 font-semibold">{diagnostics?.systemCapabilities?.consensusEngineSize || 5} Instances</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Active LLM Backend</span>
                <span className="text-zinc-200 font-semibold">{diagnostics?.systemCapabilities?.activeLLMBackend || 'Ollama (llama3.2:1b)'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Direct Apply Engine</span>
                <span className="text-emerald-400 font-semibold font-mono">Enabled</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-zinc-400">Puppeteer Stealth Layer</span>
                <span className="text-emerald-400 font-semibold font-mono">Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Report Cards (7 columns width) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tab Navigation for Report Column */}
          <div className="flex border-b border-white/10 mb-6 gap-6">
            <button
              onClick={() => setActiveReportTab('scout')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 font-mono flex items-center gap-2 ${
                activeReportTab === 'scout'
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icons.Target size={14} />
              <span>Scouted Match</span>
            </button>
            <button
              onClick={() => setActiveReportTab('custom')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 font-mono flex items-center gap-2 ${
                activeReportTab === 'custom'
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icons.FileText size={14} />
              <span>Custom Role Outreach</span>
            </button>
          </div>

          {/* Render Active Tab Screen */}
          {activeReportTab === 'scout' && agentStatus === 'running' && (
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-12 text-center h-[520px] flex flex-col justify-center items-center shadow-inner">
              {/* Swarm loader */}
              <div className="relative w-28 h-28 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="vp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <g stroke="url(#vp-grad)" strokeWidth="1" opacity="0.3">
                    <line x1="50" y1="20" x2="78.5" y2="40.7" className="animate-pulse" />
                    <line x1="50" y1="20" x2="67.6" y2="74.3" />
                    <line x1="50" y1="20" x2="32.4" y2="74.3" />
                    <line x1="50" y1="20" x2="21.5" y2="40.7" />
                    <line x1="78.5" y1="40.7" x2="67.6" y2="74.3" />
                    <line x1="78.5" y1="40.7" x2="32.4" y2="74.3" />
                    <line x1="78.5" y1="40.7" x2="21.5" y2="40.7" />
                    <line x1="67.6" y1="74.3" x2="32.4" y2="74.3" />
                    <line x1="67.6" y1="74.3" x2="21.5" y2="40.7" />
                    <line x1="32.4" y1="74.3" x2="21.5" y2="40.7" />
                  </g>
                  <g stroke="url(#vp-grad)" strokeWidth="1.5" strokeDasharray="5 15" strokeLinecap="round" opacity="0.8">
                    <line x1="50" y1="20" x2="67.6" y2="74.3" className="animate-dash" style={{ animationDuration: '2.5s' }} />
                    <line x1="78.5" y1="40.7" x2="21.5" y2="40.7" className="animate-dash" style={{ animationDuration: '3.5s' }} />
                    <line x1="32.4" y1="74.3" x2="50" y2="20" className="animate-dash" style={{ animationDuration: '2s' }} />
                  </g>
                  <circle cx="50" cy="50" r="14" fill="none" stroke="url(#vp-grad)" strokeWidth="1" strokeDasharray="2 4" className="animate-spin" style={{ transformOrigin: '50px 50px', animationDuration: '8s' }} />
                  <circle cx="50" cy="20" r="4.5" fill="#8b5cf6" />
                  <circle cx="78.5" cy="40.7" r="4.5" fill="#ec4899" />
                  <circle cx="67.6" cy="74.3" r="4.5" fill="#8b5cf6" />
                  <circle cx="32.4" cy="74.3" r="4.5" fill="#ec4899" />
                  <circle cx="21.5" cy="40.7" r="4.5" fill="#8b5cf6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-violet-400 font-sans">Consensus Swarm Processing</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm font-sans text-balance">Gathering consensus reports from 5 worker models. This usually takes between 10-15 seconds...</p>
            </div>
          )}

          {activeReportTab === 'scout' && agentStatus === 'idle' && !agentReport && (
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-12 text-center h-[520px] flex flex-col justify-center items-center shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Icons.Sparkles className="text-zinc-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-zinc-300 font-sans">Command Center Idle</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm font-sans">No active autonomous cycle report. Press "Run Hunt" to initiate a consensus search scan over local LLM workers.</p>
            </div>
          )}

          {activeReportTab === 'custom' && isAnalyzingCustom && (
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-12 text-center h-[520px] flex flex-col justify-center items-center shadow-inner">
              {/* Swarm loader */}
              <div className="relative w-28 h-28 mb-6 animate-pulse">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="vp-grad-c" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="30" fill="none" stroke="url(#vp-grad-c)" strokeWidth="1.5" strokeDasharray="3 6" className="animate-spin" style={{ transformOrigin: '50px 50px', animationDuration: '4s' }} />
                  <circle cx="50" cy="50" r="10" fill="#ec4899" className="animate-ping" style={{ animationDuration: '1.5s' }} />
                  <circle cx="50" cy="50" r="6" fill="#8b5cf6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-pink-400 font-sans">Analyzing Custom Position</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm font-sans text-balance">The Swarm is parsing details, matching requirements, and tailoring assets for your application...</p>
            </div>
          )}

          {activeReportTab === 'custom' && !isAnalyzingCustom && !customReport && (
            <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <Icons.Plus className="text-violet-400" size={18} />
                  Analyze Custom Job Posting
                </h3>
                <p className="text-xs text-zinc-400">Paste job information directly from Slack, LinkedIn, or external boards to initiate a custom consensus matching cycle.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Job Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Full Stack Developer"
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Company Name</label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Decode Development"
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Recruiter / Apply Email</label>
                  <input
                    type="email"
                    value={customRecruiterEmail}
                    onChange={(e) => setCustomRecruiterEmail(e.target.value)}
                    placeholder="e.g. careers@decodedev.com"
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Job Posting URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="e.g. https://sboj.dev/p/QJD0"
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Job Description Text</label>
                <textarea
                  value={customJobDescription}
                  onChange={(e) => setCustomJobDescription(e.target.value)}
                  placeholder="Paste the raw text of the job description here..."
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors font-sans h-44 resize-none"
                />
              </div>

              <button
                onClick={handleAnalyzeCustomJob}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-violet-500/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Icons.Sparkles size={14} />
                <span>Analyze & Tailor Application</span>
              </button>
            </div>
          )}

          {/* Analyzed Report Output */}
          {((activeReportTab === 'scout' && agentReport) || (activeReportTab === 'custom' && customReport)) && (
            <div className="space-y-6 max-h-[640px] overflow-y-auto pr-1 scrollbar-hide">
              {activeReportTab === 'custom' && (
                <div className="flex justify-between items-center bg-zinc-900/30 border border-white/5 px-4 py-2 rounded-2xl">
                  <span className="text-[10px] text-pink-400 font-bold font-mono">Custom Application Ready</span>
                  <button
                    onClick={() => setCustomReport(null)}
                    className="text-[10px] text-zinc-400 hover:text-white transition-colors"
                  >
                    ← Clear & Paste New Job
                  </button>
                </div>
              )}

              {/* Render Selected Report Details */}
              {(() => {
                const report = activeReportTab === 'scout' ? agentReport : customReport;
                if (!report.jobFound || !report.jobDetails) {
                  return (
                    <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-12 text-center h-[520px] flex flex-col justify-center items-center shadow-inner">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                        <Icons.Briefcase className="text-zinc-400" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-300 font-sans">No Job Details</h3>
                      <p className="text-sm text-zinc-500 mt-2 max-w-sm font-sans">The report was not generated correctly. Try running analysis again.</p>
                    </div>
                  );
                }

                return (
                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                          {report.jobDetails.source} Sourced Opportunity
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-white mt-2 font-sans">{report.jobDetails.title}</h2>
                        <p className="text-xs sm:text-sm text-zinc-400 font-sans">{report.jobDetails.company} • {report.jobDetails.location}</p>
                      </div>

                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-400 font-mono">{report.jobDetails.fitScore}%</span>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-semibold font-sans">Fit</span>
                      </div>
                    </div>

                    {/* Collapsible Job Description */}
                    <div className="bg-zinc-950/60 rounded-2xl p-4 border border-white/5 text-xs text-zinc-300 font-sans">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-zinc-400">Job Description Details</span>
                        <button
                          onClick={() => setExpandedJobDesc(!expandedJobDesc)}
                          className="text-[10px] text-violet-400 font-semibold hover:underline"
                        >
                          {expandedJobDesc ? 'Collapse' : 'Expand full description'}
                        </button>
                      </div>
                      <p className={`leading-relaxed whitespace-pre-line ${expandedJobDesc ? '' : 'line-clamp-4'}`}>
                        {report.jobDetails.description}
                      </p>
                    </div>

                    {/* Consensus Reasoning */}
                    {report.agentReasoning && (
                      <div className="bg-violet-950/20 border border-violet-950/30 rounded-2xl p-4 text-xs font-sans text-violet-200 leading-relaxed relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 blur-xl rounded-full" />
                        <div className="flex items-start gap-2.5 relative z-10">
                          <Icons.MessageSquare className="text-violet-400 mt-0.5 flex-shrink-0" size={14} />
                          <div>
                            <span className="font-bold text-violet-300 block mb-1">Agent reasoning & matching justification</span>
                            <span>{report.agentReasoning}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skills gap list */}
                    {report.skillsAnalysis && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-mono">Matched Skills</span>
                            <div className="flex flex-wrap gap-1.5">
                              {report.skillsAnalysis.matchingSkills.slice(0, 5).map((sk: string) => (
                                <span key={sk} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] text-emerald-300 font-medium">
                                  {sk}
                                </span>
                              ))}
                              {report.skillsAnalysis.matchingSkills.length === 0 && <span className="text-[10px] text-zinc-600 font-mono">No matching skills detected.</span>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider block font-mono">Missing Required Skills</span>
                            <div className="flex flex-wrap gap-1.5">
                              {report.skillsAnalysis.missingSkills.slice(0, 5).map((sk: string) => (
                                <span key={sk} className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded-md text-[10px] text-pink-300 font-medium">
                                  {sk}
                                </span>
                              ))}
                              {report.skillsAnalysis.missingSkills.length === 0 && <span className="text-[10px] text-emerald-400 font-mono">Perfect skill coverage!</span>}
                            </div>
                          </div>
                        </div>

                        {/* Resume additions */}
                        {report.skillsAnalysis.suggestedAdditions && report.skillsAnalysis.suggestedAdditions.length > 0 && (
                          <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-mono">Resume Additions for missing skills</span>
                            <div className="space-y-3">
                              {report.skillsAnalysis.suggestedAdditions.map((item: any, idx: number) => {
                                const isAdded = addedSkills.includes(idx);
                                return (
                                  <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-start justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-[11px]">{item.skill}</span>
                                        <span className="text-[9px] text-zinc-500 italic">Relevance: {item.relevance}</span>
                                      </div>
                                      <p className="text-zinc-300 text-[10.5px] leading-relaxed font-sans">{item.suggestedBullet}</p>
                                    </div>
                                    <button
                                      onClick={() => handleAddSkillToCV(item.skill, item.suggestedBullet, idx)}
                                      disabled={isAdded || isAddingSkill === idx}
                                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 flex items-center gap-1 ${
                                        isAdded
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/15'
                                      }`}
                                    >
                                      {isAddingSkill === idx ? (
                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      ) : isAdded ? (
                                        <Icons.Check size={12} />
                                      ) : (
                                        <Icons.Plus size={12} />
                                      )}
                                      <span>{isAdded ? 'Added' : 'Add to CV'}</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Experience Upgrades */}
                    {report.cvEnhancements && report.cvEnhancements.length > 0 && (
                      <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Icons.Sparkles className="text-violet-400" size={16} />
                          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Consensus Bullet upgrades</span>
                        </div>

                        <div className="space-y-4">
                          {report.cvEnhancements.map((enh: any, idx: number) => {
                            const isApplied = appliedEnhancements.includes(idx);
                            return (
                              <div key={idx} className="space-y-2 border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                                    <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block font-mono mb-1">Original Description</span>
                                    <p className="text-zinc-400 leading-relaxed font-sans">{enh.originalBullet}</p>
                                  </div>
                                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block font-mono mb-1">Upgrade (+{enh.expectedImpact || 10}% Impact)</span>
                                    <p className="text-zinc-200 leading-relaxed font-sans font-medium">{enh.improvedBullet}</p>
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    onClick={() => handleApplyEnhancement(enh.originalBullet, enh.improvedBullet, enh.expectedImpact, idx)}
                                    disabled={isApplied || isEnhancing === idx}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                      isApplied
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-violet-600 hover:bg-violet-500 text-white'
                                    }`}
                                  >
                                    {isEnhancing === idx ? (
                                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : isApplied ? (
                                      <Icons.Check size={14} />
                                    ) : (
                                      <Icons.Sparkles size={14} />
                                    )}
                                    <span>{isApplied ? 'Applied to Master CV' : 'Apply to Master CV'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cover letter draft */}
                    {report.coverLetterDraft && (
                      <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Icons.FileText className="text-pink-400" size={16} />
                            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Cover Letter Draft</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(report.coverLetterDraft);
                              showToast('Cover letter copied to clipboard!');
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] border border-white/10 flex items-center gap-1 transition-all"
                          >
                            <Icons.Copy size={12} />
                            <span>Copy</span>
                          </button>
                        </div>

                        <textarea
                          readOnly
                          value={report.coverLetterDraft}
                          className="w-full bg-zinc-950/80 border border-white/5 rounded-2xl p-4 text-[11px] text-zinc-300 font-sans leading-relaxed resize-none h-48 focus:outline-none focus:border-white/10"
                        />
                      </div>
                    )}

                    {/* Automation potential check */}
                    <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Automation Verification Rules</span>
                        <button
                          onClick={handleAssessAutomation}
                          disabled={isCheckingAutomation}
                          className="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all"
                        >
                          {isCheckingAutomation ? 'Assessing...' : 'Assess Feasibility'}
                        </button>
                      </div>

                      {assessmentResult && (
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-xs space-y-3 font-sans">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-zinc-500 block">CAPTCHA Shield Detect</span>
                              <span className={`font-semibold ${assessmentResult.hasCaptcha ? 'text-red-400' : 'text-emerald-400'}`}>
                                {assessmentResult.hasCaptcha ? '⚠️ CAPTCHA Detected' : '✅ Clear (No CAPTCHA)'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">Automation Fit Rating</span>
                              <span className={`font-bold ${assessmentResult.score >= 80 ? 'text-emerald-400' : assessmentResult.score >= 55 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {assessmentResult.score}% Feasible
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-white/5 pt-2.5">
                            <span className="text-zinc-500 block mb-1">Reasoning Analysis</span>
                            <p className="text-zinc-300 text-[10.5px] leading-relaxed">{assessmentResult.reasoning}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Queue outreach button */}
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={handleQueueJob}
                        className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-violet-500/10 transition-all hover:scale-105 active:scale-100 flex items-center justify-center gap-2"
                      >
                        <Icons.Send size={14} />
                        <span>Queue Outreach Application</span>
                      </button>
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default AgentControlCenter;
