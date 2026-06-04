/**
 * Creative Bold Template
 * Design-forward, visual template for creative professionals
 * ATS Score: 85/100
 */

import { JSONResume } from '../../types/jsonResume';

export const CREATIVE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Roboto:wght@400;500;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid #ff6b6b;
}

.name {
  font-family: 'Poppins', sans-serif;
  font-size: 24pt;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
  color: #ff6b6b;
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
  color: #ddd;
}

.contact-info a {
  color: #ff6b6b;
  text-decoration: none;
}

/* Section Styling */
.section {
  margin-bottom: 12px;
}

.section-title {
  font-family: 'Poppins', sans-serif;
  font-size: 11pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #ff6b6b;
  border-left: 4px solid #ff6b6b;
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
  padding-left: 8px;
  border-left: 2px solid #ff6b6b;
  padding-bottom: 8px;
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.experience-title {
  font-weight: 700;
  font-size: 10pt;
  color: #1a1a1a;
}

.experience-company {
  font-weight: 600;
  color: #ff6b6b;
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
  color: #ff6b6b;
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
  font-size: 10pt;
}

.education-school {
  font-weight: 600;
  color: #ff6b6b;
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
  font-weight: 700;
  font-size: 9.5pt;
  color: #ff6b6b;
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
  padding: 6px;
  background: #f8f9fa;
  border-radius: 4px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.project-name {
  font-weight: 700;
  font-size: 10pt;
  color: #ff6b6b;
}

.project-link {
  font-size: 9pt;
  color: #ff6b6b;
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
  font-weight: 600;
  color: #1a1a1a;
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

export function renderCreativeTemplate(cv: JSONResume): string {
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
      <h2 class="section-title">About</h2>
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
