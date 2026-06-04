/**
 * Property-Based Test: Template Rendering Completeness
 * Task 1.3: Validates that template rendering includes all non-empty sections without placeholder text
 * 
 * Property: For any valid JSON Resume with non-empty sections, rendering to HTML SHALL include 
 * all non-empty sections in the correct order without placeholder text.
 * 
 * Validates: Requirements 1.1, 1.2, 1.5
 */

import fc from 'fast-check';
import { templateRenderer } from '../services/templateRenderer';
import { JSONResume } from '../types/jsonResume';

// Arbitraries for generating test data
const arbName = fc.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
const arbEmail = fc.emailAddress();
const arbPhone = fc.stringMatching(/^\+?1?\d{9,15}$/);
const arbCity = fc.stringMatching(/^[A-Z][a-z]+$/);
const arbRegion = fc.stringMatching(/^[A-Z]{2}$/);
const arbUrl = fc.webUrl();
const arbDate = fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/);
const arbText = fc.stringMinLength(fc.string(), 10);
const arbJobTitle = fc.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
const arbCompanyName = fc.stringMatching(/^[A-Z][a-z]+ (Inc|LLC|Corp|Ltd)$/);

// Generator for JSON Resume
const arbJSONResume = fc.record({
  basics: fc.record({
    name: arbName,
    email: arbEmail,
    phone: arbPhone,
    location: fc.record({
      city: arbCity,
      region: arbRegion
    }),
    url: arbUrl,
    summary: arbText,
    profiles: fc.array(fc.record({
      network: fc.stringMatching(/^(LinkedIn|GitHub|Twitter)$/),
      url: arbUrl
    }), { maxLength: 3 })
  }),
  work: fc.array(fc.record({
    name: arbCompanyName,
    position: arbJobTitle,
    startDate: arbDate,
    endDate: arbDate,
    highlights: fc.array(arbText, { minLength: 1, maxLength: 5 })
  }), { minLength: 1, maxLength: 3 }),
  education: fc.array(fc.record({
    institution: arbCompanyName,
    studyType: fc.stringMatching(/^(Bachelor|Master|PhD)$/),
    area: fc.stringMatching(/^(Computer Science|Engineering|Business)$/),
    startDate: arbDate,
    endDate: arbDate,
    score: fc.stringMatching(/^\d\.\d{1,2}$/)
  }), { minLength: 1, maxLength: 2 }),
  skills: fc.array(fc.record({
    name: fc.stringMatching(/^(Technical|Leadership|Communication)$/),
    keywords: fc.array(fc.stringMatching(/^[A-Za-z]+$/), { minLength: 2, maxLength: 5 })
  }), { minLength: 1, maxLength: 3 }),
  projects: fc.array(fc.record({
    name: fc.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+$/),
    description: arbText,
    url: arbUrl
  }), { maxLength: 2 }),
  certificates: fc.array(fc.record({
    name: fc.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+$/),
    issuer: arbCompanyName,
    date: arbDate
  }), { maxLength: 2 }),
  languages: fc.array(fc.record({
    language: fc.stringMatching(/^(English|Spanish|French|German)$/),
    fluency: fc.stringMatching(/^(Native|Fluent|Intermediate|Basic)$/)
  }), { maxLength: 3 })
} as any);

describe('Property-Based Test: Template Rendering Completeness', () => {
  it('should render all non-empty sections without placeholder text (100+ iterations)', () => {
    fc.assert(
      fc.property(arbJSONResume, (cv: JSONResume) => {
        // Render to HTML
        const html = templateRenderer.renderToHTML(cv);

        // Property 1: HTML should contain the person's name
        if (cv.basics.name) {
          expect(html).toContain(cv.basics.name);
        }

        // Property 2: No placeholder text like "Course_Title" should appear
        expect(html).not.toMatch(/Course_Title/);
        expect(html).not.toMatch(/\[.*\]/); // No bracket placeholders
        expect(html).not.toMatch(/undefined/i);
        expect(html).not.toMatch(/null/i);

        // Property 3: If work section exists, it should be rendered
        if (cv.work && cv.work.length > 0) {
          expect(html).toContain('Professional Experience');
          for (const job of cv.work) {
            expect(html).toContain(job.position);
            expect(html).toContain(job.name);
          }
        }

        // Property 4: If education section exists, it should be rendered
        if (cv.education && cv.education.length > 0) {
          expect(html).toContain('Education');
          for (const edu of cv.education) {
            expect(html).toContain(edu.institution);
          }
        }

        // Property 5: If skills section exists, it should be rendered
        if (cv.skills && cv.skills.length > 0) {
          expect(html).toContain('Skills');
          for (const skill of cv.skills) {
            expect(html).toContain(skill.name);
          }
        }

        // Property 6: If projects section exists, it should be rendered
        if (cv.projects && cv.projects.length > 0) {
          expect(html).toContain('Projects');
          for (const project of cv.projects) {
            expect(html).toContain(project.name);
          }
        }

        // Property 7: If certificates section exists, it should be rendered
        if (cv.certificates && cv.certificates.length > 0) {
          expect(html).toContain('Certifications');
          for (const cert of cv.certificates) {
            expect(html).toContain(cert.name);
          }
        }

        // Property 8: If languages section exists, it should be rendered
        if (cv.languages && cv.languages.length > 0) {
          expect(html).toContain('Languages');
          for (const lang of cv.languages) {
            expect(html).toContain(lang.language);
          }
        }

        // Property 9: HTML should be valid (contain opening and closing tags)
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('</html>');
        expect(html).toContain('<body>');
        expect(html).toContain('</body>');

        // Property 10: No empty section headers should appear
        expect(html).not.toMatch(/<h2 class="section-title"><\/h2>/);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases: minimal CV with only required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          basics: fc.record({
            name: arbName,
            email: arbEmail,
            phone: arbPhone,
            location: fc.record({
              city: arbCity,
              region: arbRegion
            }),
            url: arbUrl,
            summary: fc.constant(''),
            profiles: fc.constant([])
          }),
          work: fc.constant([]),
          education: fc.constant([]),
          skills: fc.constant([]),
          projects: fc.constant([]),
          certificates: fc.constant([]),
          languages: fc.constant([])
        } as any),
        (cv: JSONResume) => {
          const html = templateRenderer.renderToHTML(cv);

          // Should still render header with name
          expect(html).toContain(cv.basics.name);

          // Should not render empty sections
          expect(html).not.toContain('<h2 class="section-title">Professional Experience</h2>');
          expect(html).not.toContain('<h2 class="section-title">Education</h2>');
          expect(html).not.toContain('<h2 class="section-title">Skills</h2>');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve all text content without truncation', () => {
    fc.assert(
      fc.property(
        fc.record({
          basics: fc.record({
            name: fc.string({ minLength: 5, maxLength: 100 }),
            email: arbEmail,
            phone: arbPhone,
            location: fc.record({
              city: fc.string({ minLength: 3, maxLength: 50 }),
              region: arbRegion
            }),
            url: arbUrl,
            summary: fc.string({ minLength: 20, maxLength: 500 }),
            profiles: fc.constant([])
          }),
          work: fc.array(fc.record({
            name: fc.string({ minLength: 5, maxLength: 100 }),
            position: fc.string({ minLength: 5, maxLength: 100 }),
            startDate: arbDate,
            endDate: arbDate,
            highlights: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
          }), { minLength: 1, maxLength: 2 }),
          education: fc.constant([]),
          skills: fc.constant([]),
          projects: fc.constant([]),
          certificates: fc.constant([]),
          languages: fc.constant([])
        } as any),
        (cv: JSONResume) => {
          const html = templateRenderer.renderToHTML(cv);

          // All text should be preserved
          expect(html).toContain(cv.basics.name);
          expect(html).toContain(cv.basics.summary);

          for (const job of cv.work) {
            expect(html).toContain(job.name);
            expect(html).toContain(job.position);
            for (const highlight of job.highlights) {
              expect(html).toContain(highlight);
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
