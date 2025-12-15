import React from 'react';
import { TemplateProps } from './types';

export const HarvardTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
        <div className="w-full h-full bg-white text-black p-8 font-serif text-sm leading-relaxed" id="cv-preview">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{data.personalInfo.fullName}</h1>
                <div className="flex justify-center gap-4 text-xs">
                    {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
                    <span>{data.personalInfo.phone}</span>
                    <a href={`mailto:${data.personalInfo.email}`} className="hover:underline">{data.personalInfo.email}</a>
                    {data.personalInfo.linkedin && <a href={data.personalInfo.linkedin} className="hover:underline">LinkedIn</a>}
                    {data.personalInfo.website && <a href={data.personalInfo.website} className="hover:underline">Portfolio</a>}
                </div>
            </div>

            {/* Education (Harvard style puts this first usually) */}
            {data.education.length > 0 && (
                <div className="mb-6">
                    <h2 className="font-bold uppercase border-b border-black mb-3">Education</h2>
                    {data.education.map((edu) => (
                        <div key={edu.id} className="mb-2">
                            <div className="flex justify-between font-bold">
                                <span>{edu.school}</span>
                                <span>{edu.startDate} – {edu.endDate}</span>
                            </div>
                            <div className="flex justify-between italic">
                                <span>{edu.degree}</span>
                                {edu.gpa && <span>GPA: {edu.gpa}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <div className="mb-6">
                    <h2 className="font-bold uppercase border-b border-black mb-3">Experience</h2>
                    {data.experience.map((exp) => (
                        <div key={exp.id} className="mb-4">
                            <div className="flex justify-between font-bold">
                                <span>{exp.company}</span>
                                <span>{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <div className="italic mb-1">{exp.role}</div>
                            <ul className="list-disc ml-5 space-y-1">
                                {exp.description.map((bullet, idx) => (
                                    <li key={idx}>{bullet}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* Projects (Optional) */}
            {data.projects && data.projects.length > 0 && (
                <div className="mb-6">
                    <h2 className="font-bold uppercase border-b border-black mb-3">Projects</h2>
                    {data.projects.map((proj) => (
                        <div key={proj.id} className="mb-2">
                            <div className="font-bold">
                                {proj.name} 
                                {proj.link && <a href={proj.link} className="font-normal text-xs ml-2 text-blue-800 hover:underline">[Link]</a>}
                            </div>
                            <div className="text-xs italic mb-1">{proj.technologies.join(', ')}</div>
                            <p>{proj.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Skills */}
            {data.skills.length > 0 && (
                <div className="mb-6">
                    <h2 className="font-bold uppercase border-b border-black mb-3">Skills</h2>
                    <div className="grid grid-cols-1 gap-1">
                        {data.skills.map((cat, idx) => (
                            <div key={idx} className="flex">
                                <span className="font-bold w-32 flex-shrink-0">{cat.category}:</span>
                                <span>{cat.items.join(', ')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
