import React, { useState } from 'react';
import { CVData, Experience, Education, SkillCategory } from './templates/types';
import { HarvardTemplate } from './templates/HarvardTemplate';
import { WizardStepper } from './ui/WizardStepper';
import { SpotlightCard } from './ui/SpotlightCard';
import { GradientInput } from './ui/GradientInput';
import { ShinyButton } from './reactbits/ShinyButton';
import { Icons } from './ui/Icons';
import { RichTextEditor } from './ui/RichTextEditor';

// Default empty data
const initialData: CVData = {
    personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: []
};

const STEPS = ['Template', 'Personal', 'Experience', 'Education', 'Skills', 'Finalize'];

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

interface CVEditorProps {
    onBack?: () => void;
}

export const CVEditor: React.FC<CVEditorProps> = ({ onBack }) => {
    const [data, setData] = useState<CVData>(initialData);
    const [template, setTemplate] = useState<'harvard' | 'harvard-modern' | 'harvard-executive'>('harvard');
    
    // Lazy load template components
    const HarvardModernTemplate = React.lazy(() => import('./templates/HarvardModernTemplate').then(m => ({ default: m.HarvardModernTemplate })));
    const HarvardExecutiveTemplate = React.lazy(() => import('./templates/HarvardExecutiveTemplate').then(m => ({ default: m.HarvardExecutiveTemplate })));
    const [currentStep, setCurrentStep] = useState(0);

    // Personal Info handlers
    const handleInfoChange = (field: keyof typeof data.personalInfo, value: string) => {
        setData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [field]: value }
        }));
    };

    // Experience handlers
    const addExperience = () => {
        const newExp: Experience = {
            id: generateId(),
            company: '',
            role: '',
            startDate: '',
            endDate: '',
            description: ['']
        };
        setData(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
    };

    const updateExperience = (id: string, field: keyof Experience, value: any) => {
        setData(prev => ({
            ...prev,
            experience: prev.experience.map(exp =>
                exp.id === id ? { ...exp, [field]: value } : exp
            )
        }));
    };

    const removeExperience = (id: string) => {
        setData(prev => ({
            ...prev,
            experience: prev.experience.filter(exp => exp.id !== id)
        }));
    };

    const toggleExperienceVisibility = (id: string) => {
        setData(prev => ({
            ...prev,
            experience: prev.experience.map(exp =>
                exp.id === id ? { ...exp, visible: exp.visible === false ? true : false } : exp
            )
        }));
    };

    const addBulletPoint = (expId: string) => {
        setData(prev => ({
            ...prev,
            experience: prev.experience.map(exp =>
                exp.id === expId ? { ...exp, description: [...exp.description, ''] } : exp
            )
        }));
    };

    const updateBulletPoint = (expId: string, index: number, value: string) => {
        setData(prev => ({
            ...prev,
            experience: prev.experience.map(exp =>
                exp.id === expId ? {
                    ...exp,
                    description: exp.description.map((d, i) => i === index ? value : d)
                } : exp
            )
        }));
    };

    const removeBulletPoint = (expId: string, index: number) => {
        setData(prev => ({
            ...prev,
            experience: prev.experience.map(exp =>
                exp.id === expId ? {
                    ...exp,
                    description: exp.description.filter((_, i) => i !== index)
                } : exp
            )
        }));
    };

    // Education handlers
    const addEducation = () => {
        const newEdu: Education = {
            id: generateId(),
            school: '',
            degree: '',
            startDate: '',
            endDate: '',
            gpa: ''
        };
        setData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
    };

    const updateEducation = (id: string, field: keyof Education, value: string) => {
        setData(prev => ({
            ...prev,
            education: prev.education.map(edu =>
                edu.id === id ? { ...edu, [field]: value } : edu
            )
        }));
    };

    const removeEducation = (id: string) => {
        setData(prev => ({
            ...prev,
            education: prev.education.filter(edu => edu.id !== id)
        }));
    };

    const toggleEducationVisibility = (id: string) => {
        setData(prev => ({
            ...prev,
            education: prev.education.map(edu =>
                edu.id === id ? { ...edu, visible: edu.visible === false ? true : false } : edu
            )
        }));
    };

    // Skills handlers
    const addSkillCategory = () => {
        const newCat: SkillCategory = { category: '', items: [''] };
        setData(prev => ({ ...prev, skills: [...prev.skills, newCat] }));
    };

    const updateSkillCategory = (index: number, category: string) => {
        setData(prev => ({
            ...prev,
            skills: prev.skills.map((s, i) => i === index ? { ...s, category } : s)
        }));
    };

    const updateSkillItems = (catIndex: number, items: string[]) => {
        setData(prev => ({
            ...prev,
            skills: prev.skills.map((s, i) => i === catIndex ? { ...s, items } : s)
        }));
    };

    const removeSkillCategory = (index: number) => {
        setData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    const handlePrint = () => window.print();
    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    // Template Selection Step
    const renderTemplateStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Choose your Harvard style</h3>
                <p className="text-white/70 text-sm">Select a template that best fits your target role</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                <SpotlightCard 
                    onClick={() => setTemplate('harvard')} 
                    isSelected={template === 'harvard'}
                    className="p-5 hover:bg-white/5 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                            <Icons.FileText className="text-blue-400" size={28} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-lg mb-1">Harvard Classic</h4>
                            <p className="text-xs text-white/70">Traditional, text-heavy, ATS-optimized. Best for corporate roles and traditional industries.</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${template === 'harvard' ? 'border-blue-500 bg-blue-500' : 'border-gray-600'} transition-all`} />
                    </div>
                </SpotlightCard>

                <SpotlightCard 
                    onClick={() => setTemplate('harvard-modern')} 
                    isSelected={template === 'harvard-modern'}
                    className="p-5 hover:bg-white/5 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                            <Icons.Layers className="text-purple-400" size={28} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-lg mb-1">Harvard Modern</h4>
                            <p className="text-xs text-white/70">Clean lines with subtle accents. Great for tech, startups, and creative industries.</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${template === 'harvard-modern' ? 'border-purple-500 bg-purple-500' : 'border-gray-600'} transition-all`} />
                    </div>
                </SpotlightCard>

                <SpotlightCard 
                    onClick={() => setTemplate('harvard-executive')} 
                    isSelected={template === 'harvard-executive'}
                    className="p-5 hover:bg-white/5 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0">
                            <Icons.Award className="text-amber-400" size={28} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-lg mb-1">Harvard Executive</h4>
                            <p className="text-xs text-white/70">Premium layout for senior positions. Emphasizes leadership and strategic impact.</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${template === 'harvard-executive' ? 'border-amber-500 bg-amber-500' : 'border-gray-600'} transition-all`} />
                    </div>
                </SpotlightCard>
            </div>
        </div>
    );

    // Personal Info Step
    const renderPersonalStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <Icons.User className="text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Who are you?</h3>
                <p className="text-white/70 text-sm">Fill in your personal details</p>
            </div>
            <div className="space-y-4">
                <GradientInput 
                    label="Full Name" 
                    value={data.personalInfo.fullName}
                    onChange={(e) => handleInfoChange('fullName', e.target.value)}
                    placeholder="e.g. Jane Doe"
                    icon={<Icons.User size={16} />}
                />
                <div className="grid grid-cols-2 gap-4">
                    <GradientInput 
                        label="Email" 
                        value={data.personalInfo.email}
                        onChange={(e) => handleInfoChange('email', e.target.value)}
                        placeholder="jane@email.com"
                        icon={<Icons.Mail size={16} />}
                    />
                    <GradientInput 
                        label="Phone" 
                        value={data.personalInfo.phone}
                        onChange={(e) => handleInfoChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        icon={<Icons.Phone size={16} />}
                    />
                </div>
                <GradientInput 
                    label="Location" 
                    value={data.personalInfo.location}
                    onChange={(e) => handleInfoChange('location', e.target.value)}
                    placeholder="New York, NY"
                    icon={<Icons.MapPin size={16} />}
                />
                <div className="grid grid-cols-2 gap-4">
                    <GradientInput 
                        label="LinkedIn URL" 
                        value={data.personalInfo.linkedin}
                        onChange={(e) => handleInfoChange('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/janedoe"
                        icon={<Icons.LinkedIn size={16} />}
                    />
                    <GradientInput 
                        label="Website/Portfolio" 
                        value={data.personalInfo.website}
                        onChange={(e) => handleInfoChange('website', e.target.value)}
                        placeholder="janedoe.com"
                        icon={<Icons.Globe size={16} />}
                    />
                </div>
            </div>
        </div>
    );

    // Experience Step
    const renderExperienceStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icons.Briefcase className="text-purple-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Work Experience</h3>
                        <p className="text-xs text-white/60">Add your professional history</p>
                    </div>
                </div>
                <button
                    onClick={addExperience}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-all"
                >
                    <Icons.Plus size={16} />
                    Add Position
                </button>
            </div>

            {data.experience.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Icons.Briefcase className="text-white/70" size={32} />
                    </div>
                    <p className="text-white/70 text-sm mb-2">No experience added yet.</p>
                     <p className="text-xs text-white/70">Click "Add Position" to get started.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                    {data.experience.map((exp, expIndex) => (
                        <div key={exp.id} className={`p-5 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl space-y-4 hover:border-white/20 transition-all ${exp.visible === false ? 'opacity-40 border-dashed border-zinc-800' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-xs text-purple-400 font-mono">{expIndex + 1}</span>
                                    <span className="text-xs text-white/60">Position</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => toggleExperienceVisibility(exp.id)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                                        title={exp.visible === false ? "Show in template preview" : "Hide in template preview"}
                                    >
                                        {exp.visible === false ? <Icons.EyeOff size={16} className="text-zinc-550" /> : <Icons.Eye size={16} className="text-purple-450" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeExperience(exp.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                    >
                                        <Icons.Trash size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                    placeholder="Company Name"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                                <input
                                    type="text"
                                    value={exp.role}
                                    onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                    placeholder="Job Title"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={exp.startDate}
                                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                    placeholder="Start Date (e.g. Jan 2020)"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                                <input
                                    type="text"
                                    value={exp.endDate}
                                    onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                    placeholder="End Date (or Present)"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/70 flex items-center gap-2">
                                        <Icons.List className="size-4" /> Bullet Points
                                    </span>
                                    <button
                                        onClick={() => addBulletPoint(exp.id)}
                                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                                    >
                                        <Icons.Plus size={12} /> Add bullet
                                    </button>
                                </div>
                                {exp.description.map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start gap-2">
                                        <span className="text-white/60 mt-3 text-sm">•</span>
                                        <RichTextEditor
                                            value={bullet}
                                            onChange={(html) => updateBulletPoint(exp.id, bulletIndex, html)}
                                            placeholder="Describe your achievement with metrics..."
                                            className="flex-1"
                                        />
                                        {exp.description.length > 1 && (
                                            <button
                                                onClick={() => removeBulletPoint(exp.id, bulletIndex)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 mt-1 transition-colors"
                                            >
                                                <Icons.Trash size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Education Step
    const renderEducationStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Icons.GraduationCap className="text-green-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Education</h3>
                        <p className="text-xs text-white/60">Add your academic credentials</p>
                    </div>
                </div>
                <button
                    onClick={addEducation}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-lg text-green-300 text-sm transition-all"
                >
                    <Icons.Plus size={16} />
                    Add Education
                </button>
            </div>

            {data.education.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Icons.GraduationCap className="text-white/70" size={32} />
                    </div>
                    <p className="text-white/70 text-sm mb-2">No education added yet.</p>
                    <p className="text-xs text-white/70">Click "Add Education" to get started.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                    {data.education.map((edu, eduIndex) => (
                        <div key={edu.id} className={`p-5 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl space-y-4 hover:border-white/20 transition-all ${edu.visible === false ? 'opacity-40 border-dashed border-zinc-800' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center text-xs text-green-400 font-mono">{eduIndex + 1}</span>
                                    <span className="text-xs text-white/60">Education</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => toggleEducationVisibility(edu.id)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                                        title={edu.visible === false ? "Show in template preview" : "Hide in template preview"}
                                    >
                                        {edu.visible === false ? <Icons.EyeOff size={16} className="text-zinc-550" /> : <Icons.Eye size={16} className="text-green-455" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeEducation(edu.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                    >
                                        <Icons.Trash size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <input
                                type="text"
                                value={edu.school}
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                placeholder="School/University Name"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                            />
                            
                            <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="Degree (e.g. BS Computer Science)"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                            />
                            
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={edu.startDate}
                                    onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                    placeholder="Start Year"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                                />
                                <input
                                    type="text"
                                    value={edu.endDate}
                                    onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                    placeholder="End Year"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                                />
                                <input
                                    type="text"
                                    value={edu.gpa || ''}
                                    onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                    placeholder="GPA (optional)"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Skills Step
    const renderSkillsStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Icons.Zap className="text-amber-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Skills</h3>
                        <p className="text-xs text-white/60">Showcase your expertise</p>
                    </div>
                </div>
                <button
                    onClick={addSkillCategory}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-lg text-amber-300 text-sm transition-all"
                >
                    <Icons.Plus size={16} />
                    Add Category
                </button>
            </div>

            {data.skills.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Icons.Zap className="text-white/70" size={32} />
                    </div>
                    <p className="text-white/70 text-sm mb-2">No skills added yet.</p>
                    <p className="text-xs text-white/70">Click "Add Category" to organize your skills.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                    {data.skills.map((skill, catIndex) => (
                        <div key={catIndex} className="p-5 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl space-y-4 hover:border-white/20 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 mr-4">
                                    <input
                                        type="text"
                                        value={skill.category}
                                        onChange={(e) => updateSkillCategory(catIndex, e.target.value)}
                                        placeholder="Category (e.g. Languages, Tools, Frameworks)"
                                        className="w-full bg-transparent border-none text-amber-400 font-medium text-sm focus:outline-none placeholder-gray-500"
                                    />
                                </div>
                                <button
                                    onClick={() => removeSkillCategory(catIndex)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                >
                                    <Icons.Trash size={16} />
                                </button>
                            </div>
                            
                            <input
                                type="text"
                                value={skill.items.join(', ')}
                                onChange={(e) => updateSkillItems(catIndex, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="Skills (comma separated: React, Node.js, Python, TypeScript)"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />
                            
                            <div className="flex flex-wrap gap-2">
                                {skill.items.filter(Boolean).map((item, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-xs rounded-lg border border-amber-500/30">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Finalize Step
    const renderFinalizeStep = () => (
        <div className="space-y-8 animate-fadeIn text-center pt-8">
            <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-3xl border border-green-500/30 animate-pulse" />
                    <Icons.Rocket className="text-green-400" size={48} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Icons.Check className="text-white" size={16} />
                </div>
            </div>
            
            <div>
                <h3 className="text-2xl font-bold text-white mb-3">Ready to Launch!</h3>
                <p className="text-white/70 mb-2">Your CV is ready for the world.</p>
                <p className="text-sm text-white/60">Review the preview and download when ready.</p>
            </div>
            
            <div className="flex flex-col gap-3">
                <ShinyButton 
                    onClick={handlePrint}
                    className="!bg-gradient-to-r !from-green-500/20 !to-emerald-500/20 !border-green-500/50 hover:!bg-green-500/30 w-full py-4 text-lg"
                >
                    <span className="flex items-center justify-center gap-2">
                        <Icons.Download size={20} />
                        Download PDF
                    </span>
                </ShinyButton>
            </div>

            {/* Progress Stats */}
            <div className="p-6 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10">
                <h4 className="text-sm font-medium text-white/70 mb-4 flex items-center justify-center gap-2">
                    <Icons.Chart className="size-4" /> Your CV at a Glance
                </h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{data.experience.length}</div>
                        <div className="text-xs text-white/60 mt-1">Positions</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{data.education.length}</div>
                        <div className="text-xs text-white/60 mt-1">Education</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{data.skills.reduce((acc, s) => acc + s.items.filter(Boolean).length, 0)}</div>
                        <div className="text-xs text-white/60 mt-1">Skills</div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render current step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return renderTemplateStep();
            case 1: return renderPersonalStep();
            case 2: return renderExperienceStep();
            case 3: return renderEducationStep();
            case 4: return renderSkillsStep();
            case 5: return renderFinalizeStep();
            default: return null;
        }
    };

    // Get template component
    const renderTemplate = () => {
        const filteredData = {
            ...data,
            experience: data.experience.filter(exp => exp.visible !== false),
            education: data.education.filter(edu => edu.visible !== false),
            projects: data.projects?.filter(proj => proj.visible !== false)
        };
        const props = { data: filteredData };
        switch (template) {
            case 'harvard': return <HarvardTemplate {...props} />;
            case 'harvard-modern': return (
                <React.Suspense fallback={<div className="p-10 text-center"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" /></div>}>
                    <HarvardModernTemplate {...props} />
                </React.Suspense>
            );
            case 'harvard-executive': return (
                <React.Suspense fallback={<div className="p-10 text-center"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" /></div>}>
                    <HarvardExecutiveTemplate {...props} />
                </React.Suspense>
            );
            default: return <HarvardTemplate {...props} />;
        }
    };

    return (
        <div 
            className="flex h-screen font-sans" 
            style={{ 
                color: 'var(--text-primary)',
                background: 'var(--void)'
            }}
        >
            {/* Left Panel: Wizard */}
            <div 
                className="w-[420px] h-full flex flex-col relative" 
                style={{ 
                    background: 'var(--abyss)',
                    borderRight: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(40px)'
                }}
            >
                {/* Gradient Overlay */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center z-20 relative">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                            >
                                <Icons.ArrowLeft size={16} />
                                <span className="text-sm">Back</span>
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                CV Wizard
                            </h2>
                            <div className="text-xs font-mono text-white/60">Step {currentStep + 1} of {STEPS.length}</div>
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                </div>
                
                {/* Stepper & Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar z-20 relative">
                    <WizardStepper steps={STEPS} currentStep={currentStep} />
                    {renderStepContent()}
                </div>

                {/* Navigation Footer */}
                <div className="p-6 border-t border-white/10 bg-black/80 backdrop-blur-md z-20 relative">
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={prevStep} 
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                currentStep === 0 
                                ? 'text-white/60 cursor-not-allowed' 
                                : 'text-white/85 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icons.ChevronLeft size={18} />
                            Previous
                        </button>
                        
                        {currentStep < STEPS.length - 1 ? (
                            <ShinyButton onClick={nextStep} className="!px-8 !py-3 !text-sm">
                                <span className="flex items-center gap-2">
                                    Next Step
                                    <Icons.ChevronRight size={18} />
                                </span>
                            </ShinyButton>
                        ) : (
                            <div className="text-xs text-white/60">All steps complete!</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="flex-1 h-full bg-gray-900/50 overflow-y-auto p-8 flex justify-center items-start relative">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                
                {/* CV Container */}
                <div 
                    id="cv-preview"
                    className="bg-white shadow-2xl w-[210mm] min-h-[297mm] origin-top transform scale-[0.75] transition-all duration-500 ease-out z-10 rounded-lg"
                    style={{ pageBreakAfter: 'always' }}
                >
                    {renderTemplate()}
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #cv-preview, #cv-preview * { visibility: visible; }
                    #cv-preview {
                        position: absolute;
                        left: 0; top: 0;
                        width: 100%; height: 100%;
                        margin: 0; padding: 0;
                        transform: none !important;
                    }
                    @page { size: A4; margin: 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
                
                /* Custom Scrollbar */
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
