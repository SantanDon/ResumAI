import { useState, useEffect } from 'react';
import { Icons } from './ui/Icons';

interface JobListing {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    description: string;
    requirements?: string[];
    postedDate: string;
    source: string;
    url: string;
    easyApply?: boolean;
    remote?: boolean;
    jobType?: string;
    experienceLevel?: string;
}

interface ApplicationResult {
    jobId: string;
    status: 'success' | 'pending' | 'failed';
    message: string;
    confirmationId?: string;
    appliedAt: string;
}

interface CVOption {
    id: string;
    name: string;
    lastModified: string;
}

interface Props {
    onBack: () => void;
}

type Step = 'search' | 'select' | 'cv' | 'confirm' | 'results';

export function MassApplyInterface({ onBack }: Props) {
    const [step, setStep] = useState<Step>('search');
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
    const [selectedCV, setSelectedCV] = useState<string>('');
    const [userEmail, setUserEmail] = useState('');
    const [results, setResults] = useState<ApplicationResult[]>([]);
    const [expandedJob, setExpandedJob] = useState<string | null>(null);

    // Search filters
    const [filters, setFilters] = useState({
        keywords: '',
        location: '',
        remote: false,
        jobType: '',
        experienceLevel: '',
        postedWithin: '',
        sources: ['remoteok', 'greenhouse', 'arbeitnow', 'jobicy']
    });

    // Available CVs
    const [cvOptions, setCvOptions] = useState<CVOption[]>([
        { id: 'master', name: 'Master CV', lastModified: new Date().toISOString() }
    ]);

    // Job sources - Free APIs that work without keys
    const jobSources = [
        { id: 'remoteok', name: 'RemoteOK', icon: '🌍', active: true },
        { id: 'greenhouse', name: 'Greenhouse', icon: '🏢', active: true },
        { id: 'arbeitnow', name: 'Arbeitnow', icon: '💼', active: true },
        { id: 'jobicy', name: 'Jobicy', icon: '🌐', active: true },
        { id: 'adzuna', name: 'Adzuna', icon: '🔍', active: false },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼', active: false }
    ];

    // Fetch tailored CVs on mount
    useEffect(() => {
        fetchCVs();
    }, []);

    const fetchCVs = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/cv/tailored/default');
            const data = await res.json();
            if (data.success && data.cvs) {
                const tailoredCVs = data.cvs.map((cv: any) => ({
                    id: cv.id,
                    name: `${cv.company_name || 'Tailored'} CV`,
                    lastModified: cv.created_at
                }));
                setCvOptions([
                    { id: 'master', name: 'Master CV', lastModified: new Date().toISOString() },
                    ...tailoredCVs
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch CVs:', error);
        }
    };

    const searchJobs = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/jobs/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            const data = await res.json();
            if (data.success) {
                setJobs(data.jobs);
                setStep('select');
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
        setLoading(false);
    };

    const toggleJobSelection = (jobId: string) => {
        const newSelected = new Set(selectedJobs);
        if (newSelected.has(jobId)) {
            newSelected.delete(jobId);
        } else {
            newSelected.add(jobId);
        }
        setSelectedJobs(newSelected);
    };

    const selectAllJobs = () => {
        if (selectedJobs.size === jobs.length) {
            setSelectedJobs(new Set());
        } else {
            setSelectedJobs(new Set(jobs.map(j => j.id)));
        }
    };

    const applyToJobs = async () => {
        if (!selectedCV || selectedJobs.size === 0) return;
        
        setLoading(true);
        try {
            const selectedJobsList = jobs.filter(j => selectedJobs.has(j.id));
            const res = await fetch('http://localhost:3001/api/jobs/apply-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobs: selectedJobsList,
                    cvId: selectedCV,
                    userId: 'default',
                    userEmail
                })
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.results);
                setStep('results');
            }
        } catch (error) {
            console.error('Application failed:', error);
        }
        setLoading(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const getSourceIcon = (source: string) => {
        const icons: Record<string, string> = {
            indeed: '📋', linkedin: '💼', greenhouse: '🏢', glassdoor: '⭐',
            ziprecruiter: '⚡', remoteok: '🌍', adzuna: '🔍', career24: '🇿🇦'
        };
        return icons[source] || '📄';
    };

    // Step 1: Search Jobs
    const renderSearchStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Icons.Search size={28} className="text-purple-400" />
                    Find Your Dream Job
                </h2>
                <p className="text-gray-400">Search across multiple job platforms</p>
            </div>

            {/* Search Input */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Keywords</label>
                        <input
                            type="text"
                            value={filters.keywords}
                            onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                            placeholder="e.g., Software Engineer, React Developer"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Location</label>
                        <input
                            type="text"
                            value={filters.location}
                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            placeholder="e.g., San Francisco, Remote"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Job Type</label>
                        <select
                            value={filters.jobType}
                            onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        >
                            <option value="">All Types</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Experience</label>
                        <select
                            value={filters.experienceLevel}
                            onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        >
                            <option value="">All Levels</option>
                            <option value="entry">Entry Level</option>
                            <option value="mid">Mid Level</option>
                            <option value="senior">Senior</option>
                            <option value="executive">Executive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Posted</label>
                        <select
                            value={filters.postedWithin}
                            onChange={(e) => setFilters({ ...filters, postedWithin: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        >
                            <option value="">Any Time</option>
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.remote}
                                onChange={(e) => setFilters({ ...filters, remote: e.target.checked })}
                                className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="text-white">Remote Only</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Job Sources */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <label className="block text-sm text-gray-400 mb-4">Search Sources</label>
                <div className="flex flex-wrap gap-3">
                    {jobSources.map(source => (
                        <button
                            key={source.id}
                            onClick={() => {
                                const newSources = filters.sources.includes(source.id)
                                    ? filters.sources.filter(s => s !== source.id)
                                    : [...filters.sources, source.id];
                                setFilters({ ...filters, sources: newSources });
                            }}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                                filters.sources.includes(source.id)
                                    ? 'bg-purple-500/30 border-purple-500 text-white'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            } border`}
                        >
                            <span>{source.icon}</span>
                            <span>{source.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Button */}
            <button
                onClick={searchJobs}
                disabled={loading || !filters.keywords}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Searching...
                    </>
                ) : (
                    <>🔍 Search Jobs</>
                )}
            </button>
        </div>
    );

    // Step 2: Select Jobs
    const renderSelectStep = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icons.FileText size={24} className="text-purple-400" />
                        Select Jobs to Apply
                    </h2>
                    <p className="text-gray-400">{jobs.length} jobs found • {selectedJobs.size} selected</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={selectAllJobs}
                        className="px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                    >
                        {selectedJobs.size === jobs.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                        onClick={() => setStep('search')}
                        className="px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                    >
                        ← New Search
                    </button>
                </div>
            </div>

            {/* Job List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {jobs.map(job => (
                    <div
                        key={job.id}
                        className={`bg-white/5 backdrop-blur-xl rounded-xl border transition-all cursor-pointer ${
                            selectedJobs.has(job.id)
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div
                            className="p-4 flex items-start gap-4"
                            onClick={() => toggleJobSelection(job.id)}
                        >
                            {/* Checkbox */}
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                selectedJobs.has(job.id)
                                    ? 'bg-purple-500 border-purple-500'
                                    : 'border-white/30'
                            }`}>
                                {selectedJobs.has(job.id) && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>

                            {/* Job Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                                        <p className="text-purple-400">{job.company}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-2xl">{getSourceIcon(job.source)}</span>
                                        {job.easyApply && (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                Easy Apply
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                                    <span>📍 {job.location}</span>
                                    {job.salary && <span>💰 {job.salary}</span>}
                                    {job.jobType && <span>⏰ {job.jobType}</span>}
                                    <span>🕐 {formatDate(job.postedDate)}</span>
                                </div>

                                {job.requirements && job.requirements.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {job.requirements.slice(0, 4).map((req, i) => (
                                            <span key={i} className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-lg">
                                                {req}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Expand Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedJob(expandedJob === job.id ? null : job.id);
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedJob === job.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Expanded Description */}
                        {expandedJob === job.id && (
                            <div className="px-4 pb-4 pt-0 border-t border-white/10 mt-2">
                                <p className="text-gray-300 text-sm mt-3 whitespace-pre-wrap">
                                    {job.description.slice(0, 500)}...
                                </p>
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm mt-3"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View Original Posting →
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Continue Button */}
            <button
                onClick={() => setStep('cv')}
                disabled={selectedJobs.size === 0}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
                Continue with {selectedJobs.size} Job{selectedJobs.size !== 1 ? 's' : ''} →
            </button>
        </div>
    );

    // Step 3: Select CV
    const renderCVStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Icons.File size={28} className="text-purple-400" />
                    Choose Your CV
                </h2>
                <p className="text-gray-400">Select which CV to use for your applications</p>
            </div>

            {/* CV Options */}
            <div className="grid gap-4">
                {cvOptions.map(cv => (
                    <button
                        key={cv.id}
                        onClick={() => setSelectedCV(cv.id)}
                        className={`p-6 rounded-2xl border text-left transition-all ${
                            selectedCV === cv.id
                                ? 'bg-purple-500/20 border-purple-500'
                                : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                selectedCV === cv.id ? 'bg-purple-500' : 'bg-white/10'
                            }`}>
                                <span className="text-2xl">📄</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">{cv.name}</h3>
                                <p className="text-sm text-gray-400">
                                    Last modified: {new Date(cv.lastModified).toLocaleDateString()}
                                </p>
                            </div>
                            {selectedCV === cv.id && (
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Email for Confirmation */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <label className="block text-sm text-gray-400 mb-2">Email for Confirmation</label>
                <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                    You'll receive confirmation emails for each application
                </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
                <button
                    onClick={() => setStep('select')}
                    className="flex-1 py-4 bg-white/10 rounded-xl text-white font-semibold hover:bg-white/20 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={() => setStep('confirm')}
                    disabled={!selectedCV}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Review & Apply →
                </button>
            </div>
        </div>
    );

    // Step 4: Confirm
    const renderConfirmStep = () => {
        const selectedJobsList = jobs.filter(j => selectedJobs.has(j.id));
        const selectedCVName = cvOptions.find(cv => cv.id === selectedCV)?.name || 'Unknown CV';

        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                        <Icons.Check size={28} className="text-green-400" />
                        Confirm Applications
                    </h2>
                    <p className="text-gray-400">Review your selections before applying</p>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                            <div className="text-4xl font-bold text-white">{selectedJobsList.length}</div>
                            <div className="text-gray-400">Jobs Selected</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white">📄</div>
                            <div className="text-gray-400">{selectedCVName}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white">✉️</div>
                            <div className="text-gray-400 truncate">{userEmail || 'No email'}</div>
                        </div>
                    </div>
                </div>

                {/* Job List Preview */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Jobs to Apply:</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedJobsList.map(job => (
                            <div key={job.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <span className="text-xl">{getSourceIcon(job.source)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium truncate">{job.title}</div>
                                    <div className="text-gray-400 text-sm truncate">{job.company}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <div className="text-yellow-400 font-medium">Before you apply</div>
                        <div className="text-yellow-400/70 text-sm">
                            Make sure your CV is up to date. Applications will be submitted to each job platform.
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setStep('cv')}
                        className="flex-1 py-4 bg-white/10 rounded-xl text-white font-semibold hover:bg-white/20 transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={applyToJobs}
                        disabled={loading}
                        className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Applying...
                            </>
                        ) : (
                            <>🚀 Apply to {selectedJobsList.length} Jobs</>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // Step 5: Results
    const renderResultsStep = () => {
        const successful = results.filter(r => r.status === 'success');
        const failed = results.filter(r => r.status === 'failed');
        const pending = results.filter(r => r.status === 'pending');

        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                        <Icons.Rocket size={28} className="text-green-400" />
                        Applications Submitted!
                    </h2>
                    <p className="text-gray-400">Here's a summary of your applications</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 text-center">
                        <div className="text-4xl font-bold text-green-400">{successful.length}</div>
                        <div className="text-green-400/70">Successful</div>
                    </div>
                    <div className="bg-yellow-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 text-center">
                        <div className="text-4xl font-bold text-yellow-400">{pending.length}</div>
                        <div className="text-yellow-400/70">Pending</div>
                    </div>
                    <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 text-center">
                        <div className="text-4xl font-bold text-red-400">{failed.length}</div>
                        <div className="text-red-400/70">Failed</div>
                    </div>
                </div>

                {/* Results List */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Application Details:</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {results.map((result, i) => {
                            const job = jobs.find(j => j.id === result.jobId);
                            return (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                                    result.status === 'success' ? 'bg-green-500/10' :
                                    result.status === 'pending' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                                }`}>
                                    <span className="text-xl">
                                        {result.status === 'success' ? '✅' : result.status === 'pending' ? '⏳' : '❌'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">{job?.title || 'Unknown Job'}</div>
                                        <div className="text-gray-400 text-sm truncate">{job?.company}</div>
                                    </div>
                                    {result.confirmationId && (
                                        <div className="text-xs text-gray-500 font-mono">
                                            {result.confirmationId}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Email Confirmation Notice */}
                {userEmail && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-2xl">📧</span>
                        <div>
                            <div className="text-blue-400 font-medium">Confirmation Sent</div>
                            <div className="text-blue-400/70 text-sm">
                                A summary has been sent to {userEmail}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setStep('search');
                            setSelectedJobs(new Set());
                            setResults([]);
                        }}
                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                        🔍 Search More Jobs
                    </button>
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 bg-white/10 rounded-xl text-white font-semibold hover:bg-white/20 transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        );
    };

    // Progress indicator
    const steps = [
        { key: 'search', label: 'Search', icon: '🔍' },
        { key: 'select', label: 'Select', icon: '📋' },
        { key: 'cv', label: 'CV', icon: '📄' },
        { key: 'confirm', label: 'Confirm', icon: '✅' },
        { key: 'results', label: 'Done', icon: '🎉' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icons.Rocket size={24} className="text-indigo-400" />
                        Mass Apply
                    </h1>
                    <div className="w-20" />
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((s, i) => (
                        <div key={s.key} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                i < currentStepIndex ? 'bg-green-500' :
                                i === currentStepIndex ? 'bg-purple-500' : 'bg-white/10'
                            }`}>
                                {i < currentStepIndex ? '✓' : s.icon}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-8 h-1 mx-1 rounded ${
                                    i < currentStepIndex ? 'bg-green-500' : 'bg-white/10'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                {step === 'search' && renderSearchStep()}
                {step === 'select' && renderSelectStep()}
                {step === 'cv' && renderCVStep()}
                {step === 'confirm' && renderConfirmStep()}
                {step === 'results' && renderResultsStep()}
            </div>
        </div>
    );
}
