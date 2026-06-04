/**
 * CV Generation Flow Component
 * Paste job description → Generate Master CV, Mini CV, and Cover Letter
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';

interface JobDescription {
    jobTitle: string;
    company: string;
    description: string;
}

interface GenerationResult {
    generationId: string;
    matchScore: number;
    masterCV: any;
    miniCV: any;
    coverLetter: string;
    analysis: {
        matchedSkills: string[];
        gapSkills: string[];
        industryKeywords: string[];
    };
}

type Step = 'input' | 'analyzing' | 'results';

interface Props {
    onBack: () => void;
    userId?: string;
}

export const CVGenerationFlow: React.FC<Props> = ({ onBack, userId = 'default' }) => {
    const [step, setStep] = useState<Step>('input');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState<JobDescription>({
        jobTitle: '',
        company: '',
        description: ''
    });
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [activeTab, setActiveTab] = useState<'master' | 'mini' | 'cover'>('master');

    const handleGenerate = async () => {
        if (!jobDescription.jobTitle || !jobDescription.company || !jobDescription.description) {
            setError('Please fill in all fields');
            return;
        }

        if (jobDescription.description.length < 100) {
            setError('Job description should be at least 100 characters');
            return;
        }

        setLoading(true);
        setError(null);
        setStep('analyzing');

        try {
            const response = await fetch('/api/cv/generate-tailored', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    jobDescription
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Generation failed');
            }

            setResult(data);
            setStep('results');
        } catch (err: any) {
            setError(err.message || 'Failed to generate CVs');
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    const renderInputStep = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Icons.Zap size={28} className="text-purple-400" />
                    Generate Tailored CV
                </h2>
                <p className="text-white/70">
                    Paste a job description to get a Master CV, Mini CV, and Cover Letter
                </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-white/85 mb-2">Job Title *</label>
                        <input
                            type="text"
                            value={jobDescription.jobTitle}
                            onChange={(e) => setJobDescription({ ...jobDescription, jobTitle: e.target.value })}
                            placeholder="e.g., Senior Frontend Developer"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/85 mb-2">Company *</label>
                        <input
                            type="text"
                            value={jobDescription.company}
                            onChange={(e) => setJobDescription({ ...jobDescription, company: e.target.value })}
                            placeholder="e.g., Google, Stripe, etc."
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-white/85 mb-2">
                        Job Description * <span className="text-white/60">(paste the full job posting)</span>
                    </label>
                    <textarea
                        value={jobDescription.description}
                        onChange={(e) => setJobDescription({ ...jobDescription, description: e.target.value })}
                        placeholder="Paste the complete job description here..."
                        rows={12}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-white/60 mt-1">
                        {jobDescription.description.length} characters (minimum 100)
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Icons.Zap size={20} />
                            Generate Master CV, Mini CV & Cover Letter
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );

    const renderAnalyzingStep = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
        >
            <div className="relative">
                <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icons.FileText size={32} className="text-purple-400" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-white mt-8 mb-2">Analyzing Job Description</h3>
             <p className="text-white/70 text-center max-w-md">
                 Our AI is analyzing the job requirements and tailoring your CV for maximum impact...
             </p>
             <div className="mt-8 space-y-2 text-sm text-white/60">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Extracting key requirements...
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    Matching your skills...
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    Generating tailored content...
                </div>
            </div>
        </motion.div>
    );

    const renderResultsStep = () => {
        if (!result) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Match Score Header */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                CV Generated Successfully!
                            </h2>
                            <p className="text-white/70">
                                 Tailored for {jobDescription.jobTitle} at {jobDescription.company}
                             </p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                                {result.matchScore}%
                            </div>
                            <div className="text-sm text-white/70">Match Score</div>
                        </div>
                    </div>

                    {/* Matched Skills */}
                    {result.analysis?.matchedSkills?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-sm text-white/70 mb-2">Matched Skills:</p>
                            <div className="flex flex-wrap gap-2">
                                {result.analysis.matchedSkills.slice(0, 8).map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    {[
                        { id: 'master', label: 'Master CV', icon: Icons.FileText },
                        { id: 'mini', label: 'Mini CV', icon: Icons.File },
                        { id: 'cover', label: 'Cover Letter', icon: Icons.Mail }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                                activeTab === tab.id
                                    ? 'bg-purple-500 text-white'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'master' && (
                            <motion.div
                                key="master"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <CVPreview cv={result.masterCV} type="Master CV" />
                            </motion.div>
                        )}
                        {activeTab === 'mini' && (
                            <motion.div
                                key="mini"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <CVPreview cv={result.miniCV} type="Mini CV" />
                            </motion.div>
                        )}
                        {activeTab === 'cover' && (
                            <motion.div
                                key="cover"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="prose prose-invert max-w-none">
                                    <h3 className="text-xl font-semibold text-white mb-4">Cover Letter</h3>
                                    <div className="whitespace-pre-wrap text-white/85 leading-relaxed">
                                        {result.coverLetter}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setStep('input');
                            setResult(null);
                        }}
                        className="flex-1 py-4 bg-white/10 rounded-xl text-white font-semibold hover:bg-white/20 transition-colors"
                    >
                        ← Generate Another
                    </button>
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Icons.Zap size={16} className="text-purple-400" />
                        Powered by AI
                    </div>
                </div>

                {/* Steps */}
                <AnimatePresence mode="wait">
                    {step === 'input' && renderInputStep()}
                    {step === 'analyzing' && renderAnalyzingStep()}
                    {step === 'results' && renderResultsStep()}
                </AnimatePresence>
            </div>
        </div>
    );
};

// CV Preview Component
const CVPreview: React.FC<{ cv: any; type: string }> = ({ cv, type }) => {
    if (!cv) return <div className="text-white/60">No CV data available</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">{type}</h3>

            {/* Summary */}
            {cv.summary && (
                <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2">Summary</h4>
                    <p className="text-white/85">{cv.summary}</p>
                </div>
            )}

            {/* Skills */}
            {cv.skills && (
                <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {(Array.isArray(cv.skills) ? cv.skills : []).map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white/10 text-white/85 rounded-full text-sm">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            {cv.experience?.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2">Experience</h4>
                    <div className="space-y-4">
                        {cv.experience.map((exp: any, i: number) => (
                            <div key={i} className="border-l-2 border-purple-500/30 pl-4">
                                <div className="font-medium text-white">{exp.title}</div>
                                <div className="text-sm text-white/70">{exp.company} • {exp.period}</div>
                                {exp.bullets?.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {exp.bullets.map((bullet: string, j: number) => (
                                            <li key={j} className="text-white/85 text-sm flex gap-2">
                                                <span className="text-purple-400">•</span>
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {cv.education?.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2">Education</h4>
                    <div className="space-y-2">
                        {cv.education.map((edu: any, i: number) => (
                            <div key={i}>
                                <div className="text-white">{edu.degree}</div>
                                <div className="text-sm text-white/70">{edu.institution} • {edu.year}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CVGenerationFlow;
