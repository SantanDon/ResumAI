import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export interface CVContent {
    summary: string;
    skills: string[];
    experience: string[];
    education: string[];
    candidateName?: string;
    contact?: {
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
    };
}

class PDFGeneratorService {
    /**
     * Generate a high-fidelity CV PDF using Puppeteer for Analytics-Optimized Styling
     */
    async generateTailoredCVPDF(originalPdfPath: string, tailoredContent: CVContent): Promise<string> {
        return this.generateFromHTML(tailoredContent);
    }

    /**
     * Generate a simple CV PDF from scratch
     */
    async generateSimpleCVPDF(content: CVContent, candidateName: string = 'Candidate'): Promise<string> {
        return this.generateFromHTML({ ...content, candidateName });
    }

    private async generateFromHTML(content: CVContent): Promise<string> {
        try {
            const downloadsDir = path.join(__dirname, '../../downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }

            const html = this.getHTMLTemplate(content);
            const timestamp = Date.now();
            const filename = `cv_${timestamp}.pdf`;
            const filepath = path.join(downloadsDir, filename);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            await page.pdf({
                path: filepath,
                format: 'A4',
                margin: {
                    top: '50px',
                    right: '50px',
                    bottom: '50px',
                    left: '50px'
                },
                printBackground: true,
                displayHeaderFooter: false
            });

            await browser.close();
            console.log(`[PDFGenerator] Created Analytics-Optimized CV at: ${filepath}`);
            return filepath;
        } catch (error) {
            console.error('[PDFGenerator] Puppeteer Error:', error);
            throw error;
        }
    }

    private getHTMLTemplate(content: CVContent): string {
        const name = content.candidateName || 'Applicant Name';
        const contactInfo = content.contact || {};
        const email = contactInfo.email || 'user@example.com';
        const phone = contactInfo.phone || '+1 555 123 4567';
        const location = contactInfo.location || 'City, Country';
        const portfolioUrl = 'https://example-portfolio.vercel.app/';
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.45;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            font-size: 10.5pt;
        }
        .container {
            width: 100%;
            max-width: 820px;
            margin: 0 auto;
        }
        header {
            text-align: center;
            margin-bottom: 20px;
        }
        h1 {
            font-family: 'Georgia', Times, serif;
            font-size: 26pt;
            margin: 0 0 4px 0;
            font-weight: 700;
            color: #000;
        }
        .contact {
            font-size: 9.5pt;
            color: #222;
            margin-top: 4px;
            font-weight: 500;
        }
        .contact a {
            color: #0056b3;
            text-decoration: none;
        }
        .portfolio {
            font-size: 10pt;
            margin-top: 4px;
        }
        .portfolio a {
            color: #0056b3;
            text-decoration: underline;
            font-weight: 500;
        }
        .section-title {
            font-family: 'Georgia', Times, serif;
            font-size: 11pt;
            font-weight: bold;
            color: #000;
            border-bottom: 1.5pt solid #000;
            margin-top: 18px;
            margin-bottom: 8px;
            padding-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary {
            margin-bottom: 14px;
            text-align: justify;
            font-size: 10pt;
        }
        .skills-container {
            font-size: 10pt;
            line-height: 1.5;
            margin-bottom: 14px;
        }
        .experience-item, .education-item {
            margin-bottom: 14px;
        }
        .item-company-line {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-weight: bold;
            font-size: 10.5pt;
        }
        .item-role-line {
            font-style: italic;
            color: #333;
            font-size: 9.5pt;
            margin-top: 1px;
            margin-bottom: 4px;
        }
        .item-edu-school {
            font-weight: bold;
            font-size: 10.5pt;
        }
        .item-edu-date {
            font-style: italic;
            font-size: 9.5pt;
            color: #444;
            margin-top: 1px;
        }
        .item-edu-degree {
            font-style: italic;
            font-size: 9.5pt;
            color: #1a1a1a;
            margin-top: 1px;
        }
        ul {
            margin: 4px 0 0 16px;
            padding: 0;
        }
        li {
            margin-bottom: 4px;
            font-size: 9.8pt;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${name}</h1>
            <div class="contact">
                <span>${location}</span> | <span>${phone}</span> | <a href="mailto:${email}">${email}</a>
            </div>
            <div class="portfolio">
                <a href="${portfolioUrl}" target="_blank">My website portfolio</a>
            </div>
        </header>

        <section>
            <div class="section-title">Summary</div>
            <div class="summary">${content.summary}</div>
        </section>

        <section>
            <div class="section-title">Education</div>
            ${content.education.map(edu => `
                <div class="education-item">
                    ${this.formatEducation(edu)}
                </div>
            `).join('')}
        </section>

        <section>
            <div class="section-title">Professional Experience</div>
            ${content.experience.map(exp => `
                <div class="experience-item">
                    ${this.formatExperience(exp)}
                </div>
            `).join('')}
        </section>

        <section>
            <div class="section-title">Skills</div>
            <div class="skills-container">
                ${Array.isArray(content.skills) ? content.skills.join(', ') : content.skills}
            </div>
        </section>
    </div>
</body>
</html>
        `;
    }

    private formatExperience(exp: string): string {
        const lines = exp.split('\n');
        const headerLine = lines[0] || 'Experience';
        const bullets = lines.slice(1);

        let company = 'Company';
        let role = 'Role';
        let period = '';

        // Try to parse: "Role at Company | Period"
        if (headerLine.includes('|')) {
            const parts = headerLine.split('|');
            period = (parts[1] || '').trim();
            
            const roleAndCompany = (parts[0] || '').trim();
            if (roleAndCompany.includes(' at ')) {
                const rcParts = roleAndCompany.split(' at ');
                role = (rcParts[0] || '').trim();
                company = (rcParts[1] || '').trim();
            } else {
                company = roleAndCompany;
            }
        } else if (headerLine.includes(' at ')) {
            const rcParts = headerLine.split(' at ');
            role = (rcParts[0] || '').trim();
            company = (rcParts[1] || '').trim();
        } else {
            company = headerLine;
        }

        return `
            <div class="item-company-line">
                <span>${company}</span>
                <span style="font-weight: normal; font-size: 10pt;">${period}</span>
            </div>
            <div class="item-role-line">${role}</div>
            <ul>
                ${bullets.length > 0 ? bullets.map(l => {
                    const cleanL = l.trim().replace(/^-\s*/, '');
                    if (!cleanL) return '';
                    return `<li>${cleanL}</li>`;
                }).join('') : `<li>${exp}</li>`}
            </ul>
        `;
    }

    private formatEducation(edu: string): string {
        let degree = 'Degree';
        let school = 'School';
        let period = '';

        if (edu.includes(' - ')) {
            const parts = edu.split(' - ');
            degree = (parts[0] || '').trim();
            const rest = (parts[1] || '').trim();
            
            if (rest.includes('(') && rest.includes(')')) {
                const openIdx = rest.indexOf('(');
                const closeIdx = rest.indexOf(')');
                school = rest.substring(0, openIdx).trim();
                period = rest.substring(openIdx + 1, closeIdx).trim();
            } else {
                school = rest;
            }
        } else {
            school = edu;
        }

        return `
            <div class="item-edu-school">${school}</div>
            <div class="item-edu-date">${period}</div>
            <div class="item-edu-degree">${degree}</div>
        `;
    }
}

export const pdfGeneratorService = new PDFGeneratorService();
export default pdfGeneratorService;
