import React from 'react';
import { CVData } from './types';

interface Props {
    data: CVData;
}

export const HarvardModernTemplate: React.FC<Props> = ({ data }) => {
    const { personalInfo, experience, education, skills, projects } = data;

    return (
        <div className="p-10 font-['Georgia',serif] text-[11pt] leading-relaxed text-gray-900 bg-white min-h-full">
            {/* Header with subtle accent */}
            <header className="text-center pb-4 mb-6 border-b-2 border-gray-800">
                <h1 className="text-3xl font-bold tracking-wide text-gray-900 mb-2">
                    {personalInfo.fullName || 'Your Name'}
                </h1>
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    {personalInfo.location && <span>{personalInfo.location}</span>}
                    {personalInfo.phone && (
                        <>
                            <span className="text-gray-400">|</span>
                            <span>{personalInfo.phone}</span>
                        </>
                    )}
                    {personalInfo.email && (
                        <>
                            <span className="text-gray-400">|</span>
                            <a href={`mailto:${personalInfo.email}`} className="text-blue-700 hover:underline">
                                {personalInfo.email}
                            </a>
                        </>
                    )}
                </div>
                <div className="flex justify-center gap-4 mt-2 text-sm">
                    {personalInfo.linkedin && (
                        <a href={`https://${personalInfo.linkedin}`} className="text-blue-700 hover:underline">
                            LinkedIn
                        </a>
                    )}
                    {personalInfo.website && (
                        <a href={`https://${personalInfo.website}`} className="text-blue-700 hover:underline">
                            Portfolio
                        </a>
                    )}
                </div>
            </header>

            {/* Education Section */}
            {education.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                        Education
                    </h2>
                    {education.map((edu) => (
                        <div key={edu.id} className="mb-3">
                            <div className="flex justify-between items-baseline">
                                <div>
                                    <span className="font-bold">{edu.school}</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {edu.startDate} – {edu.endDate}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="italic">{edu.degree}</span>
                                {edu.gpa && <span>GPA: {edu.gpa}</span>}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Experience Section */}
            {experience.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                        Professional Experience
                    </h2>
                    {experience.map((exp) => (
                        <div key={exp.id} className="mb-4">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold">{exp.company}</span>
                                <span className="text-sm text-gray-600">
                                    {exp.startDate} – {exp.endDate}
                                </span>
                            </div>
                            <div className="italic text-sm mb-1">{exp.role}</div>
                            <ul className="list-disc ml-5 text-sm space-y-1">
                                {exp.description.filter(Boolean).map((bullet, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{ __html: bullet }} />
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            )}

            {/* Projects Section */}
            {projects && projects.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                        Projects
                    </h2>
                    {projects.map((project) => (
                        <div key={project.id} className="mb-3">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold">{project.name}</span>
                                {project.link && (
                                    <a href={project.link} className="text-blue-700 text-xs hover:underline">
                                        [{project.link}]
                                    </a>
                                )}
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                                {project.technologies?.join(', ')}
                            </div>
                            <p className="text-sm">{project.description}</p>
                        </div>
                    ))}
                </section>
            )}

            {/* Skills Section */}
            {skills.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                        Skills
                    </h2>
                    <div className="space-y-1">
                        {skills.map((skill, i) => (
                            <div key={i} className="text-sm">
                                <span className="font-semibold">{skill.category}:</span>{' '}
                                <span>{skill.items.join(', ')}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
