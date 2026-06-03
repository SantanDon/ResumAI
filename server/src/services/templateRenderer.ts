/**
 * Template Renderer Service
 * Renders JSON Resume to HTML and PDF using Gold Standard template
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { JSONResume, TemplateTheme } from '../types/jsonResume';

// Gold Standard Template CSS
const GOLD_STANDARD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 10pt;
  line-height: 1.4;
  color: #1a1a1a;
  background: white;
}

.cv-container {
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.5in;
}

/* Header Section */
.header {
  text-align: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
}

.name {
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  color: #111827;
}

.contact-info {
  font-size: 9pt;
  color: #4b5563;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-info span {
  display: inline-flex;
  align-items: center;
}

.contact-info span:not(:last-child)::after {
  content: '•';
  margin-left: 8px;
  color: #9ca3af;
}

.contact-info a {
  color: #2563eb;
  text-decoration: none;
}

/* Section Styling */
.section {
  margin-bottom: 14px;
}

.section-title {
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #111827;
  border-bottom: 1.5px solid #111827;
  padding-bottom: 3px;
  margin-bottom: 8px;
}

/* Summary Section */
.summary {
  font-size: 9.5pt;
  color: #374151;
  text-align: justify;
  line-height: 1.5;
}

/* Experience Section */
.experience-item {
  margin-bottom: 12px;
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.experience-title {
  font-weight: 600;
  font-size: 10pt;
  color: #111827;
}

.experience-company {
  font-weight: 500;
  color: #374151;
}

.experience-dates {
  font-size: 9pt;
  color: #6b7280;
  white-space: nowrap;
}

.experience-location {
  font-size: 9pt;
  color: #6b7280;
  font-style: italic;
}

.highlights {
  margin-top: 4px;
  padding-left: 16px;
}

.highlights li {
  margin-bottom: 3px;
  font-size: 9.5pt;
  color: #374151;
  line-height: 1.4;
}

.highlights li::marker {
  color: #9ca3af;
}

/* Education Section */
.education-item {
  margin-bottom: 8px;
}

.education-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.education-degree {
  font-weight: 600;
  font-size: 10pt;
}

.education-school {
  font-weight: 500;
  color: #374151;
}

.education-dates {
  font-size: 9pt;
  color: #6b7280;
}

.education-details {
  font-size: 9pt;
  color: #6b7280;
  margin-top: 2px;
}

/* Skills Section */
.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-category {
  margin-bottom: 6px;
}

.skill-category-name {
  font-weight: 600;
  font-size: 9.5pt;
  color: #374151;
  display: inline;
}

.skill-keywords {
  font-size: 9.5pt;
  color: #4b5563;
  display: inline;
}

/* Projects Section */
.project-item {
  margin-bottom: 10px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.project-name {
  font-weight: 600;
  font-size: 10pt;
}

.project-link {
  font-size: 9pt;
  color: #2563eb;
}

.project-description {
  font-size: 9.5pt;
  color: #374151;
  margin-top: 2px;
}

/* Certificates Section */
.certificate-item {
  margin-bottom: 4px;
  font-size: 9.5pt;
}

.certificate-name {
  font-weight: 500;
}

.certificate-issuer {
  color: #6b7280;
}

/* Languages Section */
.languages-list {
  font-size: 9.5pt;
  color: #374151;
}

/* Change Highlighting */
.changed {
  background-color: #fef3c7;
  padding: 1px 2px;
  border-radius: 2px;
}

/* Print Optimization */
@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .cv-container {
    padding: 0;
  }
  
  .section {
    page-break-inside: avoid;
  }
}
`;

// Template themes
const TEMPLATES: Record<string, TemplateTheme> = {
  'gold-standard': {
    id: 'gold-standard',
    name: 'Zachary Nelson Gold Standard',
    description: 'Minimalist, achievement-first, high-impact professional template',
    css: GOLD_STANDARD_CSS,
    layout: 'single-column',
    fontFamily: 'Inter, Arial, sans-serif'
  }
};

interface RenderOptions {
  templateId?: string;
  highlightChanges?: string[];
  showScore?: boolean;
  score?: number;
}

// Cache for compiled CSS to avoid recompilation
const cssCache = new Map<string, string>();

class TemplateRendererService {
  private htmlCache = new Map<string, string>();
  private cacheSize = 0;
  private maxCacheSize = 50; // Max number of cached renders
  /**
   * Render JSON Resume to HTML
   */
  renderToHTML(cv: JSONResume, options: RenderOptions = {}): string {
    // Generate cache key
    const cacheKey = this.generateCacheKey(cv, options);
    
    // Check cache
    if (this.htmlCache.has(cacheKey)) {
      return this.htmlCache.get(cacheKey)!;
    }

    const template = TEMPLATES[options.templateId || 'gold-standard'];
    const highlightPaths = new Set(options.highlightChanges || []);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cv.basics.name} - CV</title>
  <style>${template.css}</style>
</head>
<body>
  <div class="cv-container">
    ${this.renderHeader(cv, highlightPaths)}
    ${cv.basics.summary ? this.renderSummary(cv.basics.summary, highlightPaths) : ''}
    ${cv.work && cv.work.length > 0 ? this.renderExperience(cv.work, highlightPaths) : ''}
    ${cv.education && cv.education.length > 0 ? this.renderEducation(cv.education, highlightPaths) : ''}
    ${cv.skills && cv.skills.length > 0 ? this.renderSkills(cv.skills, highlightPaths) : ''}
    ${cv.projects && cv.projects.length > 0 ? this.renderProjects(cv.projects, highlightPaths) : ''}
    ${cv.certificates && cv.certificates.length > 0 ? this.renderCertificates(cv.certificates, highlightPaths) : ''}
    ${cv.languages && cv.languages.length > 0 ? this.renderLanguages(cv.languages, highlightPaths) : ''}
  </div>
</body>
</html>`;

    // Cache the result
    this.cacheHTML(cacheKey, html);

    return html;
  }

  /**
   * Generate cache key for HTML rendering
   */
  private generateCacheKey(cv: JSONResume, options: RenderOptions): string {
    // Simple hash based on CV name and template
    const templateId = options.templateId || 'gold-standard';
    const hasHighlights = (options.highlightChanges?.length || 0) > 0 ? '1' : '0';
    return `${cv.basics.name}:${templateId}:${hasHighlights}`;
  }

  /**
   * Cache HTML with LRU eviction
   */
  private cacheHTML(key: string, html: string): void {
    if (this.cacheSize >= this.maxCacheSize) {
      // Remove oldest entry (simple FIFO for now)
      const firstKey = this.htmlCache.keys().next().value;
      if (firstKey !== undefined) {
        this.htmlCache.delete(firstKey);
        this.cacheSize--;
      }
    }
    this.htmlCache.set(key, html);
    this.cacheSize++;
  }

  /**
   * Clear HTML cache
   */
  clearCache(): void {
    this.htmlCache.clear();
    this.cacheSize = 0;
  }

  /**
   * Render to PDF using Puppeteer
   */
  async renderToPDF(cv: JSONResume, options: RenderOptions = {}): Promise<Buffer> {
    const html = this.renderToHTML(cv, options);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        displayHeaderFooter: false
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Save PDF to file
   */
  async savePDF(cv: JSONResume, filename: string, options: RenderOptions = {}): Promise<string> {
    const pdfBuffer = await this.renderToPDF(cv, options);
    
    const downloadsDir = path.join(__dirname, '../../downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const filepath = path.join(downloadsDir, filename);
    fs.writeFileSync(filepath, pdfBuffer);
    
    return filepath;
  }

  /**
   * Generate PDF filename
   */
  generateFilename(cv: JSONResume): string {
    const name = cv.basics.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const date = new Date().toISOString().split('T')[0];
    return `${name}_${date}.pdf`;
  }

  /**
   * Get available templates
   */
  getTemplates(): TemplateTheme[] {
    return Object.values(TEMPLATES);
  }

  /**
   * Get default template
   */
  getDefaultTemplate(): TemplateTheme {
    return TEMPLATES['gold-standard'];
  }

  // ============================================
  // SECTION RENDERERS
  // ============================================

  private renderHeader(cv: JSONResume, highlights: Set<string>): string {
    const { basics } = cv;
    const contactParts: string[] = [];

    if (basics.email) {
      contactParts.push(`<span><a href="mailto:${basics.email}">${basics.email}</a></span>`);
    }
    if (basics.phone) {
      contactParts.push(`<span>${basics.phone}</span>`);
    }
    if (basics.location?.city) {
      const location = [basics.location.city, basics.location.region].filter(Boolean).join(', ');
      contactParts.push(`<span>${location}</span>`);
    }
    if (basics.url) {
      contactParts.push(`<span><a href="${basics.url}" target="_blank">${basics.url.replace(/^https?:\/\//, '')}</a></span>`);
    }
    if (basics.profiles) {
      for (const profile of basics.profiles) {
        if (profile.url) {
          contactParts.push(`<span><a href="${profile.url}" target="_blank">${profile.network}</a></span>`);
        }
      }
    }

    return `
    <header class="header">
      <h1 class="name${highlights.has('basics.name') ? ' changed' : ''}">${basics.name}</h1>
      <div class="contact-info">
        ${contactParts.join('\n        ')}
      </div>
    </header>`;
  }

  private renderSummary(summary: string, highlights: Set<string>): string {
    return `
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="summary${highlights.has('basics.summary') ? ' changed' : ''}">${summary}</p>
    </section>`;
  }

  private renderExperience(work: JSONResume['work'], highlights: Set<string>): string {
    if (!work || work.length === 0) return '';

    const items = work.map((job, i) => {
      const highlightsList = job.highlights?.map((h, j) => 
        `<li class="${highlights.has(`work[${i}].highlights[${j}]`) ? 'changed' : ''}">${h}</li>`
      ).join('\n          ') || '';

      return `
      <div class="experience-item">
        <div class="experience-header">
          <div>
            <span class="experience-title${highlights.has(`work[${i}].position`) ? ' changed' : ''}">${job.position}</span>
            <span class="experience-company"> | ${job.name}</span>
          </div>
          ${job.startDate || job.endDate ? `<span class="experience-dates">${[job.startDate, job.endDate].filter(Boolean).join(' - ') || 'Present'}</span>` : ''}
        </div>
        ${highlightsList ? `<ul class="highlights">${highlightsList}</ul>` : ''}
      </div>`;
    }).join('\n');

    return `
    <section class="section">
      <h2 class="section-title">Professional Experience</h2>
      ${items}
    </section>`;
  }

  private renderEducation(education: JSONResume['education'], highlights: Set<string>): string {
    if (!education || education.length === 0) return '';

    const items = education.map((edu, i) => {
      const degree = [edu.studyType, edu.area].filter(Boolean).join(' in ');
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      
      return `
      <div class="education-item">
        <div class="education-header">
          <div>
            <span class="education-degree">${degree || 'Degree'}</span>
            <span class="education-school"> | ${edu.institution}</span>
          </div>
          ${dates ? `<span class="education-dates">${dates}</span>` : ''}
        </div>
        ${edu.score ? `<div class="education-details">GPA: ${edu.score}</div>` : ''}
      </div>`;
    }).join('\n');

    return `
    <section class="section">
      <h2 class="section-title">Education</h2>
      ${items}
    </section>`;
  }

  private renderSkills(skills: JSONResume['skills'], highlights: Set<string>): string {
    if (!skills || skills.length === 0) return '';

    const items = skills.map(skill => {
      const keywords = skill.keywords?.join(', ') || '';
      return `
      <div class="skill-category">
        <span class="skill-category-name">${skill.name}:</span>
        <span class="skill-keywords"> ${keywords}</span>
      </div>`;
    }).join('\n');

    return `
    <section class="section">
      <h2 class="section-title">Skills</h2>
      ${items}
    </section>`;
  }

  private renderProjects(projects: JSONResume['projects'], highlights: Set<string>): string {
    if (!projects || projects.length === 0) return '';

    const items = projects.map(project => {
      return `
      <div class="project-item">
        <div class="project-header">
          <span class="project-name">${project.name}</span>
          ${project.url ? `<a class="project-link" href="${project.url}" target="_blank">View Project</a>` : ''}
        </div>
        ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
      </div>`;
    }).join('\n');

    return `
    <section class="section">
      <h2 class="section-title">Projects</h2>
      ${items}
    </section>`;
  }

  private renderCertificates(certificates: JSONResume['certificates'], highlights: Set<string>): string {
    if (!certificates || certificates.length === 0) return '';

    const items = certificates.map(cert => {
      return `
      <div class="certificate-item">
        <span class="certificate-name">${cert.name}</span>
        ${cert.issuer ? `<span class="certificate-issuer"> - ${cert.issuer}</span>` : ''}
        ${cert.date ? `<span class="certificate-date"> (${cert.date})</span>` : ''}
      </div>`;
    }).join('\n');

    return `
    <section class="section">
      <h2 class="section-title">Certifications</h2>
      ${items}
    </section>`;
  }

  private renderLanguages(languages: JSONResume['languages'], highlights: Set<string>): string {
    if (!languages || languages.length === 0) return '';

    const items = languages.map(lang => 
      `${lang.language}${lang.fluency ? ` (${lang.fluency})` : ''}`
    ).join(', ');

    return `
    <section class="section">
      <h2 class="section-title">Languages</h2>
      <p class="languages-list">${items}</p>
    </section>`;
  }

  /**
   * Export CV as plain text (ATS-friendly)
   */
  exportToText(cv: JSONResume): string {
    const lines: string[] = [];

    // Header
    lines.push(cv.basics.name.toUpperCase());
    lines.push('');
    
    const contactParts: string[] = [];
    if (cv.basics.email) contactParts.push(cv.basics.email);
    if (cv.basics.phone) contactParts.push(cv.basics.phone);
    if (cv.basics.location?.city) {
      contactParts.push([cv.basics.location.city, cv.basics.location.region].filter(Boolean).join(', '));
    }
    lines.push(contactParts.join(' | '));
    lines.push('');

    // Summary
    if (cv.basics.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push('-'.repeat(40));
      lines.push(cv.basics.summary);
      lines.push('');
    }

    // Experience
    if (cv.work && cv.work.length > 0) {
      lines.push('PROFESSIONAL EXPERIENCE');
      lines.push('-'.repeat(40));
      for (const job of cv.work) {
        lines.push(`${job.position} | ${job.name}`);
        if (job.startDate || job.endDate) {
          lines.push(`${[job.startDate, job.endDate].filter(Boolean).join(' - ') || 'Present'}`);
        }
        if (job.highlights) {
          for (const highlight of job.highlights) {
            lines.push(`• ${highlight}`);
          }
        }
        lines.push('');
      }
    }

    // Education
    if (cv.education && cv.education.length > 0) {
      lines.push('EDUCATION');
      lines.push('-'.repeat(40));
      for (const edu of cv.education) {
        const degree = [edu.studyType, edu.area].filter(Boolean).join(' in ');
        lines.push(`${degree || 'Degree'} | ${edu.institution}`);
        if (edu.startDate || edu.endDate) {
          lines.push([edu.startDate, edu.endDate].filter(Boolean).join(' - '));
        }
        if (edu.score) lines.push(`GPA: ${edu.score}`);
        lines.push('');
      }
    }

    // Skills
    if (cv.skills && cv.skills.length > 0) {
      lines.push('SKILLS');
      lines.push('-'.repeat(40));
      for (const skill of cv.skills) {
        const keywords = skill.keywords?.join(', ') || '';
        lines.push(`${skill.name}: ${keywords}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRendererService();
