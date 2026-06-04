/**
 * Harvard Professional Template
 * Classic, ATS-optimized professional template
 * ATS Score: 95/100
 */

import { JSONResume } from '../../types/jsonResume';

export const HARVARD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Open+Sans:wght@400;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
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
  margin-bottom: 12px;
  border-bottom: 2px solid #000;
  padding-bottom: 8px;
}

.name {
  font-family: 'Lora', serif;
  font-size: 24pt;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  color: #000;
}

.contact-info {
  font-size: 10pt;
  color: #333;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.contact-info span {
  display: inline;
}

.contact-info span:not(:last-child)::after {
  content: '•';
  margin-left: 12px;
  color: #666;
}

.contact-info a {
  color: #000;
  text-decoration: none;
}

/* Section Styling */
.section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 11pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #000;
  border-bottom: 1px solid #000;
  padding-bottom: 2px;
  margin-bottom: 6px;
}

/* Summary Section */
.summary {
  font-size: 10.5pt;
  color: #333;
  text-align: justify;
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
  font-weight: 700;
  font-size: 11pt;
  color: #000;
}

.experience-company {
  font-weight: 600;
  color: #333;
  margin-left: 4px;
}

.experience-dates {
  font-size: 10pt;
  color: #555;
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
  color: #666;
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
  color: #333;
  margin-left: 4px;
}

.education-dates {
  font-size: 10pt;
  color: #555;
}

.education-details {
  font-size: 10pt;
  color: #555;
  margin-top: 2px;
}

/* Skills Section */
.skill-category {
  margin-bottom: 4px;
}

.skill-category-name {
  font-weight: 700;
  font-size: 10.5pt;
  color: #000;
  display: inline;
}

.skill-keywords {
  font-size: 10.5pt;
  color: #333;
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
  color: #000;
}

.project-description {
  font-size: 10.5pt;
  color: #333;
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
  color: #555;
}

/* Languages Section */
.languages-list {
  font-size: 10.5pt;
  color: #333;
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

export function renderHarvardTemplate(cv: JSONResume): string {
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
      <h2 class="section-title">Professional Summary</h2>
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
