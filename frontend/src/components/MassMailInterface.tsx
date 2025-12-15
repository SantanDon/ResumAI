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
        // Trigger Safety Check
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
          `✅ Successfully sent ${data.sentCount} emails! Check back in 4 days to email these recipients again.`
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
        setSendStatus(`❌ ${data.error || 'Error sending emails. Please check your credentials.'}`);
      }
    } catch (error) {
      setSendStatus('❌ Error sending emails. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r.email !== email));
  };

  const validCount = recipients.filter((r) => r.status === 'valid').length;

  return (
    <div className="min-h-screen p-6 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 glass rounded-xl text-white hover:bg-white/20 transition-all"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">📧 Mass Mail Assistant</h1>
          <div className="w-24"></div>
        </div>

        {/* Step 0: Auth - User provides their own SMTP credentials */}
        {step === 'auth' && (
             <div className="glass rounded-3xl p-8 max-w-2xl mx-auto mt-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Icons.Mail className="text-white" size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Connect Your Email</h2>
                  <p className="text-gray-300">
                    Enter your email credentials to send personalized outreach at scale
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Email Service Selector */}
                  <div>
                    <label className="text-gray-300 mb-2 block font-medium">Email Service</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'gmail', name: 'Gmail', icon: '📧' },
                        { id: 'outlook', name: 'Outlook', icon: '📬' },
                        { id: 'yahoo', name: 'Yahoo', icon: '📨' },
                        { id: 'custom', name: 'Custom', icon: '⚙️' }
                      ].map(service => (
                        <button
                          key={service.id}
                          onClick={() => setSmtpCredentials({ ...smtpCredentials, service: service.id as any })}
                          className={`p-3 rounded-xl border transition-all ${
                            smtpCredentials.service === service.id
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          <span className="text-xl block mb-1">{service.icon}</span>
                          <span className="text-xs">{service.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="text-gray-300 mb-2 block font-medium">Your Email Address</label>
                    <input
                      type="email"
                      value={smtpCredentials.email}
                      onChange={(e) => setSmtpCredentials({ ...smtpCredentials, email: e.target.value })}
                      placeholder="your.email@gmail.com"
                      className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* App Password Input */}
                  <div>
                    <label className="text-gray-300 mb-2 block font-medium">App Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpCredentials.password}
                        onChange={(e) => setSmtpCredentials({ ...smtpCredentials, password: e.target.value })}
                        placeholder="Your app-specific password"
                        className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Custom SMTP fields */}
                  {smtpCredentials.service === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-300 mb-2 block font-medium">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpCredentials.host || ''}
                          onChange={(e) => setSmtpCredentials({ ...smtpCredentials, host: e.target.value })}
                          placeholder="smtp.example.com"
                          className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 mb-2 block font-medium">Port</label>
                        <input
                          type="number"
                          value={smtpCredentials.port || ''}
                          onChange={(e) => setSmtpCredentials({ ...smtpCredentials, port: parseInt(e.target.value) })}
                          placeholder="587"
                          className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Gmail App Password Instructions */}
                  {smtpCredentials.service === 'gmail' && (
                    <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30 space-y-3">
                      <p className="text-yellow-300 font-semibold flex items-center gap-2">
                        ⚠️ Gmail requires an App Password (not your regular password)
                      </p>
                      <div className="text-yellow-200/80 text-sm space-y-2">
                        <p><strong>How to get an App Password:</strong></p>
                        <ol className="list-decimal ml-5 space-y-1">
                          <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300">Google Account Security</a></li>
                          <li>Enable 2-Step Verification (if not already enabled)</li>
                          <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300">App Passwords</a></li>
                          <li>Select "Mail" and your device, then click "Generate"</li>
                          <li>Copy the 16-character password and paste it above</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Outlook Instructions */}
                  {smtpCredentials.service === 'outlook' && (
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <p className="text-blue-300 text-sm">
                        💡 <strong>For Outlook/Hotmail:</strong> You can use your regular password, or create an app password in your <a href="https://account.live.com/proofs/manage/additional" target="_blank" rel="noopener noreferrer" className="underline">Microsoft account security settings</a>.
                      </p>
                    </div>
                  )}

                  {/* Yahoo Instructions */}
                  {smtpCredentials.service === 'yahoo' && (
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <p className="text-purple-300 text-sm">
                        💡 <strong>For Yahoo:</strong> Generate an app password in your <a href="https://login.yahoo.com/account/security" target="_blank" rel="noopener noreferrer" className="underline">Yahoo Account Security</a> settings.
                      </p>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <p className="text-green-300 text-sm">
                      🔒 <strong>Your credentials are secure:</strong> They are only used for this session and are never stored on our servers.
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleProceedWithCredentials}
                    disabled={!smtpCredentials.email || !smtpCredentials.password}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue →
                  </button>
                </div>
             </div>
        )}

        {step !== 'auth' && (
            <>
                {/* Progress Stepper */}
                <div className="glass rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className={`flex items-center ${step === 'recipients' ? 'text-orange-400' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'recipients' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-700'}`}>1</div>
                    <span className="ml-2 font-medium">Recipients</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-700 mx-4"></div>
                    <div className={`flex items-center ${step === 'context' ? 'text-orange-400' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'context' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-700'}`}>2</div>
                    <span className="ml-2 font-medium">Context</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-700 mx-4"></div>
                    <div className={`flex items-center ${step === 'review' ? 'text-orange-400' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'review' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-700'}`}>3</div>
                    <span className="ml-2 font-medium">Review</span>
                    </div>
                </div>
                </div>

                {/* Step 1: Recipients */}
                {step === 'recipients' && (
                <div className="glass rounded-3xl p-8">
                    <h2 className="text-2xl font-semibold text-white mb-6">Add Recipients (Max 50)</h2>
                    <div className="mb-6">
                    <label className="text-gray-300 mb-2 block">Enter email addresses (comma or newline separated):</label>
                    <textarea
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="john@example.com, jane@company.com&#10;bob@startup.io"
                        className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={4}
                    />
                    <button
                        onClick={handleAddEmails}
                        disabled={isLoading || !emailInput.trim()}
                        className="mt-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Checking...' : 'Add & Validate Emails'}
                    </button>
                    </div>

                    {recipients.length > 0 && (
                    <div className="glass-dark rounded-xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Recipients ({recipients.length}/50)</h3>
                        <span className="text-green-400 font-medium">{validCount} valid</span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recipients.map((recipient) => (
                            <div key={recipient.email} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${recipient.status === 'valid' ? 'bg-green-500' : recipient.status === 'cooldown' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                <span className="text-white">{recipient.email}</span>
                                {recipient.status === 'cooldown' && <span className="text-xs text-yellow-400">(Cooldown: {recipient.cooldownDays} days left)</span>}
                            </div>
                            <button onClick={() => removeRecipient(recipient.email)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                    {validCount > 0 && (
                    <button
                        onClick={() => setStep('context')}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all text-lg"
                    >
                        Continue with {validCount} Recipients →
                    </button>
                    )}
                </div>
                )}

                {/* Step 2: Context */}
                {step === 'context' && (
                <div className="glass rounded-3xl p-8">
                    <h2 className="text-2xl font-semibold text-white mb-6">Email Context</h2>
                    <div className="space-y-6">
                    <div>
                        <label className="text-gray-300 mb-2 block font-medium">Who are these recipients?</label>
                        <input
                        type="text"
                        value={context.who}
                        onChange={(e) => setContext({ ...context, who: e.target.value })}
                        placeholder="e.g., Hiring Managers at Tech Companies"
                        className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="text-gray-300 mb-2 block font-medium">What is this email about?</label>
                        <textarea
                        value={context.about}
                        onChange={(e) => setContext({ ...context, about: e.target.value })}
                        placeholder="e.g., Application for Senior Software Engineer role with 5 years React experience"
                        className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={4}
                        />
                    </div>

                    <div>
                        <label className="text-gray-300 mb-2 block font-medium">Physical Address (Required for Compliance)</label>
                        <input
                        type="text"
                        value={physicalAddress}
                        onChange={(e) => setPhysicalAddress(e.target.value)}
                        placeholder="e.g., 123 Business Rd, Tech City, TC 90210"
                        className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Required by CAN-SPAM Act. This will be included in the email footer.</p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep('recipients')} className="flex-1 py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all">← Back</button>
                        <button
                        onClick={handleGenerateEmail}
                        disabled={isLoading || !context.who.trim() || !context.about.trim() || !physicalAddress.trim()}
                        className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                        {isLoading ? 'Generating...' : 'Generate Email →'}
                        </button>
                    </div>
                    </div>
                </div>
                )}

                {/* Step 3: Review */}
                {step === 'review' && (
                <div className="glass rounded-3xl p-8">
                    <h2 className="text-2xl font-semibold text-white mb-6">Review & Send</h2>

                    {/* Safety Check Status */}
                    <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
                        safetyStatus === null ? 'bg-blue-500/20 text-blue-300' :
                        safetyStatus.safe ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                        {safetyStatus === null && <span>🛡️ AI Safety Check: Analyzing content...</span>}
                        {safetyStatus?.safe && <span>✅ AI Safety Check: Content looks safe.</span>}
                        {safetyStatus && !safetyStatus.safe && <span>❌ AI Safety Check: Flagged as unsafe ({safetyStatus.reason})</span>}
                    </div>

                    <div className="glass-dark rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-orange-300 mb-4">Generated Email:</h3>
                    <textarea
                        value={generatedEmail}
                        onChange={(e) => setGeneratedEmail(e.target.value)}
                        className="w-full p-4 rounded-xl bg-black/30 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={12}
                    />
                    <p className="text-gray-400 text-sm mt-2">💡 You can edit the email above before sending</p>
                    </div>

                    <div className="glass-dark rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Sending to:</span>
                        <span className="text-white font-semibold">{validCount} recipients</span>
                    </div>
                    </div>

                    {sendStatus && (
                    <div className={`p-4 rounded-xl mb-6 ${sendStatus.includes('✅') ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                        {sendStatus}
                    </div>
                    )}

                    <div className="flex gap-4">
                    <button onClick={() => setStep('context')} disabled={isLoading} className="flex-1 py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50">← Back</button>
                    <button
                        onClick={handleSendEmails}
                        disabled={isLoading || (safetyStatus !== null && !safetyStatus.safe)}
                        className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 text-lg"
                    >
                        {isLoading ? 'Sending...' : `📧 Send to ${validCount} Recipients`}
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
