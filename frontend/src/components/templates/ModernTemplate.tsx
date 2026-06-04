import React from 'react';
import { TemplateProps } from './types';

export const ModernTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="w-full h-full bg-white text-gray-800 flex font-sans" id="cv-preview">
            {/* Sidebar */}
            <div className="w-1/3 bg-gray-100 p-6 flex flex-col h-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">{data.personalInfo.fullName}</h1>
                    <p className="text-sm text-gray-600 mb-4">{data.personalInfo.location}</p>
                    
                    <div className="text-xs space-y-2 text-gray-600">
                        <div className="flex items-center gap-2">
                            <span>📧</span> <a href={`mailto:${data.personalInfo.email}`} className="hover:text-blue-600">{data.personalInfo.email}</a>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>📱</span> <span>{data.personalInfo.phone}</span>
                        </div>
                        {data.personalInfo.linkedin && (
                            <div className="flex items-center gap-2">
                                <span>🔗</span> <a href={data.personalInfo.linkedin} className="hover:text-blue-600">LinkedIn</a>
                            </div>
                        )}
                        {data.personalInfo.website && (
                            <div className="flex items-center gap-2">
                                <span>🌐</span> <a href={data.personalInfo.website} className="hover:text-blue-600">Portfolio</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Skills in Sidebar */}
                <div className="mb-8">
                    <h3 className="uppercase tracking-widest text-xs font-bold text-gray-500 mb-4 border-b border-gray-300 pb-1">Skills</h3>
                    <div className="space-y-4">
                        {data.skills.map((cat, idx) => (
                            <div key={idx}>
                                <h4 className="font-bold text-sm mb-1">{cat.category}</h4>
                                <div className="flex flex-wrap gap-1">
                                    {cat.items.map((item, i) => (
                                        <span key={i} className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Education in Sidebar */}
                <div>
                    <h3 className="uppercase tracking-widest text-xs font-bold text-gray-500 mb-4 border-b border-gray-300 pb-1">Education</h3>
                    <div className="space-y-4">
                        {data.education.map((edu) => (
                            <div key={edu.id}>
                                <div className="font-bold text-sm">{edu.school}</div>
                                <div className="text-xs italic text-gray-600">{edu.degree}</div>
                                <div className="text-xs text-gray-500">{edu.startDate} – {edu.endDate}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-2/3 p-8">
                {/* Summary */}
                <div className="mb-8">
                    <h3 className="uppercase tracking-widest text-xs font-bold text-gray-500 mb-4 border-b border-gray-300 pb-1">Profile</h3>
                    <p className="text-sm leading-relaxed text-gray-700">{data.summary}</p>
                </div>

                {/* Experience */}
                <div className="mb-8">
                    <h3 className="uppercase tracking-widest text-xs font-bold text-gray-500 mb-4 border-b border-gray-300 pb-1">Experience</h3>
                    <div className="space-y-6">
                        {data.experience.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-bold text-lg text-gray-900">{exp.role}</h4>
                                    <span className="text-xs text-gray-500 font-medium">{exp.startDate} – {exp.endDate}</span>
                                </div>
                                <div className="text-sm text-blue-600 font-medium mb-2">{exp.company}</div>
                                <ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">
                                    {exp.description.map((bullet, idx) => (
                                        <li key={idx} dangerouslySetInnerHTML={{ __html: bullet }} />
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <div>
                        <h3 className="uppercase tracking-widest text-xs font-bold text-gray-500 mb-4 border-b border-gray-300 pb-1">Projects</h3>
                        <div className="space-y-4">
                            {data.projects.map((proj) => (
                                <div key={proj.id}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-sm">{proj.name}</h4>
                                        {proj.link && <a href={proj.link} className="text-xs text-blue-500 hover:underline">View Project ↗</a>}
                                    </div>
                                    <p className="text-sm text-gray-700 mb-1">{proj.description}</p>
                                    <div className="text-xs text-gray-500 font-mono">Stack: {proj.technologies.join(' • ')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
