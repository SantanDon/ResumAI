import React from 'react';
import { TemplateProps } from './types';

export const AnalyticsTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="w-full h-full bg-white text-slate-800 p-8 font-sans" id="cv-preview">
            {/* Header: Name + Title + Contact Grid */}
            <div className="mb-6 border-b-4 border-slate-800 pb-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">{data.personalInfo.fullName}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
                    {data.personalInfo.location && <span>📍 {data.personalInfo.location}</span>}
                    <span>📧 {data.personalInfo.email}</span>
                    <span>📱 {data.personalInfo.phone}</span>
                    {data.personalInfo.linkedin && <a href={data.personalInfo.linkedin} className="text-blue-600 hover:underline">LinkedIn</a>}
                    {data.personalInfo.website && <a href={data.personalInfo.website} className="text-blue-600 hover:underline">Portfolio</a>}
                </div>
            </div>

            {/* Technical Skills Grid (Top Priority for Analytics) */}
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Technical Arsenal</h2>
                <div className="grid grid-cols-2 gap-4">
                    {data.skills.map((cat, idx) => (
                        <div key={idx}>
                            <span className="font-bold text-slate-700 text-sm block mb-1">{cat.category}</span>
                            <p className="text-sm text-slate-600 leading-snug">{cat.items.join(', ')}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Professional Experience */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-800 rounded-full"></span> Professional Experience
                </h2>
                <div className="space-y-6">
                    {data.experience.map((exp) => (
                        <div key={exp.id} className="relative pl-4 border-l-2 border-slate-200">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-bold text-lg text-slate-900">{exp.role}</h3>
                                <span className="text-sm font-mono text-slate-500">{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <div className="text-slate-700 font-medium mb-2">{exp.company}</div>
                            <ul className="space-y-1">
                                {exp.description.map((bullet, idx) => (
                                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 bg-slate-400 rounded-full flex-shrink-0"></span>
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Projects (Crucial for Analytics) */}
            {data.projects && data.projects.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-800 rounded-full"></span> Key Projects
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {data.projects.map((proj) => (
                            <div key={proj.id} className="border border-slate-200 rounded p-3 hover:border-slate-300 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">{proj.name}</h4>
                                    {proj.link && <a href={proj.link} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">View Code</a>}
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{proj.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {proj.technologies.map((tech, i) => (
                                        <span key={i} className="text-[10px] uppercase font-bold tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-800 rounded-full"></span> Education
                </h2>
                <div className="grid grid-cols-1 gap-4">
                    {data.education.map((edu) => (
                        <div key={edu.id} className="flex justify-between items-center bg-slate-50 p-3 rounded">
                            <div>
                                <div className="font-bold text-slate-800">{edu.school}</div>
                                <div className="text-sm text-slate-600">{edu.degree}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-mono text-slate-500">{edu.startDate} – {edu.endDate}</div>
                                {edu.gpa && <div className="text-xs font-bold text-slate-400">GPA: {edu.gpa}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
