import React, { useState } from 'react';
import { CVData, Experience, Education, SkillCategory } from './templates/types';
import { HarvardTemplate } from './templates/HarvardTemplate';
import { WizardStepper } from './ui/WizardStepper';
import { SpotlightCard } from './ui/SpotlightCard';
import { GradientInput } from './ui/GradientInput';
import { ShinyButton } from './reactbits/ShinyButton';
import { Icons } from './ui/Icons';

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
            <h3 className="text-xl font-bold text-white mb-4">Choose your Harvard style</h3>
            <div className="grid grid-cols-1 gap-4">
                <SpotlightCard 
                    onClick={() => setTemplate('harvard')} 
                    isSelected={template === 'harvard'}
                    className="p-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                            <Icons.FileText className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Harvard Classic</h4>
                            <p className="text-xs text-gray-400">Traditional, text-heavy, ATS-optimized. Best for corporate roles.</p>
                        </div>
                    </div>
                </SpotlightCard>

                <SpotlightCard 
                    onClick={() => setTemplate('harvard-modern')} 
                    isSelected={template === 'harvard-modern'}
                    className="p-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                            <Icons.Layers className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Harvard Modern</h4>
                            <p className="text-xs text-gray-400">Clean lines with subtle accents. Great for tech & startups.</p>
                        </div>
                    </div>
                </SpotlightCard>

                <SpotlightCard 
                    onClick={() => setTemplate('harvard-executive')} 
                    isSelected={template === 'harvard-executive'}
                    className="p-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                            <Icons.Award className="text-amber-400" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Harvard Executive</h4>
                            <p className="text-xs text-gray-400">Premium layout for senior positions. Emphasizes leadership.</p>
                        </div>
                    </div>
                </SpotlightCard>
            </div>
        </div>
    );

    // Personal Info Step
    const renderPersonalStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-4">Who are you?</h3>
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
    );

    // Experience Step
    const renderExperienceStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Work Experience</h3>
                <button
                    onClick={addExperience}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors"
                >
                    <Icons.Plus size={16} />
                    Add Position
                </button>
            </div>

            {data.experience.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-700 rounded-xl bg-gray-900/50 text-center">
                    <Icons.Briefcase className="mx-auto text-gray-600 mb-3" size={40} />
                    <p className="text-gray-400 text-sm">No experience added yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Click "Add Position" to get started.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {data.experience.map((exp, expIndex) => (
                        <div key={exp.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-purple-400 font-mono">Position {expIndex + 1}</span>
                                <button
                                    onClick={() => removeExperience(exp.id)}
                                    className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                >
                                    <Icons.Trash size={16} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                    placeholder="Company Name"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                                <input
                                    type="text"
                                    value={exp.role}
                                    onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                    placeholder="Job Title"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={exp.startDate}
                                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                    placeholder="Start Date (e.g. Jan 2020)"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                                <input
                                    type="text"
                                    value={exp.endDate}
                                    onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                    placeholder="End Date (or Present)"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Bullet Points</span>
                                    <button
                                        onClick={() => addBulletPoint(exp.id)}
                                        className="text-xs text-purple-400 hover:text-purple-300"
                                    >
                                        + Add bullet
                                    </button>
                                </div>
                                {exp.description.map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start gap-2">
                                        <span className="text-gray-500 mt-2">•</span>
                                        <textarea
                                            value={bullet}
                                            onChange={(e) => updateBulletPoint(exp.id, bulletIndex, e.target.value)}
                                            placeholder="Describe your achievement with metrics..."
                                            rows={2}
                                            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                                        />
                                        {exp.description.length > 1 && (
                                            <button
                                                onClick={() => removeBulletPoint(exp.id, bulletIndex)}
                                                className="p-1 hover:bg-red-500/20 rounded text-red-400 mt-1"
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
                <h3 className="text-xl font-bold text-white">Education</h3>
                <button
                    onClick={addEducation}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors"
                >
                    <Icons.Plus size={16} />
                    Add Education
                </button>
            </div>

            {data.education.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-700 rounded-xl bg-gray-900/50 text-center">
                    <Icons.GraduationCap className="mx-auto text-gray-600 mb-3" size={40} />
                    <p className="text-gray-400 text-sm">No education added yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Click "Add Education" to get started.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {data.education.map((edu, eduIndex) => (
                        <div key={edu.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-purple-400 font-mono">Education {eduIndex + 1}</span>
                                <button
                                    onClick={() => removeEducation(edu.id)}
                                    className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                >
                                    <Icons.Trash size={16} />
                                </button>
                            </div>
                            
                            <input
                                type="text"
                                value={edu.school}
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                placeholder="School/University Name"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                            
                            <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="Degree (e.g. BS Computer Science)"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                            
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={edu.startDate}
                                    onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                    placeholder="Start Year"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                                <input
                                    type="text"
                                    value={edu.endDate}
                                    onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                    placeholder="End Year"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                                <input
                                    type="text"
                                    value={edu.gpa || ''}
                                    onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                    placeholder="GPA (optional)"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
                <h3 className="text-xl font-bold text-white">Skills</h3>
                <button
                    onClick={addSkillCategory}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors"
                >
                    <Icons.Plus size={16} />
                    Add Category
                </button>
            </div>

            {data.skills.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-700 rounded-xl bg-gray-900/50 text-center">
                    <Icons.Zap className="mx-auto text-gray-600 mb-3" size={40} />
                    <p className="text-gray-400 text-sm">No skills added yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Click "Add Category" to organize your skills.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {data.skills.map((skill, catIndex) => (
                        <div key={catIndex} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    value={skill.category}
                                    onChange={(e) => updateSkillCategory(catIndex, e.target.value)}
                                    placeholder="Category (e.g. Languages, Tools)"
                                    className="bg-transparent border-none text-purple-400 font-medium text-sm focus:outline-none placeholder-gray-500"
                                />
                                <button
                                    onClick={() => removeSkillCategory(catIndex)}
                                    className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                >
                                    <Icons.Trash size={16} />
                                </button>
                            </div>
                            
                            <input
                                type="text"
                                value={skill.items.join(', ')}
                                onChange={(e) => updateSkillItems(catIndex, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="Skills (comma separated: React, Node.js, Python)"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                            
                            <div className="flex flex-wrap gap-2">
                                {skill.items.filter(Boolean).map((item, i) => (
                                    <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg">
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
        <div className="space-y-6 animate-fadeIn text-center pt-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                <Icons.Rocket className="text-green-400" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white">Ready to Launch!</h3>
            <p className="text-gray-400 mb-8">Your CV is ready. Review the preview and download when ready.</p>
            
            <ShinyButton 
                onClick={handlePrint}
                className="!bg-green-500/20 !border-green-500/50 hover:!bg-green-500/30 w-full py-4 text-lg"
            >
                <Icons.Download className="inline mr-2" size={20} />
                Download PDF
            </ShinyButton>

            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-sm font-medium text-white mb-3">Quick Stats</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-purple-400">{data.experience.length}</div>
                        <div className="text-xs text-gray-500">Positions</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-400">{data.education.length}</div>
                        <div className="text-xs text-gray-500">Education</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-400">{data.skills.reduce((acc, s) => acc + s.items.length, 0)}</div>
                        <div className="text-xs text-gray-500">Skills</div>
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
        const props = { data };
        switch (template) {
            case 'harvard': return <HarvardTemplate {...props} />;
            case 'harvard-modern': return (
                <React.Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
                    <HarvardModernTemplate {...props} />
                </React.Suspense>
            );
            case 'harvard-executive': return (
                <React.Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
                    <HarvardExecutiveTemplate {...props} />
                </React.Suspense>
            );
            default: return <HarvardTemplate {...props} />;
        }
    };

    return (
        <div className="flex h-screen text-white overflow-hidden font-sans">
            {/* Left Panel: Wizard */}
            <div className="w-1/3 h-full flex flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl z-10 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 to-purple-900/10 pointer-events-none" />

                <div className="p-6 border-b border-white/10 flex justify-between items-center z-20">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <Icons.ArrowLeft size={16} />
                                <span className="text-sm">Back</span>
                            </button>
                        )}
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            CV Wizard
                        </h2>
                    </div>
                    <div className="text-xs font-mono text-gray-500">v3.0</div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar z-20">
                    <WizardStepper steps={STEPS} currentStep={currentStep} />
                    {renderStepContent()}
                </div>

                {/* Navigation Footer */}
                <div className="p-6 border-t border-white/10 bg-black/80 backdrop-blur-md z-20 flex justify-between">
                    <button 
                        onClick={prevStep} 
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                            currentStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icons.ChevronLeft size={16} />
                        Back
                    </button>
                    
                    {currentStep < STEPS.length - 1 && (
                        <ShinyButton onClick={nextStep} className="!px-8 !py-2 !text-sm">
                            Next Step
                            <Icons.ChevronRight className="inline ml-1" size={16} />
                        </ShinyButton>
                    )}
                </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="w-2/3 h-full bg-gray-900/50 overflow-y-auto p-8 flex justify-center items-start relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                
                <div 
                    id="cv-preview"
                    className="bg-white shadow-2xl w-[210mm] min-h-[297mm] origin-top transform scale-[0.75] transition-all duration-500 ease-out z-10"
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
            `}</style>
        </div>
    );
};
