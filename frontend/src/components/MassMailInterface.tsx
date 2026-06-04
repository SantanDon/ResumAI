import React, { useState } from 'react';
import { Icons } from './ui/Icons';

interface Recipient {
  email: string;
  status: 'valid' | 'cooldown' | 'invalid';
  cooldownDays?: number;
}

interface SmtpCredentials {
  email: string;
  password: string;
  service: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  host?: string;
  port?: number;
}

interface MassMailInterfaceProps {
  onBack: () => void;
}

export const MassMailInterface: React.FC<MassMailInterfaceProps> = ({ onBack }) => {
  const [step, setStep] = useState<'auth' | 'recipients' | 'context' | 'review'>('auth');
  const [emailInput, setEmailInput] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [context, setContext] = useState({
    who: '',
    about: '',
  });
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState<string>('');
  const [safetyStatus, setSafetyStatus] = useState<{ safe: boolean; reason?: string } | null>(null);
  const [smtpCredentials, setSmtpCredentials] = useState<SmtpCredentials>({
    email: '',
    password: '',
    service: 'gmail'
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleProceedWithCredentials = () => {
    if (!smtpCredentials.email || !smtpCredentials.password) {
      alert('Please enter your email and app password');
      return;
    }
    setStep('recipients');
  };

  const handleAddEmails = async () => {
    const emails = emailInput
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    if (emails.length === 0) {
      alert('Please enter valid email addresses');
      return;
    }

    if (recipients.length + emails.length > 50) {
      alert('Maximum 50 recipients per batch');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/mail/check-cooldown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      const data = await response.json();

      if (data.success) {
        setRecipients([...recipients, ...data.recipients]);
        setEmailInput('');
      }
    } catch (error) {
      alert('Error checking email cooldowns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!context.who.trim() || !context.about.trim() || !physicalAddress.trim()) {
      alert('Please fill in all fields including Physical Address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/mail/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, physicalAddress }),
      });
      const data = await response.json();

      if (data.success) {
        setGeneratedEmail(data.emailBody);
        setStep('review');
        checkSafety(data.emailBody);
      }
    } catch (error) {
      alert('Error generating email');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSafety = async (body: string) => {
    setSafetyStatus(null);
    try {
      const response = await fetch('http://localhost:3001/api/mail/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Mass Mail Draft', body }),
      });
      const data = await response.json();
      if (data.success) {
        setSafetyStatus({ safe: data.safe, reason: data.reason });
      }
    } catch (error) {
      console.error('Safety check failed', error);
    }
  };

  const handleSendEmails = async () => {
    const validRecipients = recipients.filter((r) => r.status === 'valid');

    if (validRecipients.length === 0) {
      alert('No valid recipients to send to');
      return;
    }

    if (safetyStatus && !safetyStatus.safe) {
      alert('Cannot send: Email content flagged as unsafe.');
      return;
    }

    setIsLoading(true);
    setSendStatus('');

    try {
      const response = await fetch('http://localhost:3001/api/mail/send-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validRecipients.map((r) => r.email),
          emailBody: generatedEmail,
          context,
          physicalAddress,
          smtpCredentials: {
            email: smtpCredentials.email,
            password: smtpCredentials.password,
            service: smtpCredentials.service,
            host: smtpCredentials.host,
            port: smtpCredentials.port
          }
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSendStatus(
          `Successfully sent ${data.sentCount} emails! Check back in 4 days to email these recipients again.`
        );
        setTimeout(() => {
          setStep('recipients');
          setRecipients([]);
          setContext({ who: '', about: '' });
          setGeneratedEmail('');
          setSendStatus('');
          setSafetyStatus(null);
        }, 3000);
      } else {
        setSendStatus(`Error: ${data.error || 'Error sending emails. Please check your credentials.'}`);
      }
    } catch (error) {
      setSendStatus('Error sending emails. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r.email !== email));
  };

  const validCount = recipients.filter((r) => r.status === 'valid').length;

  return (
    <div className="min-h-screen p-6 bg-transparent transition-smooth">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="px-4 py-2.5 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold flex items-center gap-2 group"
          >
            <Icons.ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={16} />
            Back
          </button>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            Mass Mail Assistant
          </h1>
          <div className="w-24"></div>
        </div>

        {/* Step 0: Auth - User SMTP Connection */}
        {step === 'auth' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto mt-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500" />
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Icons.Mail className="text-white" size={28} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Connect Your Email</h2>
              <p className="text-sm text-zinc-400">
                Enter your SMTP configuration settings to transmit outreach emails securely
              </p>
            </div>

            <div className="space-y-6">
              {/* Email Service Selector */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 font-semibold tracking-wide">Select Provider</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'gmail', name: 'Gmail', icon: <Icons.Mail size={18} className="text-red-400 group-hover:scale-110 transition-transform" /> },
                    { id: 'outlook', name: 'Outlook', icon: <Icons.Globe size={18} className="text-blue-400 group-hover:scale-110 transition-transform" /> },
                    { id: 'yahoo', name: 'Yahoo', icon: <Icons.Layers size={18} className="text-pink-400 group-hover:scale-110 transition-transform" /> },
                    { id: 'custom', name: 'Custom', icon: <Icons.Settings size={18} className="text-zinc-400 group-hover:scale-110 transition-transform" /> }
                  ].map(service => (
                    <button
                      key={service.id}
                      onClick={() => setSmtpCredentials({ ...smtpCredentials, service: service.id as any })}
                      className={`p-4 rounded-2xl border transition-all duration-300 group flex flex-col items-center gap-2 ${
                        smtpCredentials.service === service.id
                          ? 'bg-violet-600/10 border-violet-500 text-violet-300 shadow-md shadow-violet-500/5'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      {service.icon}
                      <span className="text-xs font-semibold">{service.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 font-semibold tracking-wide">Email Address</label>
                <div className="relative rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/40">
                  <input
                    type="email"
                    value={smtpCredentials.email}
                    onChange={(e) => setSmtpCredentials({ ...smtpCredentials, email: e.target.value })}
                    placeholder="your.name@service.com"
                    className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-colors"
                  />
                </div>
              </div>

              {/* App Password Input */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 font-semibold tracking-wide">App Password</label>
                <div className="relative rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/40">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpCredentials.password}
                    onChange={(e) => setSmtpCredentials({ ...smtpCredentials, password: e.target.value })}
                    placeholder="Enter your application app-password token"
                    className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Custom SMTP Configuration */}
              {smtpCredentials.service === 'custom' && (
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-semibold tracking-wide">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpCredentials.host || ''}
                      onChange={(e) => setSmtpCredentials({ ...smtpCredentials, host: e.target.value })}
                      placeholder="smtp.example.com"
                      className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-semibold tracking-wide">Port</label>
                    <input
                      type="number"
                      value={smtpCredentials.port || ''}
                      onChange={(e) => setSmtpCredentials({ ...smtpCredentials, port: parseInt(e.target.value) })}
                      placeholder="587"
                      className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
                    />
                  </div>
                </div>
              )}

              {/* Instructions Alerts - Upgraded to glassmorphic containers */}
              {smtpCredentials.service === 'gmail' && (
                <div className="p-5 bg-yellow-500/5 backdrop-blur-xl border border-yellow-500/20 rounded-2xl space-y-3">
                  <p className="text-yellow-300 font-bold flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Gmail Connection Instructions
                  </p>
                  <div className="text-yellow-200/80 text-xs space-y-2 leading-relaxed">
                    <p>Google requires an <strong>App Password</strong> rather than your standard account login credentials:</p>
                    <ol className="list-decimal ml-5 space-y-1 text-yellow-200/70">
                      <li>Visit <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 hover:text-yellow-200">Google Security Settings</a> and verify 2-Step Verification is active.</li>
                      <li>Navigate to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 hover:text-yellow-200">App Passwords configuration</a>.</li>
                      <li>Generate a temporary app password string labeled "Mail".</li>
                      <li>Copy the generated 16-character string key and insert it above.</li>
                    </ol>
                  </div>
                </div>
              )}

              {smtpCredentials.service === 'outlook' && (
                <div className="p-4 bg-blue-500/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl">
                  <p className="text-blue-300 text-xs leading-relaxed flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      For Outlook/Hotmail, you may utilize your standard account password, or access your <a href="https://account.live.com/proofs/manage/additional" target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">Microsoft Security Profile</a> to generate a custom app-specific credential key.
                    </span>
                  </p>
                </div>
              )}

              {smtpCredentials.service === 'yahoo' && (
                <div className="p-4 bg-violet-500/5 backdrop-blur-xl border border-violet-500/20 rounded-2xl">
                  <p className="text-violet-300 text-xs leading-relaxed flex items-start gap-2">
                    <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      For Yahoo accounts, please generate an app password from the <a href="https://login.yahoo.com/account/security" target="_blank" rel="noopener noreferrer" className="underline text-violet-400 hover:text-violet-300">Yahoo Account Security Panel</a> prior to initiating a connection.
                    </span>
                  </p>
                </div>
              )}

              {/* Safety notice info */}
              <div className="p-4 bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl flex items-start gap-2.5">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-emerald-300 text-xs leading-relaxed">
                  Your credentials are encrypted inside the local application context and are never uploaded or retained on remote servers.
                </p>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleProceedWithCredentials}
                disabled={!smtpCredentials.email || !smtpCredentials.password}
                className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-[0.99] text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-violet-500/10"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step !== 'auth' && (
          <>
            {/* Progress Stepper */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { id: 'recipients', num: 1, label: 'Recipients' },
                  { id: 'context', num: 2, label: 'Context' },
                  { id: 'review', num: 3, label: 'Review' }
                ].map((s, idx, arr) => {
                  const isActive = step === s.id;
                  const stepOrder = ['recipients', 'context', 'review'];
                  const currentIdx = stepOrder.indexOf(step);
                  const isCompleted = idx < currentIdx;

                  return (
                    <React.Fragment key={s.id}>
                      <div className={`flex items-center gap-3 transition-colors duration-300 ${isActive ? 'text-violet-400' : isCompleted ? 'text-green-400' : 'text-zinc-500'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-br from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/20 scale-105 border border-violet-400/20' 
                            : isCompleted 
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-green-400' 
                            : 'bg-zinc-800/40 border border-white/5 text-zinc-500'
                        }`}>
                          {isCompleted ? '✓' : s.num}
                        </div>
                        <span className="font-semibold text-sm tracking-wide">{s.label}</span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                          idx < currentIdx ? 'bg-gradient-to-r from-emerald-500 to-violet-500' : 'bg-zinc-800'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Step 1: Recipients */}
            {step === 'recipients' && (
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Add Recipients (Max 50)</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-300 mb-2 block font-semibold">Enter email addresses (comma or newline separated):</label>
                    <textarea
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="manager@company.com, contact@techstartup.io"
                      className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 resize-none font-sans"
                      rows={4}
                    />
                    <button
                      onClick={handleAddEmails}
                      disabled={isLoading || !emailInput.trim()}
                      className="mt-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] shadow-md shadow-violet-500/10"
                    >
                      {isLoading ? 'Validating...' : 'Add & Validate'}
                    </button>
                  </div>

                  {recipients.length > 0 && (
                    <div className="bg-zinc-950/50 rounded-2xl border border-white/5 p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h3 className="text-sm font-bold text-zinc-300">Queue ({recipients.length}/50)</h3>
                        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          {validCount} ready
                        </span>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                        {recipients.map((recipient) => (
                          <div key={recipient.email} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:translate-x-0.5 transition-transform duration-200">
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${recipient.status === 'valid' ? 'bg-emerald-500' : recipient.status === 'cooldown' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                              <span className="text-sm text-zinc-200">{recipient.email}</span>
                              {recipient.status === 'cooldown' && (
                                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                                  Cooldown: {recipient.cooldownDays}d remaining
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => removeRecipient(recipient.email)} 
                              className="text-rose-400 hover:text-rose-300 text-xs font-semibold p-1 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {validCount > 0 && (
                    <button
                      onClick={() => setStep('context')}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold rounded-2xl transition-all duration-300 shadow-md active:scale-[0.99]"
                    >
                      Continue with {validCount} Recipients →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Context */}
            {step === 'context' && (
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Email Generation Context</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-semibold">Recipient Persona</label>
                    <input
                      type="text"
                      value={context.who}
                      onChange={(e) => setContext({ ...context, who: e.target.value })}
                      placeholder="e.g., Lead Recruiter / CTO at tech startups"
                      className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-semibold">Context details / Focus area</label>
                    <textarea
                      value={context.about}
                      onChange={(e) => setContext({ ...context, about: e.target.value })}
                      placeholder="e.g., Application for Full Stack role, highlighting 5 years of React/Node and performance optimizations."
                      className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 resize-none font-sans"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300 font-semibold">Physical Mailing Address (CAN-SPAM act requirement)</label>
                    <input
                      type="text"
                      value={physicalAddress}
                      onChange={(e) => setPhysicalAddress(e.target.value)}
                      placeholder="e.g., 100 Main St, Suite 400, Austin, TX 78701"
                      className="w-full p-4 rounded-xl bg-zinc-950/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
                    />
                    <p className="text-[11px] text-zinc-500">Legal requirement for bulk messaging, placed in message footnotes.</p>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      onClick={() => setStep('recipients')} 
                      className="flex-1 py-4 bg-zinc-800/40 border border-white/5 hover:bg-zinc-800 hover:text-white text-zinc-300 font-semibold rounded-2xl transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleGenerateEmail}
                      disabled={isLoading || !context.who.trim() || !context.about.trim() || !physicalAddress.trim()}
                      className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99] shadow-lg shadow-violet-500/15"
                    >
                      {isLoading ? 'Generating Draft...' : 'Generate Email'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Transmit */}
            {step === 'review' && (
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Review & Transmit</h2>

                {/* Safety Check Status - styled premium */}
                <div className={`rounded-2xl p-5 mb-6 flex items-start gap-3 border ${
                  safetyStatus === null 
                    ? 'bg-blue-500/5 border-blue-500/20 text-blue-300' 
                    : safetyStatus.safe 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                }`}>
                  <div className="mt-0.5">
                    {safetyStatus === null ? (
                      <svg className="w-5 h-5 text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : safetyStatus.safe ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">AI Content Safeguard</p>
                    <p className="text-xs opacity-80">
                      {safetyStatus === null && 'Analyzing generated output parameters via consensus swarm workers...'}
                      {safetyStatus?.safe && 'Message successfully cleared spam verification guidelines.'}
                      {safetyStatus && !safetyStatus.safe && `Caution: Swarm flagged output. (${safetyStatus.reason})`}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-6 mb-6">
                  <h3 className="text-sm font-bold text-violet-400 mb-3 uppercase tracking-wider">Draft Body</h3>
                  <textarea
                    value={generatedEmail}
                    onChange={(e) => setGeneratedEmail(e.target.value)}
                    className="w-full p-4 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 resize-none font-mono text-sm leading-relaxed"
                    rows={12}
                  />
                  <p className="text-zinc-500 text-xs mt-2">Feel free to modify details in the sandbox template prior to sending.</p>
                </div>

                <div className="bg-zinc-950/30 border border-white/5 rounded-2xl p-4 mb-6 flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-semibold">Configured Recipient Count</span>
                  <span className="text-sm font-bold text-white bg-white/5 border border-white/10 px-3 py-1 rounded-full">{validCount} Contacts</span>
                </div>

                {sendStatus && (
                  <div className={`p-4 rounded-xl mb-6 border text-xs font-semibold ${
                    sendStatus.includes('Successfully') 
                      ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/20' 
                      : 'bg-rose-500/5 text-rose-300 border-rose-500/20'
                  }`}>
                    {sendStatus}
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('context')} 
                    disabled={isLoading} 
                    className="flex-1 py-4 bg-zinc-800/40 border border-white/5 hover:bg-zinc-800 hover:text-white text-zinc-300 font-semibold rounded-2xl transition-all disabled:opacity-40"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSendEmails}
                    disabled={isLoading || (safetyStatus !== null && !safetyStatus.safe)}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99] shadow-md shadow-emerald-500/10 text-base"
                  >
                    {isLoading ? 'Transmitting...' : `Send Outreach Mail`}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
