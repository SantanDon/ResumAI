import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    userId?: string;
}

type Step = 'search' | 'select' | 'cv' | 'confirm' | 'results';

export function MassApplyInterface({ onBack, userId = 'demo@resumai.com' }: Props) {
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

    // Dropdown states for custom glass listboxes
    const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
    const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
    const [showPostedDropdown, setShowPostedDropdown] = useState(false);

    // Available CVs
    const [cvOptions, setCvOptions] = useState<CVOption[]>([
        { id: 'master', name: 'Master CV', lastModified: new Date().toISOString() }
    ]);

    // Job sources styled with icons and custom toggles
    const jobSources = [
        { id: 'remoteok', name: 'RemoteOK', icon: <Icons.Globe size={14} className="text-violet-400" />, active: true },
        { id: 'greenhouse', name: 'Greenhouse', icon: <Icons.Building size={14} className="text-pink-400" />, active: true },
        { id: 'arbeitnow', name: 'Arbeitnow', icon: <Icons.Briefcase size={14} className="text-emerald-400" />, active: true },
        { id: 'jobicy', name: 'Jobicy', icon: <Icons.Globe size={14} className="text-blue-400" />, active: true },
        { id: 'adzuna', name: 'Adzuna', icon: <Icons.Search size={14} className="text-zinc-400" />, active: false },
        { id: 'linkedin', name: 'LinkedIn', icon: <Icons.LinkedIn size={14} className="text-indigo-400" />, active: false }
    ];

    // Fetch tailored CVs on mount
    useEffect(() => {
        fetchCVs();
    }, []);

    const fetchCVs = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/cv/tailored-list/${userId}`);
            const data = await res.json();
            if (data.success && data.cvs) {
                const tailoredCVs = data.cvs.map((cv: any) => ({
                    id: cv.id,
                    name: `${cv.company || cv.company_name || 'Tailored'} CV`,
                    lastModified: cv.created_at || cv.updated_at || new Date().toISOString()
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
                    userId,
                    userEmail
                })
            });
            const data = await res.json();
            if (data.success && data.results) {
                const mappedResults: ApplicationResult[] = data.results.map((result: any, index: number) => {
                    const originalJob = selectedJobsList[index];
                    return {
                        jobId: originalJob ? originalJob.id : '',
                        status: result.status === 'queued' ? 'success' : result.status === 'needs_review' ? 'pending' : 'failed',
                        message: result.status === 'queued' 
                            ? 'Queued for automated transmission' 
                            : result.status === 'needs_review' 
                            ? 'Pending manual review (automation blocked)' 
                            : (result.error || 'Failed to initialize transmission pipeline'),
                        confirmationId: result.jobQueueId || undefined,
                        appliedAt: new Date().toISOString()
                    };
                });
                setResults(mappedResults);
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

    // Close all open dropdowns
    const closeAllDropdowns = () => {
        setShowJobTypeDropdown(false);
        setShowExperienceDropdown(false);
        setShowPostedDropdown(false);
    };

    // Step 1: Search Jobs
    const renderSearchStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Icons.Search size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Find Your Remote Opportunity</h2>
                <p className="text-sm text-zinc-400 mt-1">Aggregated job search powered by smart recruiter filters</p>
            </div>

            {/* Search Input Cards */}
            <div className="lumen-container rounded-3xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Keywords</label>
                        <div className="relative rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/40">
                            <input
                                type="text"
                                value={filters.keywords}
                                onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                                placeholder="e.g., Software Engineer, React, Product Manager"
                                className="w-full bg-zinc-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Location / Workspace</label>
                        <div className="relative rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/40">
                            <input
                                type="text"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                placeholder="e.g., San Francisco, Austin, Remote"
                                className="w-full bg-zinc-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters Row - Custom Absolute Overlay Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {/* Job Type Dropdown */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Job Type</label>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowJobTypeDropdown(!showJobTypeDropdown);
                                setShowExperienceDropdown(false);
                                setShowPostedDropdown(false);
                            }}
                            className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-sm text-left text-white flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
                        >
                            <span className="truncate">{filters.jobType ? filters.jobType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All Types'}</span>
                            <Icons.ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${showJobTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                        {showJobTypeDropdown && (
                            <motion.div 
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className="absolute top-full left-0 mt-2 w-full bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50"
                            >
                                {[
                                    { id: '', name: 'All Types' },
                                    { id: 'full-time', name: 'Full-time' },
                                    { id: 'part-time', name: 'Part-time' },
                                    { id: 'contract', name: 'Contract' },
                                    { id: 'internship', name: 'Internship' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            setFilters({ ...filters, jobType: opt.id });
                                            setShowJobTypeDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                                            filters.jobType === opt.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>{opt.name}</span>
                                        {filters.jobType === opt.id && <Icons.Check size={14} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    {/* Experience Dropdown */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Experience</label>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowExperienceDropdown(!showExperienceDropdown);
                                setShowJobTypeDropdown(false);
                                setShowPostedDropdown(false);
                            }}
                            className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-sm text-left text-white flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
                        >
                            <span className="truncate">{filters.experienceLevel ? filters.experienceLevel.replace(/\b\w/g, c => c.toUpperCase()) + ' Level' : 'All Levels'}</span>
                            <Icons.ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${showExperienceDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                        {showExperienceDropdown && (
                            <motion.div 
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className="absolute top-full left-0 mt-2 w-full bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50"
                            >
                                {[
                                    { id: '', name: 'All Levels' },
                                    { id: 'entry', name: 'Entry Level' },
                                    { id: 'mid', name: 'Mid Level' },
                                    { id: 'senior', name: 'Senior Level' },
                                    { id: 'executive', name: 'Executive Level' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            setFilters({ ...filters, experienceLevel: opt.id });
                                            setShowExperienceDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                                            filters.experienceLevel === opt.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>{opt.name}</span>
                                        {filters.experienceLevel === opt.id && <Icons.Check size={14} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    {/* Posted Dropdown */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Posted</label>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPostedDropdown(!showPostedDropdown);
                                setShowJobTypeDropdown(false);
                                setShowExperienceDropdown(false);
                            }}
                            className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-sm text-left text-white flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
                        >
                            <span className="truncate text-sm">
                                {filters.postedWithin === '24h' ? 'Last 24 Hours' :
                                 filters.postedWithin === '7d' ? 'Last 7 Days' :
                                 filters.postedWithin === '30d' ? 'Last 30 Days' : 'Any Time'}
                            </span>
                            <Icons.ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${showPostedDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                        {showPostedDropdown && (
                            <motion.div 
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className="absolute top-full left-0 mt-2 w-full bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50"
                            >
                                {[
                                    { id: '', name: 'Any Time' },
                                    { id: '24h', name: 'Last 24 hours' },
                                    { id: '7d', name: 'Last 7 days' },
                                    { id: '30d', name: 'Last 30 days' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            setFilters({ ...filters, postedWithin: opt.id });
                                            setShowPostedDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                                            filters.postedWithin === opt.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>{opt.name}</span>
                                        {filters.postedWithin === opt.id && <Icons.Check size={14} />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    {/* Remote Toggle Switch */}
                    <div className="flex items-end">
                        <div className="flex items-center justify-between w-full bg-zinc-950/40 border border-white/10 rounded-xl px-4 py-3">
                            <span className="text-sm font-semibold text-zinc-300">Remote Only</span>
                            <button
                                onClick={() => setFilters({ ...filters, remote: !filters.remote })}
                                className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                                    filters.remote ? 'bg-gradient-to-r from-violet-600 to-pink-600' : 'bg-zinc-800'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                                        filters.remote ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Sources */}
            <div className="lumen-container rounded-3xl p-6 space-y-4">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Search Pipelines</label>
                <div className="flex flex-wrap gap-3">
                    {jobSources.map(source => {
                        const isSelected = filters.sources.includes(source.id);
                        return (
                            <button
                                key={source.id}
                                onClick={() => {
                                    const newSources = filters.sources.includes(source.id)
                                        ? filters.sources.filter(s => s !== source.id)
                                        : [...filters.sources, source.id];
                                    setFilters({ ...filters, sources: newSources });
                                }}
                                className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 border text-sm font-semibold transition-all duration-300 ${
                                    isSelected
                                        ? 'bg-violet-600/10 border-violet-500 text-violet-300 shadow-md shadow-violet-500/5'
                                        : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10'
                                }`}
                            >
                                {source.icon}
                                <span>{source.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search Button */}
            <button
                onClick={searchJobs}
                disabled={loading || !filters.keywords}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl text-white font-bold text-base hover:opacity-95 active:scale-[0.99] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching Pipelines...
                    </>
                ) : (
                    <>
                        <Icons.Search size={18} />
                        Launch Intelligence Search
                    </>
                )}
            </button>
        </div>
    );

    // Step 2: Select Jobs
    const renderSelectStep = () => (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Icons.List size={22} className="text-violet-400" />
                        Select Matches
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">{jobs.length} roles fetched • {selectedJobs.size} queued for outreach</p>
                </div>
                <div className="flex gap-2.5">
                    <button
                        onClick={selectAllJobs}
                        className="px-4 py-2 bg-zinc-800/40 border border-white/5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        {selectedJobs.size === jobs.length ? 'Clear Selection' : 'Select All'}
                    </button>
                    <button
                        onClick={() => setStep('search')}
                        className="px-4 py-2 bg-zinc-800/40 border border-white/5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        ← Back to Search
                    </button>
                </div>
            </div>

            {/* Job List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                {jobs.map(job => (
                    <div
                        key={job.id}
                        className={`bg-zinc-900/30 backdrop-blur-xl rounded-2xl border transition-all duration-300 hover:bg-zinc-900/50 ${
                            selectedJobs.has(job.id)
                                ? 'border-violet-500/50 bg-violet-600/5 shadow-md shadow-violet-500/5'
                                : 'border-white/5'
                        }`}
                    >
                        <div
                            className="p-4 flex items-start gap-4 cursor-pointer"
                            onClick={() => toggleJobSelection(job.id)}
                        >
                            {/* Custom Checkbox */}
                            <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-300 ${
                                selectedJobs.has(job.id)
                                    ? 'bg-gradient-to-br from-violet-600 to-pink-600 border-transparent shadow-lg shadow-violet-500/25 scale-105'
                                    : 'border-white/10 bg-zinc-950/40 hover:border-white/30'
                            }`}>
                                {selectedJobs.has(job.id) && (
                                    <Icons.Check className="text-white" size={12} strokeWidth={3} />
                                )}
                            </div>

                            {/* Job Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-base font-bold text-white tracking-tight">{job.title}</h3>
                                        <p className="text-sm font-semibold text-violet-400 mt-0.5">{job.company}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-lg">{getSourceIcon(job.source)}</span>
                                        {job.easyApply && (
                                            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                                                Easy Apply
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-zinc-400">
                                    <span className="flex items-center gap-1"><Icons.MapPin size={12} className="text-zinc-500" /> {job.location}</span>
                                    {job.salary && <span>💰 {job.salary}</span>}
                                    {job.jobType && <span>⏰ {job.jobType}</span>}
                                    <span>🕐 {formatDate(job.postedDate)}</span>
                                </div>

                                {job.requirements && job.requirements.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {job.requirements.slice(0, 3).map((req, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/5 text-zinc-300 text-[10px] rounded-lg">
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
                                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0 self-center"
                            >
                                <Icons.ChevronDown size={16} className={`text-zinc-500 transition-transform duration-300 ${expandedJob === job.id ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Expanded Description with transitions */}
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            expandedJob === job.id ? 'max-h-[500px] border-t border-white/5 opacity-100 px-4 pb-4 pt-2' : 'max-h-0 opacity-0'
                        }`}>
                            <p className="text-zinc-300 text-xs mt-2 leading-relaxed whitespace-pre-wrap">
                                {job.description.slice(0, 600)}...
                            </p>
                            <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 hover:underline text-xs font-semibold mt-3 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                View Original Job Posting
                                <Icons.ChevronRight size={12} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Continue Button */}
            <button
                onClick={() => setStep('cv')}
                disabled={selectedJobs.size === 0}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl text-white font-bold text-base hover:opacity-95 active:scale-[0.99] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none mt-4 shadow-lg shadow-violet-500/10"
            >
                Continue Outreach Setup with {selectedJobs.size} Job{selectedJobs.size !== 1 ? 's' : ''} →
            </button>
        </div>
    );

    // Step 3: Choose CV
    const renderCVStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Icons.File size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Select Resume Model</h2>
                <p className="text-sm text-zinc-400">Choose the optimal CV target record for job application transmission</p>
            </div>

            {/* CV Options */}
            <div className="grid gap-3">
                {cvOptions.map(cv => {
                    const isSelected = selectedCV === cv.id;
                    return (
                        <button
                            key={cv.id}
                            onClick={() => setSelectedCV(cv.id)}
                            className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
                                isSelected
                                    ? 'bg-violet-600/10 border-violet-500'
                                    : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/50'
                            }`}
                        >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'
                            }`}>
                                <Icons.FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white truncate">{cv.name}</h3>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Last synchronized: {new Date(cv.lastModified).toLocaleDateString()}
                                </p>
                            </div>
                            {isSelected && (
                                <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow-md shadow-violet-500/20">
                                    <Icons.Check className="text-white" size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Email for Confirmation */}
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-3">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email for System Confirmation</label>
                <div className="relative rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500/40">
                    <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full bg-zinc-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                </div>
                <p className="text-[11px] text-zinc-500">
                    A transmission receipt and summary dispatch log will be forwarded to this address.
                </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
                <button
                    onClick={() => setStep('select')}
                    className="flex-1 py-4 bg-zinc-800/40 border border-white/5 hover:bg-zinc-850 hover:text-white text-zinc-300 font-semibold rounded-2xl transition-all"
                >
                    ← Back
                </button>
                <button
                    onClick={() => setStep('confirm')}
                    disabled={!selectedCV || !userEmail}
                    className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl text-white font-bold hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-violet-500/10"
                >
                    Review Transmission →
                </button>
            </div>
        </div>
    );

    // Step 4: Confirm
    const renderConfirmStep = () => {
        const selectedJobsList = jobs.filter(j => selectedJobs.has(j.id));
        const selectedCVName = cvOptions.find(cv => cv.id === selectedCV)?.name || 'Default Resume';

        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Icons.Check size={28} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Verify Deployment Details</h2>
                    <p className="text-sm text-zinc-400">Please review queue settings prior to batch application submission</p>
                </div>

                {/* Summary Grid */}
                <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/5 backdrop-blur-xl rounded-3xl p-6 border border-violet-500/20 shadow-xl">
                    <div className="grid grid-cols-3 gap-4 text-center divide-x divide-white/5">
                        <div>
                            <div className="text-3xl font-bold text-white tracking-tight">{selectedJobsList.length}</div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Jobs Selected</div>
                        </div>
                        <div className="px-2">
                            <div className="text-lg font-bold text-white truncate max-w-full block px-1">{selectedCVName}</div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 mt-1">CV Target</div>
                        </div>
                        <div className="px-2">
                            <div className="text-sm font-semibold text-white truncate max-w-full block px-1">{userEmail}</div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Notification E-Mail</div>
                        </div>
                    </div>
                </div>

                {/* Job List Preview */}
                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
                    <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">Outreach Queue Profile</h3>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {selectedJobsList.map(job => (
                            <div key={job.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                                <span className="text-lg flex-shrink-0">{getSourceIcon(job.source)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-zinc-200 font-semibold text-sm truncate">{job.title}</div>
                                    <div className="text-zinc-500 text-xs truncate mt-0.5">{job.company}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Safety compliance notice */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <div className="text-amber-300 font-bold text-xs uppercase tracking-wider">Transmission Compliance Warning</div>
                        <div className="text-amber-200/70 text-xs mt-1 leading-relaxed">
                            Confirm that the selected resume matches target role skills to optimize pipeline filtering. All applications are final.
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setStep('cv')}
                        className="flex-1 py-4 bg-zinc-800/40 border border-white/5 hover:bg-zinc-850 hover:text-white text-zinc-300 font-semibold rounded-2xl transition-all"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={applyToJobs}
                        disabled={loading}
                        className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white font-bold hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 text-base"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deploying Applications...
                            </>
                        ) : (
                            <>🚀 Deploy Outreach Batch</>
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
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Icons.Rocket size={26} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Transmission Complete</h2>
                    <p className="text-sm text-zinc-400">The application batch has been successfully distributed to target pipelines</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-500/5 backdrop-blur-xl rounded-2xl p-5 border border-emerald-500/20 text-center shadow-xl">
                        <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{successful.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 mt-1">Successful</div>
                    </div>
                    <div className="bg-amber-500/5 backdrop-blur-xl rounded-2xl p-5 border border-amber-500/20 text-center shadow-xl">
                        <div className="text-3xl font-extrabold text-amber-400 tracking-tight">{pending.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/60 mt-1">Pending</div>
                    </div>
                    <div className="bg-rose-500/5 backdrop-blur-xl rounded-2xl p-5 border border-rose-500/20 text-center shadow-xl">
                        <div className="text-3xl font-extrabold text-rose-400 tracking-tight">{failed.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400/60 mt-1">Failed</div>
                    </div>
                </div>

                {/* Results List */}
                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
                    <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">Outreach Telemetry Log</h3>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {results.map((result, i) => {
                            const job = jobs.find(j => j.id === result.jobId);
                            return (
                                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                                    result.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/10 text-zinc-200' :
                                    result.status === 'pending' ? 'bg-amber-500/5 border-amber-500/10 text-zinc-200' : 'bg-rose-500/5 border-rose-500/10 text-zinc-200'
                                }`}>
                                    <span className="text-base flex-shrink-0">
                                        {result.status === 'success' ? '✅' : result.status === 'pending' ? '⏳' : '❌'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-zinc-200 font-semibold text-sm truncate">{job?.title || 'Unknown Role'}</div>
                                        <div className="text-zinc-500 text-xs truncate mt-0.5">{job?.company}</div>
                                    </div>
                                    {result.confirmationId && (
                                        <div className="text-[10px] text-zinc-500 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
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
                  <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4 flex items-start gap-3">
                      <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                          <div className="text-violet-300 font-bold text-xs uppercase tracking-wider">E-Mail Dispatch Notification Sent</div>
                          <div className="text-violet-200/70 text-xs mt-1 leading-relaxed">
                              A confirmation log containing transmission parameters has been queued for delivery to {userEmail}.
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
                        className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl text-white font-bold hover:opacity-95 active:scale-[0.99] shadow-lg shadow-violet-500/10 text-base"
                    >
                        Launch New Pipeline Search
                    </button>
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 bg-zinc-800/40 border border-white/5 hover:bg-zinc-850 hover:text-white text-zinc-300 font-semibold rounded-2xl transition-all"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    };

    // Progress indicator steps
    const steps = [
        { key: 'search', label: 'Search', icon: <Icons.Search size={14} /> },
        { key: 'select', label: 'Select', icon: <Icons.List size={14} /> },
        { key: 'cv', label: 'CV', icon: <Icons.FileText size={14} /> },
        { key: 'confirm', label: 'Confirm', icon: <Icons.Check size={14} /> },
        { key: 'results', label: 'Done', icon: <Icons.Rocket size={14} /> }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="min-h-screen p-6 bg-transparent transition-smooth" onClick={closeAllDropdowns}>
            <div className="max-w-4xl mx-auto">
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
                        <Icons.Rocket size={24} className="text-violet-400" />
                        Mass Apply scout
                    </h1>
                    <div className="w-20" />
                </div>

                {/* Progress Steps */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 mb-8 flex items-center justify-center gap-2 shadow-xl">
                    {steps.map((s, i) => {
                        const isActive = i === currentStepIndex;
                        const isCompleted = i < currentStepIndex;
                        return (
                            <React.Fragment key={s.key}>
                                <div className={`flex items-center gap-2 ${isActive ? 'text-violet-400' : isCompleted ? 'text-green-400' : 'text-zinc-500'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                        isActive 
                                            ? 'bg-gradient-to-br from-violet-600 to-pink-600 text-white shadow-md shadow-violet-500/15 scale-105 border border-violet-400/20' 
                                            : isCompleted 
                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                            : 'bg-zinc-800/40 border border-white/5 text-zinc-500'
                                    }`}>
                                        {isCompleted ? <Icons.Check size={12} strokeWidth={3} /> : s.icon}
                                    </div>
                                    <span className="text-xs font-bold tracking-wide hidden sm:inline">{s.label}</span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`w-8 sm:w-12 h-0.5 mx-1 transition-all duration-500 ${
                                        i < currentStepIndex ? 'bg-gradient-to-r from-emerald-500 to-violet-500' : 'bg-zinc-800'
                                    }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
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
