import React from 'react';
import { CVData } from './types';

interface Props {
    data: CVData;
}

export const HarvardExecutiveTemplate: React.FC<Props> = ({ data }) => {
    const { personalInfo, experience, education, skills, projects } = data;

    return (
        <div className="p-12 font-['Times_New_Roman',serif] text-[11pt] leading-relaxed text-gray-900 bg-white min-h-full">
            {/* Executive Header - Name prominent */}
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">
                    {personalInfo.fullName || 'Your Name'}
                </h1>
                <div className="w-20 h-1 bg-gray-800 mb-4"></div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                    {personalInfo.location && <span>{personalInfo.location}</span>}
                    {personalInfo.phone && <span>{personalInfo.phone}</span>}
                    {personalInfo.email && (
                        <a href={`mailto:${personalInfo.email}`} className="text-gray-900 hover:underline">
                            {personalInfo.email}
                        </a>
                    )}
                    {personalInfo.linkedin && (
                        <a href={`https://${personalInfo.linkedin}`} className="text-gray-900 hover:underline">
                            {personalInfo.linkedin}
                        </a>
                    )}
                </div>
            </header>

            {/* Professional Summary - Executive style often includes this */}
            {data.summary && (
                <section className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                        Executive Summary
                    </h2>
                    <p className="text-sm leading-relaxed border-l-2 border-gray-300 pl-4 italic">
                        {data.summary}
                    </p>
                </section>
            )}

            {/* Experience Section - Most prominent for executives */}
            {experience.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">
                        Professional Experience
                    </h2>
                    {experience.map((exp) => (
                        <div key={exp.id} className="mb-5">
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <div className="font-bold text-base">{exp.role}</div>
                                    <div className="text-sm text-gray-700">{exp.company}</div>
                                </div>
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                    {exp.startDate} – {exp.endDate}
                                </span>
                            </div>
                            <ul className="list-none ml-0 text-sm space-y-1 mt-2">
                                {exp.description.filter(Boolean).map((bullet, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="text-gray-400 mr-2">▸</span>
                                        <span dangerouslySetInnerHTML={{ __html: bullet }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            )}

            {/* Two Column Layout for Education and Skills */}
            <div className="grid grid-cols-2 gap-8">
                {/* Education */}
                {education.length > 0 && (
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
                            Education
                        </h2>
                        {education.map((edu) => (
                            <div key={edu.id} className="mb-3">
                                <div className="font-bold text-sm">{edu.school}</div>
                                <div className="text-sm italic">{edu.degree}</div>
                                <div className="text-xs text-gray-500">
                                    {edu.startDate} – {edu.endDate}
                                    {edu.gpa && ` | GPA: ${edu.gpa}`}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
                            Core Competencies
                        </h2>
                        <div className="space-y-2">
                            {skills.map((skill, i) => (
                                <div key={i}>
                                    <div className="text-xs font-semibold text-gray-700 uppercase">
                                        {skill.category}
                                    </div>
                                    <div className="text-sm">{skill.items.join(' • ')}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Projects/Achievements */}
            {projects && projects.length > 0 && (
                <section className="mt-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
                        Key Projects & Achievements
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {projects.map((project) => (
                            <div key={project.id} className="p-3 bg-gray-50 rounded">
                                <div className="font-bold text-sm">{project.name}</div>
                                <div className="text-xs text-gray-600 mb-1">
                                    {project.technologies?.join(' | ')}
                                </div>
                                <p className="text-xs">{project.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
