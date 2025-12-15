/**
 * ATS Analyzer Service
 * Analyzes CVs for ATS (Applicant Tracking System) compatibility
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

export interface ATSIssue {
    type: 'critical' | 'warning' | 'suggestion';
    category: string;
    message: string;
    fix: string;
    location?: string;
}

export interface ATSAnalysisResult {
    score: number; // 0-100
    issues: ATSIssue[];
    passedChecks: string[];
    recommendations: string[];
}

export interface ATSParseResult {
    name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
    experience: Array<{
        title: string;
        company: string;
        duration: string;
        bullets: string[];
    }>;
    education: Array<{
        degree: string;
        institution: string;
        year: string;
    }>;
    extractionQuality: number; // 0-100
}

// Standard ATS-friendly section headers
const STANDARD_HEADERS = [
    'summary', 'professional summary', 'objective',
    'experience', 'work experience', 'professional experience', 'employment history',
    'education', 'academic background',
    'skills', 'technical skills', 'core competencies',
    'certifications', 'licenses',
    'projects', 'achievements', 'awards'
];

// Problematic formatting patterns
const PROBLEMATIC_PATTERNS = [
    { pattern: /[│┃┆┇┊┋|]/, issue: 'Table borders or pipe characters' },
    { pattern: /[★☆●○◆◇■□▪▫]/, issue: 'Special bullet characters' },
    { pattern: /[\u2500-\u257F]/, issue: 'Box drawing characters' },
    { pattern: /\t{2,}/, issue: 'Multiple tabs (may indicate columns)' },
];

// ATS-unfriendly fonts (detected by name mentions)
const PROBLEMATIC_FONTS = [
    'script', 'cursive', 'handwriting', 'decorative', 'fantasy'
];

class ATSAnalyzerService {
    /**
     * Analyze CV content for ATS compatibility
     * Returns score (0-100) and list of issues with fixes
     */
    analyze(cvContent: string, sections?: any[]): ATSAnalysisResult {
        const issues: ATSIssue[] = [];
        const passedChecks: string[] = [];
        let score = 100;

        // Check 1: Text extractability (basic check)
        if (cvContent.length < 100) {
            issues.push({
                type: 'critical',
                category: 'Content',
                message: 'CV content appears too short or may not be extractable',
                fix: 'Ensure your CV has sufficient text content and is not image-based'
            });
            score -= 30;
        } else {
            passedChecks.push('Text content is extractable');
        }

        // Check 2: Section headers
        const headerCheck = this.checkSectionHeaders(cvContent);
        if (headerCheck.issues.length > 0) {
            issues.push(...headerCheck.issues);
            score -= headerCheck.issues.length * 5;
        }
        if (headerCheck.passed.length > 0) {
            passedChecks.push(...headerCheck.passed);
        }

        // Check 3: Problematic formatting
        const formatCheck = this.checkFormatting(cvContent);
        if (formatCheck.issues.length > 0) {
            issues.push(...formatCheck.issues);
            score -= formatCheck.issues.length * 10;
        } else {
            passedChecks.push('No problematic formatting detected');
        }

        // Check 4: Contact information
        const contactCheck = this.checkContactInfo(cvContent);
        if (contactCheck.issues.length > 0) {
            issues.push(...contactCheck.issues);
            score -= contactCheck.issues.length * 5;
        }
        if (contactCheck.passed.length > 0) {
            passedChecks.push(...contactCheck.passed);
        }

        // Check 5: File structure issues
        const structureCheck = this.checkStructure(cvContent, sections);
        if (structureCheck.issues.length > 0) {
            issues.push(...structureCheck.issues);
            score -= structureCheck.issues.length * 5;
        }
        if (structureCheck.passed.length > 0) {
            passedChecks.push(...structureCheck.passed);
        }

        // Check 6: Keyword density
        const keywordCheck = this.checkKeywordDensity(cvContent);
        if (keywordCheck.issues.length > 0) {
            issues.push(...keywordCheck.issues);
            score -= keywordCheck.issues.length * 3;
        }

        // Ensure score stays in valid range
        score = Math.max(0, Math.min(100, score));

        // Generate recommendations
        const recommendations = this.generateRecommendations(issues, score);

        return {
            score,
            issues,
            passedChecks,
            recommendations
        };
    }

    /**
     * Check for standard section headers
     */
    private checkSectionHeaders(content: string): { issues: ATSIssue[], passed: string[] } {
        const issues: ATSIssue[] = [];
        const passed: string[] = [];
        const contentLower = content.toLowerCase();

        // Check for essential sections
        const essentialSections = ['experience', 'education', 'skills'];
        const foundSections: string[] = [];

        for (const section of essentialSections) {
            const variations = STANDARD_HEADERS.filter(h => h.includes(section));
            const found = variations.some(v => contentLower.includes(v));
            if (found) {
                foundSections.push(section);
            } else {
                issues.push({
                    type: 'warning',
                    category: 'Section Headers',
                    message: `Missing or non-standard "${section}" section header`,
                    fix: `Add a clear "${section.charAt(0).toUpperCase() + section.slice(1)}" section with standard header`
                });
            }
        }

        if (foundSections.length === essentialSections.length) {
            passed.push('All essential section headers present');
        }

        return { issues, passed };
    }

    /**
     * Check for problematic formatting
     */
    private checkFormatting(content: string): { issues: ATSIssue[] } {
        const issues: ATSIssue[] = [];

        for (const { pattern, issue } of PROBLEMATIC_PATTERNS) {
            if (pattern.test(content)) {
                issues.push({
                    type: 'warning',
                    category: 'Formatting',
                    message: `Detected: ${issue}`,
                    fix: 'Use simple formatting. Avoid tables, columns, and special characters'
                });
            }
        }

        // Check for excessive whitespace (may indicate columns)
        const lines = content.split('\n');
        const columnsDetected = lines.some(line => /\s{10,}/.test(line));
        if (columnsDetected) {
            issues.push({
                type: 'warning',
                category: 'Formatting',
                message: 'Possible multi-column layout detected',
                fix: 'Use single-column layout for better ATS parsing'
            });
        }

        return { issues };
    }

    /**
     * Check contact information
     */
    private checkContactInfo(content: string): { issues: ATSIssue[], passed: string[] } {
        const issues: ATSIssue[] = [];
        const passed: string[] = [];

        // Email check
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        if (emailRegex.test(content)) {
            passed.push('Email address found');
        } else {
            issues.push({
                type: 'critical',
                category: 'Contact Info',
                message: 'No email address detected',
                fix: 'Add a professional email address at the top of your CV'
            });
        }

        // Phone check
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
        if (phoneRegex.test(content)) {
            passed.push('Phone number found');
        } else {
            issues.push({
                type: 'warning',
                category: 'Contact Info',
                message: 'No phone number detected',
                fix: 'Add a phone number for recruiters to contact you'
            });
        }

        // LinkedIn check (optional but recommended)
        if (content.toLowerCase().includes('linkedin')) {
            passed.push('LinkedIn profile included');
        }

        return { issues, passed };
    }

    /**
     * Check document structure
     */
    private checkStructure(content: string, sections?: any[]): { issues: ATSIssue[], passed: string[] } {
        const issues: ATSIssue[] = [];
        const passed: string[] = [];

        // Check for dates in experience
        const datePatterns = [
            /\d{4}\s*[-–]\s*(present|\d{4})/i,
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i
        ];
        
        const hasDates = datePatterns.some(p => p.test(content));
        if (hasDates) {
            passed.push('Date formatting detected');
        } else {
            issues.push({
                type: 'suggestion',
                category: 'Structure',
                message: 'Employment dates may not be clearly formatted',
                fix: 'Use consistent date format like "Jan 2020 - Present" or "2020 - 2023"'
            });
        }

        // Check content length
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 150) {
            issues.push({
                type: 'warning',
                category: 'Content',
                message: 'CV appears too short',
                fix: 'Add more detail about your experience and achievements'
            });
        } else if (wordCount > 1500) {
            issues.push({
                type: 'suggestion',
                category: 'Content',
                message: 'CV may be too long for ATS scanning',
                fix: 'Consider condensing to 1-2 pages for better readability'
            });
        } else {
            passed.push('Content length is appropriate');
        }

        return { issues, passed };
    }

    /**
     * Check keyword density and relevance
     */
    private checkKeywordDensity(content: string): { issues: ATSIssue[] } {
        const issues: ATSIssue[] = [];
        const contentLower = content.toLowerCase();

        // Check for action verbs
        const actionVerbs = ['managed', 'developed', 'created', 'led', 'implemented', 
                           'achieved', 'improved', 'designed', 'built', 'delivered'];
        const foundVerbs = actionVerbs.filter(v => contentLower.includes(v));
        
        if (foundVerbs.length < 3) {
            issues.push({
                type: 'suggestion',
                category: 'Keywords',
                message: 'Limited action verbs detected',
                fix: 'Use strong action verbs like "Managed", "Developed", "Achieved" to describe accomplishments'
            });
        }

        // Check for quantifiable achievements
        const hasNumbers = /\d+%|\$\d+|\d+\s*(users|customers|projects|team|people)/i.test(content);
        if (!hasNumbers) {
            issues.push({
                type: 'suggestion',
                category: 'Keywords',
                message: 'No quantifiable achievements detected',
                fix: 'Add metrics and numbers to demonstrate impact (e.g., "Increased sales by 25%")'
            });
        }

        return { issues };
    }

    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations(issues: ATSIssue[], score: number): string[] {
        const recommendations: string[] = [];

        if (score < 60) {
            recommendations.push('Your CV needs significant improvements for ATS compatibility');
        } else if (score < 80) {
            recommendations.push('Your CV is moderately ATS-friendly but could be improved');
        } else {
            recommendations.push('Your CV is well-optimized for ATS systems');
        }

        const criticalCount = issues.filter(i => i.type === 'critical').length;
        if (criticalCount > 0) {
            recommendations.push(`Address ${criticalCount} critical issue(s) first`);
        }

        // Add specific recommendations based on issue categories
        const categories = [...new Set(issues.map(i => i.category))];
        if (categories.includes('Formatting')) {
            recommendations.push('Simplify formatting: use standard fonts, avoid tables and columns');
        }
        if (categories.includes('Section Headers')) {
            recommendations.push('Use standard section headers that ATS systems recognize');
        }
        if (categories.includes('Keywords')) {
            recommendations.push('Add more industry-relevant keywords and quantifiable achievements');
        }

        return recommendations;
    }

    /**
     * Simulate ATS parsing to show what information would be extracted
     */
    simulateParsing(cvContent: string): ATSParseResult {
        // Extract name (usually first line or prominent text)
        const lines = cvContent.split('\n').filter(l => l.trim());
        const name = this.extractName(lines);

        // Extract email
        const emailMatch = cvContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0] : null;

        // Extract phone
        const phoneMatch = cvContent.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0] : null;

        // Extract skills
        const skills = this.extractSkills(cvContent);

        // Extract experience
        const experience = this.extractExperience(cvContent);

        // Extract education
        const education = this.extractEducation(cvContent);

        // Calculate extraction quality
        let quality = 0;
        if (name) quality += 20;
        if (email) quality += 20;
        if (phone) quality += 10;
        if (skills.length > 0) quality += 20;
        if (experience.length > 0) quality += 20;
        if (education.length > 0) quality += 10;

        return {
            name,
            email,
            phone,
            skills,
            experience,
            education,
            extractionQuality: quality
        };
    }

    /**
     * Extract name from CV content
     */
    private extractName(lines: string[]): string | null {
        // First non-empty line that looks like a name
        for (const line of lines.slice(0, 5)) {
            const trimmed = line.trim();
            // Name is usually 2-4 words, no special characters
            if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(trimmed)) {
                return trimmed;
            }
        }
        // Fallback: first line if it's short enough
        if (lines[0] && lines[0].length < 50) {
            return lines[0].trim();
        }
        return null;
    }

    /**
     * Extract skills from CV content
     */
    private extractSkills(content: string): string[] {
        const skills: string[] = [];
        const contentLower = content.toLowerCase();

        // Common technical skills to look for
        const commonSkills = [
            'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust',
            'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
            'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
            'git', 'ci/cd', 'agile', 'scrum', 'jira',
            'machine learning', 'data analysis', 'excel', 'powerpoint', 'word',
            'project management', 'leadership', 'communication', 'problem solving'
        ];

        for (const skill of commonSkills) {
            if (contentLower.includes(skill)) {
                skills.push(skill);
            }
        }

        return skills;
    }

    /**
     * Extract experience entries from CV content
     */
    private extractExperience(content: string): ATSParseResult['experience'] {
        const experience: ATSParseResult['experience'] = [];
        const lines = content.split('\n');
        
        // Look for patterns like "Job Title at Company" or "Company - Job Title"
        const jobPatterns = [
            /^(.+?)\s+at\s+(.+?)$/i,
            /^(.+?)\s*[-–|]\s*(.+?)$/,
        ];

        // Look for date patterns
        const datePattern = /(\d{4}\s*[-–]\s*(present|\d{4})|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*[-–]\s*(present|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}))/i;

        let currentEntry: any = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if line contains a date
            const dateMatch = line.match(datePattern);
            if (dateMatch) {
                // This might be an experience entry
                if (currentEntry) {
                    experience.push(currentEntry);
                }
                currentEntry = {
                    title: line.replace(datePattern, '').trim() || 'Position',
                    company: '',
                    duration: dateMatch[0],
                    bullets: []
                };
            } else if (currentEntry && line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                // This is a bullet point
                currentEntry.bullets.push(line.replace(/^[•\-*]\s*/, ''));
            }
        }

        if (currentEntry) {
            experience.push(currentEntry);
        }

        return experience.slice(0, 5); // Return max 5 entries
    }

    /**
     * Extract education entries from CV content
     */
    private extractEducation(content: string): ATSParseResult['education'] {
        const education: ATSParseResult['education'] = [];
        const contentLower = content.toLowerCase();

        // Common degree patterns
        const degreePatterns = [
            /(bachelor|master|phd|doctorate|associate|mba|bs|ba|ms|ma|bsc|msc)['\s]*(of|in|'s)?\s*[a-z\s]+/gi,
            /(b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|ph\.?d\.?|m\.?b\.?a\.?)\s+in\s+[a-z\s]+/gi
        ];

        for (const pattern of degreePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                for (const match of matches) {
                    education.push({
                        degree: match.trim(),
                        institution: 'University', // Would need more context to extract
                        year: ''
                    });
                }
            }
        }

        return education.slice(0, 3); // Return max 3 entries
    }

    /**
     * Check if PDF text is extractable (basic check)
     */
    checkTextExtractability(content: string): { extractable: boolean; quality: number; issues: string[] } {
        const issues: string[] = [];
        let quality = 100;

        if (!content || content.length === 0) {
            return { extractable: false, quality: 0, issues: ['No text content found'] };
        }

        // Check for garbled text (common in image-based PDFs)
        const garbledRatio = (content.match(/[^\x20-\x7E\n\r]/g) || []).length / content.length;
        if (garbledRatio > 0.1) {
            issues.push('High ratio of non-standard characters detected');
            quality -= 30;
        }

        // Check for reasonable word structure
        const words = content.split(/\s+/);
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        if (avgWordLength < 2 || avgWordLength > 15) {
            issues.push('Word structure appears abnormal');
            quality -= 20;
        }

        // Check for sentence structure
        const sentences = content.split(/[.!?]+/);
        if (sentences.length < 5) {
            issues.push('Limited sentence structure detected');
            quality -= 10;
        }

        return {
            extractable: quality > 50,
            quality: Math.max(0, quality),
            issues
        };
    }
}

export const atsAnalyzerService = new ATSAnalyzerService();
