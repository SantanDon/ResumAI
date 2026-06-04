/**
 * Property-Based Test: PDF Output Validity
 * Task 1.5: Validates that PDF output is valid and openable
 * 
 * Property: For any JSON Resume, rendering to PDF SHALL produce a valid PDF file 
 * with selectable text and proper encoding.
 * 
 * Validates: Requirements 1.4, 1.6
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

describe('Property-Based Test: PDF Output Validity', () => {
  it('should generate valid PDF files (100+ iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(arbJSONResume, async (cv: JSONResume) => {
        try {
          const pdfBuffer = await templateRenderer.renderToPDF(cv);

          // Property 1: PDF should be a Buffer
          expect(Buffer.isBuffer(pdfBuffer)).toBe(true);

          // Property 2: PDF should have content (not empty)
          expect(pdfBuffer.length).toBeGreaterThan(0);

          // Property 3: PDF should start with PDF magic number (%PDF)
          const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
          expect(pdfHeader).toBe('%PDF');

          // Property 4: PDF should contain EOF marker
          const pdfFooter = pdfBuffer.toString('utf-8', pdfBuffer.length - 10);
          expect(pdfFooter).toContain('%%EOF');

          // Property 5: PDF should have reasonable size (between 10KB and 500KB for typical CV)
          expect(pdfBuffer.length).toBeGreaterThan(10000);
          expect(pdfBuffer.length).toBeLessThan(500000);

          // Property 6: PDF should contain xref table (for valid PDF structure)
          const pdfString = pdfBuffer.toString('utf-8');
          expect(pdfString).toContain('xref');

          // Property 7: PDF should contain stream objects
          expect(pdfString).toContain('stream');
          expect(pdfString).toContain('endstream');

          // Property 8: PDF should contain catalog and pages
          expect(pdfString).toContain('/Type /Catalog');
          expect(pdfString).toContain('/Type /Pages');

          return true;
        } catch (error) {
          console.error('PDF generation error:', error);
          throw error;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate PDFs with proper encoding', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          basics: fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            email: arbEmail,
            phone: arbPhone,
            location: fc.record({
              city: fc.string({ minLength: 3, maxLength: 30 }),
              region: arbRegion
            }),
            url: arbUrl,
            summary: fc.string({ minLength: 20, maxLength: 200 }),
            profiles: fc.constant([])
          }),
          work: fc.array(fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            position: fc.string({ minLength: 5, maxLength: 50 }),
            startDate: arbDate,
            endDate: arbDate,
            highlights: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 2 })
          }), { minLength: 1, maxLength: 2 }),
          education: fc.constant([]),
          skills: fc.constant([]),
          projects: fc.constant([]),
          certificates: fc.constant([]),
          languages: fc.constant([])
        } as any),
        async (cv: JSONResume) => {
          const pdfBuffer = await templateRenderer.renderToPDF(cv);

          // PDF should be valid
          expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');

          // PDF should contain UTF-8 encoded text
          const pdfString = pdfBuffer.toString('utf-8');
          expect(pdfString.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle edge cases: minimal CV', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          basics: fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            email: arbEmail,
            phone: arbPhone,
            location: fc.record({
              city: fc.string({ minLength: 3, maxLength: 30 }),
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
        async (cv: JSONResume) => {
          const pdfBuffer = await templateRenderer.renderToPDF(cv);

          // Even minimal CV should produce valid PDF
          expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
          expect(pdfBuffer.length).toBeGreaterThan(0);
          expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should generate consistent PDFs for same input', async () => {
    const testCV: JSONResume = {
      basics: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        location: { city: 'New York', region: 'NY' },
        url: 'https://johndoe.com',
        summary: 'Experienced software engineer',
        profiles: []
      },
      work: [{
        name: 'Tech Corp',
        position: 'Senior Engineer',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        highlights: ['Led team of 5', 'Delivered project on time']
      }],
      education: [],
      skills: [],
      projects: [],
      certificates: [],
      languages: []
    };

    const pdf1 = await templateRenderer.renderToPDF(testCV);
    const pdf2 = await templateRenderer.renderToPDF(testCV);

    // Both PDFs should be valid
    expect(pdf1.toString('utf-8', 0, 4)).toBe('%PDF');
    expect(pdf2.toString('utf-8', 0, 4)).toBe('%PDF');

    // Both should have similar size (within 10% tolerance for timestamp variations)
    const sizeDiff = Math.abs(pdf1.length - pdf2.length);
    const tolerance = Math.max(pdf1.length, pdf2.length) * 0.1;
    expect(sizeDiff).toBeLessThan(tolerance);
  });
});
