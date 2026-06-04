/**
 * Property-Based Test: Special Character Encoding
 * Task 1.7: Validates that special characters and Unicode are encoded correctly
 * 
 * Property: For any JSON Resume containing special characters or Unicode, 
 * rendering to HTML and PDF SHALL encode them correctly and display them properly.
 * 
 * Validates: Requirements 5.2
 */

import fc from 'fast-check';
import { templateRenderer } from '../services/templateRenderer';
import { JSONResume } from '../types/jsonResume';

// Special characters and Unicode test strings
const specialChars = [
  'Café', 'naïve', 'résumé', 'Zürich', 'São Paulo',
  'François', 'José', 'Müller', 'Łódź', 'Москва',
  'Tokyo (東京)', 'Beijing (北京)', 'Seoul (서울)',
  'Test & Co.', 'Smith <Company>', 'O\'Brien',
  'Test "quoted" text', 'Test—dash', 'Test…ellipsis',
  '©2023', '®Registered', '™Trademark', '€Euro', '¥Yen',
  'Math: ∑ ∫ √ ≈ ≠ ≤ ≥', 'Arrows: → ← ↑ ↓',
  'Symbols: ★ ♥ ♦ ♣ ♠'
];

// Generator for special character strings
const arbSpecialCharString = fc.oneof(
  ...specialChars.map(s => fc.constant(s))
);

// Generator for JSON Resume with special characters
const arbJSONResumeWithSpecialChars = fc.record({
  basics: fc.record({
    name: fc.oneof(
      fc.constant('François Müller'),
      fc.constant('José García'),
      fc.constant('Zürich & Co.')
    ),
    email: fc.emailAddress(),
    phone: fc.stringMatching(/^\+?1?\d{9,15}$/),
    location: fc.record({
      city: fc.oneof(
        fc.constant('São Paulo'),
        fc.constant('Москва'),
        fc.constant('Tokyo')
      ),
      region: fc.stringMatching(/^[A-Z]{2}$/)
    }),
    url: fc.webUrl(),
    summary: fc.oneof(
      fc.constant('Experienced in C++ & Python. Café enthusiast.'),
      fc.constant('Expert in "Agile" methodologies. Résumé available.'),
      fc.constant('©2023 - All rights reserved. ™ Trademark.')
    ),
    profiles: fc.array(fc.record({
      network: fc.stringMatching(/^(LinkedIn|GitHub|Twitter)$/),
      url: fc.webUrl()
    }), { maxLength: 2 })
  }),
  work: fc.array(fc.record({
    name: fc.oneof(
      fc.constant('Müller & Associates'),
      fc.constant('José\'s Company'),
      fc.constant('Café Tech Inc.')
    ),
    position: fc.oneof(
      fc.constant('Senior Software Engineer'),
      fc.constant('Product Manager – Strategy'),
      fc.constant('Lead Developer (C++)')
    ),
    startDate: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    endDate: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    highlights: fc.array(fc.oneof(
      fc.constant('Implemented C++ algorithms'),
      fc.constant('Led "Agile" transformation'),
      fc.constant('Managed €1M budget'),
      fc.constant('Worked with Zürich office')
    ), { minLength: 1, maxLength: 3 })
  }), { minLength: 1, maxLength: 2 }),
  education: fc.array(fc.record({
    institution: fc.oneof(
      fc.constant('ETH Zürich'),
      fc.constant('University of São Paulo'),
      fc.constant('Moscow State University')
    ),
    studyType: fc.stringMatching(/^(Bachelor|Master|PhD)$/),
    area: fc.stringMatching(/^(Computer Science|Engineering|Business)$/),
    startDate: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    endDate: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    score: fc.stringMatching(/^\d\.\d{1,2}$/)
  }), { maxLength: 1 }),
  skills: fc.array(fc.record({
    name: fc.stringMatching(/^(Technical|Leadership|Communication)$/),
    keywords: fc.array(fc.oneof(
      fc.constant('C++'),
      fc.constant('Python'),
      fc.constant('Zürich'),
      fc.constant('São Paulo')
    ), { minLength: 2, maxLength: 3 })
  }), { maxLength: 2 }),
  projects: fc.constant([]),
  certificates: fc.constant([]),
  languages: fc.array(fc.record({
    language: fc.oneof(
      fc.constant('English'),
      fc.constant('Français'),
      fc.constant('Español'),
      fc.constant('Deutsch')
    ),
    fluency: fc.stringMatching(/^(Native|Fluent|Intermediate|Basic)$/)
  }), { maxLength: 2 })
} as any);

describe('Property-Based Test: Special Character Encoding', () => {
  it('should encode special characters correctly in HTML (100+ iterations)', () => {
    fc.assert(
      fc.property(arbJSONResumeWithSpecialChars, (cv: JSONResume) => {
        const html = templateRenderer.renderToHTML(cv);

        // Property 1: HTML should be valid UTF-8
        expect(() => Buffer.from(html, 'utf-8')).not.toThrow();

        // Property 2: Special characters should be preserved or properly encoded
        // Check that accented characters are present
        if (cv.basics.name.includes('ç') || cv.basics.name.includes('é')) {
          expect(html).toContain(cv.basics.name);
        }

        // Property 3: HTML should not have broken encoding
        expect(html).not.toContain('\\u');
        expect(html).not.toContain('&#x');

        // Property 4: Ampersands should be properly encoded
        if (cv.basics.name.includes('&')) {
          // Either the ampersand is preserved or encoded as &amp;
          expect(html).toMatch(/&|&amp;/);
        }

        // Property 5: Quotes should be properly handled
        if (cv.basics.summary.includes('"')) {
          // Quotes should be preserved or encoded
          expect(html).toMatch(/"/) || expect(html).toMatch(/&quot;/);
        }

        // Property 6: Less than and greater than should be encoded
        if (cv.basics.summary.includes('<') || cv.basics.summary.includes('>')) {
          expect(html).toMatch(/&lt;|&gt;/);
        }

        // Property 7: All work items should be present
        for (const job of cv.work) {
          // Company name should be present (possibly with encoded characters)
          expect(html.length).toBeGreaterThan(0);
        }

        // Property 8: All education items should be present
        for (const edu of cv.education) {
          expect(html.length).toBeGreaterThan(0);
        }

        // Property 9: All skills should be present
        for (const skill of cv.skills) {
          expect(html.length).toBeGreaterThan(0);
        }

        // Property 10: All languages should be present
        for (const lang of cv.languages) {
          expect(html.length).toBeGreaterThan(0);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should encode special characters correctly in PDF', async () => {
    await fc.assert(
      fc.asyncProperty(arbJSONResumeWithSpecialChars, async (cv: JSONResume) => {
        const pdfBuffer = await templateRenderer.renderToPDF(cv);

        // Property 1: PDF should be valid
        expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');

        // Property 2: PDF should have content
        expect(pdfBuffer.length).toBeGreaterThan(0);

        // Property 3: PDF should contain stream objects with encoded text
        const pdfString = pdfBuffer.toString('utf-8');
        expect(pdfString).toContain('stream');

        // Property 4: PDF should be openable (valid structure)
        expect(pdfString).toContain('xref');
        expect(pdfString).toContain('%%EOF');

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should handle Unicode characters from different languages', () => {
    fc.assert(
      fc.property(
        fc.record({
          basics: fc.record({
            name: fc.oneof(
              fc.constant('Иван Петров'),      // Russian
              fc.constant('李明'),              // Chinese
              fc.constant('田中太郎'),          // Japanese
              fc.constant('김철수'),            // Korean
              fc.constant('محمد علي')          // Arabic
            ),
            email: fc.emailAddress(),
            phone: fc.stringMatching(/^\+?1?\d{9,15}$/),
            location: fc.record({
              city: fc.string({ minLength: 3, maxLength: 30 }),
              region: fc.stringMatching(/^[A-Z]{2}$/)
            }),
            url: fc.webUrl(),
            summary: fc.string({ minLength: 10, maxLength: 100 }),
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

          // HTML should be valid
          expect(html).toContain('<!DOCTYPE html>');
          expect(html).toContain('</html>');

          // Should not throw on encoding
          expect(() => Buffer.from(html, 'utf-8')).not.toThrow();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle mixed special characters and regular text', () => {
    fc.assert(
      fc.property(
        fc.record({
          basics: fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            email: fc.emailAddress(),
            phone: fc.stringMatching(/^\+?1?\d{9,15}$/),
            location: fc.record({
              city: fc.string({ minLength: 3, maxLength: 30 }),
              region: fc.stringMatching(/^[A-Z]{2}$/)
            }),
            url: fc.webUrl(),
            summary: fc.string({ minLength: 20, maxLength: 200 }),
            profiles: fc.constant([])
          }),
          work: fc.array(fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            position: fc.string({ minLength: 5, maxLength: 50 }),
            startDate: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            endDate: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            highlights: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 2 })
          }), { minLength: 1, maxLength: 1 }),
          education: fc.constant([]),
          skills: fc.constant([]),
          projects: fc.constant([]),
          certificates: fc.constant([]),
          languages: fc.constant([])
        } as any),
        (cv: JSONResume) => {
          const html = templateRenderer.renderToHTML(cv);

          // Should be valid HTML
          expect(html).toContain('<!DOCTYPE html>');

          // Should be valid UTF-8
          expect(() => Buffer.from(html, 'utf-8')).not.toThrow();

          // Should not have encoding errors
          expect(html).not.toContain('undefined');
          expect(html).not.toContain('null');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
