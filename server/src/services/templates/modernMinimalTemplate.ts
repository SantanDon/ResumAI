/**
 * Modern Minimal Template
 * Clean, contemporary design with subtle accents
 * ATS Score: 92/100
 */

import { JSONResume } from '../../types/jsonResume';

export const MODERN_MINIMAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: #2c3e50;
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
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.name {
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
  color: #1a1a1a;
}

.contact-info {
  font-size: 9pt;
  color: #555;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 10px;
}

.contact-info span {
  display: inline;
}

.contact-info span:not(:last-child)::after {
  content: '•';
  margin-left: 10px;
  color: #bbb;
}

.contact-info a {
  color: #2563eb;
  text-decoration: none;
}

/* Section Styling */
.section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #1a1a1a;
  border-left: 3px solid #2563eb;
  padding-left: 8px;
  margin-bottom: 6px;
}

/* Summary Section */
.summary {
  font-size: 9.5pt;
  color: #444;
  line-height: 1.5;
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
  font-weight: 600;
  font-size: 10pt;
  color: #1a1a1a;
}

.experience-company {
  font-weight: 500;
  color: #555;
  margin-left: 4px;
}

.experience-dates {
  font-size: 9pt;
  color: #888;
  white-space: nowrap;
}

.highlights {
  margin-top: 3px;
  padding-left: 16px;
}

.highlights li {
  margin-bottom: 2px;
  font-size: 9.5pt;
  color: #444;
  line-height: 1.4;
}

.highlights li::marker {
  color: #bbb;
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
  color: #555;
  margin-left: 4px;
}

.education-dates {
  font-size: 9pt;
  color: #888;
}

.education-details {
  font-size: 9pt;
  color: #888;
  margin-top: 2px;
}

/* Skills Section */
.skill-category {
  margin-bottom: 4px;
}

.skill-category-name {
  font-weight: 600;
  font-size: 9.5pt;
  color: #1a1a1a;
  display: inline;
}

.skill-keywords {
  font-size: 9.5pt;
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
  font-weight: 600;
  font-size: 10pt;
}

.project-link {
  font-size: 9pt;
  color: #2563eb;
}

.project-description {
  font-size: 9.5pt;
  color: #555;
  margin-top: 2px;
}

/* Certificates Section */
.certificate-item {
  margin-bottom: 3px;
  font-size: 9.5pt;
}

.certificate-name {
  font-weight: 500;
}

.certificate-issuer {
  color: #888;
}

/* Languages Section */
.languages-list {
  font-size: 9.5pt;
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

export function renderModernMinimalTemplate(cv: JSONResume): string {
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
      <h2 class="section-title">Summary</h2>
      <p class="summary">${basics.summary}</p>
    </section>`;
  }

  if (cv.work && cv.work.length > 0) {
    html += `
    <section class="section">
      <h2 class="section-title">Experience</h2>`;
    
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
      <h2 class="section-title">Skills</h2>`;
    
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
      <h2 class="section-title">Projects</h2>`;
    
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
