export interface Experience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string[];
    visible?: boolean;
}

export interface Education {
    id: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    visible?: boolean;
}

export interface SkillCategory {
    category: string;
    items: string[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    visible?: boolean;
}

export interface CVData {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        linkedin?: string;
        website?: string;
        location?: string;
    };
    summary: string;
    experience: Experience[];
    education: Education[];
    skills: SkillCategory[];
    projects?: Project[];
}

export interface TemplateProps {
    data: CVData;
}
