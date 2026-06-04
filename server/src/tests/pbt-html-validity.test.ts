/**
 * Property-Based Test: HTML Validity
 * Task 1.9: Validates that HTML output is valid HTML5 with proper semantic structure
 * 
 * Property: For any JSON Resume, rendering to HTML SHALL produce valid HTML5 
 * with proper semantic structure.
 * 
 * Validates: Requirements 5.5
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

// Helper function to validate HTML structure
function validateHTMLStructure(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check DOCTYPE
  if (!html.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration');
  }

  // Check html tag
  if (!html.includes('<html')) {
    errors.push('Missing <html> tag');
  }
  if (!html.includes('</html>')) {
    errors.push('Missing closing </html> tag');
  }

  // Check head tag
  if (!html.includes('<head>')) {
    errors.push('Missing <head> tag');
  }
  if (!html.includes('</head>')) {
    errors.push('Missing closing </head> tag');
  }

  // Check body tag
  if (!html.includes('<body>')) {
    errors.push('Missing <body> tag');
  }
  if (!html.includes('</body>')) {
    errors.push('Missing closing </body> tag');
  }

  // Check meta charset
  if (!html.includes('charset')) {
    errors.push('Missing charset meta tag');
  }

  // Check for unclosed tags (basic check)
  const openTags = (html.match(/<[a-z]+[^>]*>/gi) || []).length;
  const closeTags = (html.match(/<\/[a-z]+>/gi) || []).length;
  
  // Allow some difference for self-closing tags
  if (Math.abs(openTags - closeTags) > 5) {
    errors.push(`Tag mismatch: ${openTags} open tags vs ${closeTags} close tags`);
  }

  // Check for invalid characters in HTML
  if (html.includes('<<') || html.includes('>>')) {
    errors.push('Invalid double angle brackets');
  }

  // Check for proper nesting of common tags
  const sectionMatches = html.match(/<section[^>]*>[\s\S]*?<\/section>/g) || [];
  for (const section of sectionMatches) {
    if (!section.includes('</section>')) {
      errors.push('Unclosed section tag');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

describe('Property-Based Test: HTML Validity', () => {
  it('should generate valid HTML5 structure (100+ iterations)', () => {
    fc.assert(
      fc.property(arbJSONResume, (cv: JSONResume) => {
        const html = templateRenderer.renderToHTML(cv);

        // Property 1: HTML should have valid structure
        const validation = validateHTMLStructure(html);
        expect(validation.valid).toBe(true);
        if (!validation.valid) {
          console.error('HTML validation errors:', validation.errors);
        }

        // Property 2: HTML should start with DOCTYPE
        expect(html.trim().startsWith('<!DOCTYPE html>')).toBe(true);

        // Property 3: HTML should contain proper meta tags
        expect(html).toContain('<meta charset="UTF-8">');
        expect(html).toContain('<meta name="viewport"');

        // Property 4: HTML should have title tag
        expect(html).toContain('<title>');
        expect(html).toContain('</title>');

        // Property 5: HTML should have style tag
        expect(html).toContain('<style>');
        expect(html).toContain('</style>');

        // Property 6: HTML should have semantic structure
        expect(html).toContain('<header');
        expect(html).toContain('</header>');
        expect(html).toContain('<section');
        expect(html).toContain('</section>');

        // Property 7: HTML should use semantic heading tags
        expect(html).toMatch(/<h[1-6]/);

        // Property 8: HTML should not have invalid nesting
        // Check that divs are properly closed
        const divCount = (html.match(/<div[^>]*>/g) || []).length;
        const divCloseCount = (html.match(/<\/div>/g) || []).length;
        expect(divCount).toBe(divCloseCount);

        // Property 9: HTML should not have duplicate IDs
        const idMatches = html.match(/id="([^"]+)"/g) || [];
        const ids = idMatches.map(m => m.match(/id="([^"]+)"/)?.[1]);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);

        // Property 10: HTML should not have invalid attributes
        expect(html).not.toMatch(/\s[a-z-]+=$/); // Incomplete attributes

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should use semantic HTML tags appropriately', () => {
    fc.assert(
      fc.property(arbJSONResume, (cv: JSONResume) => {
        const html = templateRenderer.renderToHTML(cv);

        // Property 1: Should use <header> for header section
        expect(html).toContain('<header');

        // Property 2: Should use <section> for content sections
        expect(html).toContain('<section');

        // Property 3: Should use <h1> for main heading
        expect(html).toContain('<h1');

        // Property 4: Should use <h2> for section headings
        expect(html).toContain('<h2');

        // Property 5: Should use <ul> or <ol> for lists
        if (cv.work && cv.work.length > 0 && cv.work[0].highlights) {
          expect(html).toContain('<ul');
        }

        // Property 6: Should use <a> for links
        if (cv.basics.url) {
          expect(html).toContain('<a');
        }

        // Property 7: Should use <p> for paragraphs
        if (cv.basics.summary) {
          expect(html).toContain('<p');
        }

        // Property 8: Should not use deprecated tags
        expect(html).not.toContain('<font');
        expect(html).not.toContain('<center');
        expect(html).not.toContain('<marquee');

        // Property 9: Should have proper class names
        expect(html).toContain('class=');

        // Property 10: Should not have inline styles (should use CSS)
        // Allow some inline styles but not excessive
        const inlineStyleCount = (html.match(/style="/g) || []).length;
        expect(inlineStyleCount).toBeLessThan(5);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should properly escape HTML special characters', () => {
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

          // Property 1: HTML should be valid
          const validation = validateHTMLStructure(html);
          expect(validation.valid).toBe(true);

          // Property 2: Should not have unescaped angle brackets in content
          // (they should be in tags or escaped)
          const contentMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
          if (contentMatch) {
            const content = contentMatch[1];
            // Count unescaped < and > (rough check)
            const unescapedAngleBrackets = (content.match(/[^&]</g) || []).length;
            // Should be minimal (mostly from tags)
            expect(unescapedAngleBrackets).toBeLessThan(50);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have proper tag nesting', () => {
    fc.assert(
      fc.property(arbJSONResume, (cv: JSONResume) => {
        const html = templateRenderer.renderToHTML(cv);

        // Property 1: All opening tags should have closing tags
        const tagRegex = /<([a-z]+)[^>]*>/gi;
        const closingTagRegex = /<\/([a-z]+)>/gi;

        const openTags: string[] = [];
        let match;

        // Collect all opening tags (excluding self-closing)
        while ((match = tagRegex.exec(html)) !== null) {
          const tagName = match[1].toLowerCase();
          // Skip self-closing tags
          if (!['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)) {
            openTags.push(tagName);
          }
        }

        // Collect all closing tags
        const closeTags: string[] = [];
        while ((match = closingTagRegex.exec(html)) !== null) {
          closeTags.push(match[1].toLowerCase());
        }

        // Property 2: Should have reasonable tag balance
        // (allowing for some variation due to self-closing tags)
        const tagBalance = Math.abs(openTags.length - closeTags.length);
        expect(tagBalance).toBeLessThan(10);

        // Property 3: Common tags should be balanced
        const commonTags = ['div', 'section', 'header', 'p', 'ul', 'li'];
        for (const tag of commonTags) {
          const openCount = openTags.filter(t => t === tag).length;
          const closeCount = closeTags.filter(t => t === tag).length;
          expect(openCount).toBe(closeCount);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should generate minimal and valid HTML for edge cases', () => {
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

          // Even minimal CV should have valid HTML
          const validation = validateHTMLStructure(html);
          expect(validation.valid).toBe(true);

          // Should still have basic structure
          expect(html).toContain('<!DOCTYPE html>');
          expect(html).toContain('<html');
          expect(html).toContain('</html>');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
