/**
 * Executive Premium Template
 * Sophisticated, leadership-focused design
 * ATS Score: 94/100
 */

import { JSONResume } from '../../types/jsonResume';

export const EXECUTIVE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@400;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #1f1f1f;
  background: white;
}

.cv-container {
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.5in;
}

/* Header Section */
.header {
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 2px solid #2c3e50;
}

.name {
  font-family: 'Playfair Display', serif;
  font-size: 26pt;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
  color: #1f1f1f;
}

.contact-info {
  font-size: 9.5pt;
  color: #555;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.contact-info span {
  display: inline;
}

.contact-info span:not(:last-child)::after {
  content: '•';
  margin-left: 12px;
  color: #999;
}

.contact-info a {
  color: #1f1f1f;
  text-decoration: none;
}

/* Section Styling */
.section {
  margin-bottom: 12px;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 12pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #2c3e50;
  border-bottom: 1px solid #2c3e50;
  padding-bottom: 4px;
  margin-bottom: 8px;
}

/* Summary Section */
.summary {
  font-size: 10.5pt;
  color: #333;
  line-height: 1.6;
}

/* Experience Section */
.experience-item {
  margin-bottom: 10px;
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.experience-title {
  font-weight: 700;
  font-size: 11pt;
  color: #1f1f1f;
}

.experience-company {
  font-weight: 600;
  color: #555;
  margin-left: 4px;
}

.experience-dates {
  font-size: 10pt;
  color: #777;
  white-space: nowrap;
}

.highlights {
  margin-top: 3px;
  padding-left: 18px;
}

.highlights li {
  margin-bottom: 2px;
  font-size: 10.5pt;
  color: #333;
  line-height: 1.4;
}

.highlights li::marker {
  color: #999;
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
  font-weight: 700;
  font-size: 11pt;
}

.education-school {
  font-weight: 600;
  color: #555;
  margin-left: 4px;
}

.education-dates {
  font-size: 10pt;
  color: #777;
}

.education-details {
  font-size: 10pt;
  color: #777;
  margin-top: 2px;
}

/* Skills Section */
.skill-category {
  margin-bottom: 4px;
}

.skill-category-name {
  font-weight: 700;
  font-size: 10.5pt;
  color: #1f1f1f;
  display: inline;
}

.skill-keywords {
  font-size: 10.5pt;
  color: #555;
  display: inline;
}

/* Projects Section */
.project-item {
  margin-bottom: 8px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.project-name {
  font-weight: 700;
  font-size: 11pt;
}

.project-link {
  font-size: 10pt;
  color: #1f1f1f;
}

.project-description {
  font-size: 10.5pt;
  color: #555;
  margin-top: 2px;
}

/* Certificates Section */
.certificate-item {
  margin-bottom: 3px;
  font-size: 10.5pt;
}

.certificate-name {
  font-weight: 600;
}

.certificate-issuer {
  color: #777;
}

/* Languages Section */
.languages-list {
  font-size: 10.5pt;
  color: #555;
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

export function renderExecutiveTemplate(cv: JSONResume): string {
  const { basics } = cv;
  const contactParts: string[] = [];

  if (basics.email) {
    contactParts.push(`<a href="mailto:${basics.email}">${basics.email}</a>`);
  }
  if (basics.phone) {
    contactParts.push(basics.phone);
  }
  if (basics.location?.city) {
    const location = [basics.location.city, basics.location.region].filter(Boolean).join(', ');
    contactParts.push(location);
  }
  if (basics.url) {
    contactParts.push(`<a href="${basics.url}" target="_blank">${basics.url.replace(/^https?:\/\//, '')}</a>`);
  }

  let html = `
    <header class="header">
      <h1 class="name">${basics.name}</h1>
      <div class="contact-info">
        ${contactParts.map(part => `<span>${part}</span>`).join('')}
      </div>
    </header>`;

  if (basics.summary) {
    html += `
    <section class="section">
      <h2 class="section-title">Executive Summary</h2>
      <p class="summary">${basics.summary}</p>
    </section>`;
  }

  if (cv.work && cv.work.length > 0) {
    html += `
    <section class="section">
      <h2 class="section-title">Professional Experience</h2>`;
    
    for (const job of cv.work) {
      html += `
      <div class="experience-item">
        <div class="experience-header">
          <div>
            <span class="experience-title">${job.position}</span>
            <span class="experience-company">${job.name}</span>
          </div>
          <span class="experience-dates">${job.startDate} – ${job.endDate || 'Present'}</span>
        </div>`;
        
        if (job.highlights && job.highlights.length > 0) {
          html += `<ul class="highlights">`;
          for (const highlight of job.highlights) {
            html += `<li>${highlight}</li>`;
          }
          html += `</ul>`;
        }
        
        html += `</div>`;
    }
    
    html += `</section>`;
  }

  if (cv.education && cv.education.length > 0) {
    html += `
    <section class="section">
      <h2 class="section-title">Education</h2>`;
    
    for (const edu of cv.education) {
      const degree = [edu.studyType, edu.area].filter(Boolean).join(' in ');
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
      
      html += `
      <div class="education-item">
        <div class="education-header">
          <div>
            <span class="education-degree">${degree || 'Degree'}</span>
            <span class="education-school">${edu.institution}</span>
          </div>
          ${dates ? `<span class="education-dates">${dates}</span>` : ''}
        </div>
        ${edu.score ? `<div class="education-details">GPA: ${edu.score}</div>` : ''}
      </div>`;
    }
    
    html += `</section>`;
  }

  if (cv.skills && cv.skills.length > 0) {
    html += `
    <section class="section">
      <h2 class="section-title">Core Competencies</h2>`;
    
    for (const skill of cv.skills) {
      const keywords = skill.keywords?.join(', ') || '';
      html += `
      <div class="skill-category">
        <span class="skill-category-name">${skill.name}:</span>
        <span class="skill-keywords"> ${keywords}</span>
      </div>`;
    }
    
    html += `</section>`;
  }

  if (cv.projects && cv.projects.length > 0) {
    html += `
    <section class="section">
      <h2 class="section-title">Key Projects</h2>`;
    
    for (const project of cv.projects) {
      html += `
      <div class="project-item">
        <div class="project-header">
          <span class="project-name">${project.name}</span>
          ${project.url ? `<a class="project-link" href="${project.url}" target="_blank">View</a>` : ''}
        </div>
        ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
      </div>`;
    }
    
    html += `</section>`;
  }

  if (cv.certificates && cv.certificates.length > 0) {
    html += `
    <section class="section">
      <h2 class="section-title">Certifications</h2>`;
    
    for (const cert of cv.certificates) {
      html += `
      <div class="certificate-item">
        <span class="certificate-name">${cert.name}</span>
        ${cert.issuer ? `<span class="certificate-issuer"> – ${cert.issuer}</span>` : ''}
        ${cert.date ? `<span class="certificate-date"> (${cert.date})</span>` : ''}
      </div>`;
    }
    
    html += `</section>`;
  }

  if (cv.languages && cv.languages.length > 0) {
    const items = cv.languages.map(lang => 
      `${lang.language}${lang.fluency ? ` (${lang.fluency})` : ''}`
    ).join(', ');
    
    html += `
    <section class="section">
      <h2 class="section-title">Languages</h2>
      <p class="languages-list">${items}</p>
    </section>`;
  }

  return html;
}
