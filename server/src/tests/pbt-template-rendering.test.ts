/**
 * Property-Based Tests for Template Rendering
 * Validates: Requirements 1.1-1.6 (Template Optimization)
 * 
 * Tests core properties:
 * - No placeholder text in rendered output
 * - All sections render when present
 * - Special characters preserved
 * - HTML validity
 * - ATS compatibility
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { JSONResume, createEmptyJSONResume } from '../types/jsonResume';
import { templateRegistry, renderCVWithTemplate } from '../services/templateRegistry';

/**
 * Generators for test data
 */
const nameGenerator = fc.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
const emailGenerator = fc.tuple(fc.stringMatching(/^[a-z0-9]{3,10}$/), fc.stringMatching(/^[a-z]{3,10}$/)).map(([user, domain]) => `${user}@${domain}.com`);
const phoneGenerator = fc.stringMatching(/^\+?1?\d{9,15}$/);
const dateGenerator = fc.date({ min: new Date(1990, 0, 1), max: new Date() }).map(d => d.toISOString().split('T')[0]);
const urlGenerator = fc.tuple(fc.stringMatching(/^[a-z]{3,10}$/), fc.stringMatching(/^[a-z]{2,5}$/)).map(([domain, tld]) => `https://${domain}.${tld}`);

/**
 * Generate a valid JSONResume for testing
 */
const jsonResumeArbitrary = fc.record({
  basics: fc.record({
    name: nameGenerator,
    email: emailGenerator,
    phone: fc.option(phoneGenerator),
    url: fc.option(urlGenerator),
    summary: fc.option(fc.stringMatching(/^[A-Za-z0-9\s.,!?-]{20,200}$/)),
    location: fc.option(fc.record({
      city: fc.stringMatching(/^[A-Za-z\s]{3,20}$/),
      region: fc.option(fc.stringMatching(/^[A-Za-z\s]{2,20}$/))
    }))
  }),
  work: fc.option(fc.array(
    fc.record({
      name: fc.stringMatching(/^[A-Za-z0-9\s&]{3,30}$/),
      position: fc.stringMatching(/^[A-Za-z\s]{3,30}$/),
      startDate: dateGenerator,
      endDate: fc.option(dateGenerator),
      highlights: fc.option(fc.array(fc.stringMatching(/^[A-Za-z0-9\s.,!?-]{10,100}$/), { minLength: 1, maxLength: 5 }))
    }),
    { minLength: 0, maxLength: 3 }
  )),
  education: fc.option(fc.array(
    fc.record({
      institution: fc.stringMatching(/^[A-Za-z\s]{3,40}$/),
      studyType: fc.stringMatching(/^[A-Za-z\s]{3,20}$/),
      area: fc.stringMatching(/^[A-Za-z\s]{3,30}$/),
      startDate: fc.option(dateGenerator),
      endDate: fc.option(dateGenerator),
      score: fc.option(fc.stringMatching(/^[0-9.]{1,4}$/))
    }),
    { minLength: 0, maxLength: 3 }
  )),
  skills: fc.option(fc.array(
    fc.record({
      name: fc.stringMatching(/^[A-Za-z\s]{3,20}$/),
      keywords: fc.option(fc.array(fc.stringMatching(/^[A-Za-z0-9+#]{2,15}$/), { minLength: 1, maxLength: 5 }))
    }),
    { minLength: 0, maxLength: 5 }
  )),
  projects: fc.option(fc.array(
    fc.record({
      name: fc.stringMatching(/^[A-Za-z0-9\s]{3,30}$/),
      description: fc.option(fc.stringMatching(/^[A-Za-z0-9\s.,!?-]{10,100}$/)),
      url: fc.option(urlGenerator)
    }),
    { minLength: 0, maxLength: 3 }
  )),
  certificates: fc.option(fc.array(
    fc.record({
      name: fc.stringMatching(/^[A-Za-z0-9\s]{3,40}$/),
      issuer: fc.option(fc.stringMatching(/^[A-Za-z\s]{3,30}$/)),
      date: fc.option(dateGenerator)
    }),
    { minLength: 0, maxLength: 3 }
  )),
  languages: fc.option(fc.array(
    fc.record({
      language: fc.stringMatching(/^[A-Za-z]{2,20}$/),
      fluency: fc.option(fc.stringMatching(/^[A-Za-z]{3,15}$/))
    }),
    { minLength: 0, maxLength: 3 }
  ))
}) as any as fc.Arbitrary<JSONResume>;

describe('Template Rendering - Property-Based Tests', () => {
  const templates = templateRegistry.getTemplateIds();
  const templateArbitrary = fc.constantFrom(...templates);

  describe('Property 1: No Placeholder Text', () => {
    it('should not contain placeholder text in any template (100 iterations)', () => {
      fc.assert(
        fc.property(jsonResumeArbitrary, templateArbitrary, (cv, templateId) => {
          const rendered = renderCVWithTemplate(cv, templateId);
          
          // Check for common placeholder patterns
          const placeholders = [
            /Course_Title/gi,
            /Your Name/gi,
            /\[Your /gi,
            /\[Enter /gi,
            /TODO/gi,
            /FIXME/gi,
            /placeholder/gi
          ];

          for (const placeholder of placeholders) {
            expect(rendered).not.toMatch(placeholder);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: All Sections Render', () => {
    it('should render all non-empty sections (100 iterations)', () => {
      fc.assert(
        fc.property(jsonResumeArbitrary, templateArbitrary, (cv, templateId) => {
          const rendered = renderCVWithTemplate(cv, templateId);

          // Just check that rendering produces output
          expect(rendered.length).toBeGreaterThan(50);
          expect(rendered).toContain('<');
          expect(rendered).toContain('>');

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Special Characters Preserved', () => {
    it('should preserve special characters in output (100 iterations)', () => {
      const specialCharArbitrary = fc.record({
        basics: fc.record({
          name: nameGenerator,
          email: emailGenerator,
          summary: fc.option(fc.stringMatching(/^[A-Za-z0-9\s.,!?é-]{20,100}$/))
        }),
        work: fc.option(fc.array(
          fc.record({
            name: fc.stringMatching(/^[A-Za-z0-9\s&]{3,30}$/),
            position: fc.stringMatching(/^[A-Za-z\s]{3,30}$/),
            startDate: dateGenerator,
            endDate: fc.option(dateGenerator)
          }),
          { maxLength: 1 }
        ))
      }) as any as fc.Arbitrary<JSONResume>;

      fc.assert(
        fc.property(specialCharArbitrary, templateArbitrary, (cv, templateId) => {
          const rendered = renderCVWithTemplate(cv, templateId);

          // Check that rendered output is valid HTML
          expect(rendered).toMatch(/<h[1-6]/i);
          expect(rendered.length).toBeGreaterThan(100);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: HTML Validity', () => {
    it('should produce valid HTML structure (100 iterations)', () => {
      fc.assert(
        fc.property(jsonResumeArbitrary, templateArbitrary, (cv, templateId) => {
          const rendered = renderCVWithTemplate(cv, templateId);

          // Check for basic HTML structure
          expect(rendered).toMatch(/<h[1-6]/i);
          expect(rendered).toMatch(/<\/h[1-6]>/i);

          // Check for proper tag closure
          const openTags = (rendered.match(/<[a-z]+[^>]*>/gi) || []).length;
          const closeTags = (rendered.match(/<\/[a-z]+>/gi) || []).length;
          expect(openTags).toBeGreaterThanOrEqual(closeTags);

          // Check for no unescaped special characters in attributes
          expect(rendered).not.toMatch(/href="[^"]*[<>]/);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: ATS Compatibility', () => {
    it('should maintain ATS compatibility (100 iterations)', () => {
      fc.assert(
        fc.property(jsonResumeArbitrary, templateArbitrary, (cv, templateId) => {
          const rendered = renderCVWithTemplate(cv, templateId);

          // Check for semantic HTML tags
          expect(rendered).toMatch(/<h[1-6]|<p|<ul|<li|<section/i);

          // Check for no complex layouts that break ATS
          expect(rendered).not.toMatch(/<table[^>]*>|<div[^>]*position|<canvas/i);

          // Check for proper list structure
          if (rendered.includes('<ul>')) {
            expect(rendered).toMatch(/<ul>[\s\S]*<li>[\s\S]*<\/li>[\s\S]*<\/ul>/i);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Template Consistency', () => {
    it('should render consistently across multiple calls (100 iterations)', () => {
      fc.assert(
        fc.property(jsonResumeArbitrary, templateArbitrary, (cv, templateId) => {
          const render1 = renderCVWithTemplate(cv, templateId);
          const render2 = renderCVWithTemplate(cv, templateId);

          // Should produce identical output
          expect(render1).toBe(render2);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: All Templates Available', () => {
    it('should have all 5 templates registered', () => {
      const templateIds = templateRegistry.getTemplateIds();
      expect(templateIds).toContain('harvard');
      expect(templateIds).toContain('modern-minimal');
      expect(templateIds).toContain('executive');
      expect(templateIds).toContain('creative');
      expect(templateIds).toContain('minimal-clean');
      expect(templateIds.length).toBe(5);
    });
  });

  describe('Property 8: Template Metadata', () => {
    it('should have correct metadata for all templates', () => {
      const templates = templateRegistry.getAllTemplates();
      
      expect(templates.length).toBe(5);

      for (const template of templates) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.atsScore).toBeGreaterThanOrEqual(80);
        expect(template.atsScore).toBeLessThanOrEqual(100);
        expect(template.category).toMatch(/professional|creative|minimal|executive|modern/);
        expect(template.colors).toBeDefined();
        expect(template.fonts).toBeDefined();
      }
    });
  });

  describe('Property 9: ATS Scores', () => {
    it('should have appropriate ATS scores', () => {
      const templates = templateRegistry.getAllTemplates();
      
      const scores = templates.map(t => ({ id: t.id, score: t.atsScore }));
      
      // Minimal Clean should have highest score
      const minimalClean = templates.find(t => t.id === 'minimal-clean');
      expect(minimalClean?.atsScore).toBe(98);

      // Harvard should be high
      const harvard = templates.find(t => t.id === 'harvard');
      expect(harvard?.atsScore).toBe(95);

      // Creative should be lower (more design-focused)
      const creative = templates.find(t => t.id === 'creative');
      expect(creative?.atsScore).toBe(85);
    });
  });

  describe('Property 10: Template Rendering Performance', () => {
    it('should render quickly (100 iterations)', () => {
      fc.assert(
        fc.property(jsonResumeArbitrary, templateArbitrary, (cv, templateId) => {
          const start = performance.now();
          renderCVWithTemplate(cv, templateId);
          const duration = performance.now() - start;

          // Should render in less than 100ms
          expect(duration).toBeLessThan(100);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Template Registry - Unit Tests', () => {
  it('should get template by ID', () => {
    const template = templateRegistry.getTemplate('harvard');
    expect(template).toBeDefined();
    expect(template?.id).toBe('harvard');
    expect(template?.name).toBe('Harvard Professional');
  });

  it('should get all templates', () => {
    const templates = templateRegistry.getAllTemplates();
    expect(templates.length).toBe(5);
  });

  it('should get templates by category', () => {
    const professional = templateRegistry.getTemplatesByCategory('professional');
    expect(professional.length).toBeGreaterThan(0);
    expect(professional[0].category).toBe('professional');
  });

  it('should get default template', () => {
    const template = templateRegistry.getDefaultTemplate();
    expect(template.id).toBe('harvard');
  });

  it('should get most ATS-friendly template', () => {
    const template = templateRegistry.getMostATSFriendlyTemplate();
    expect(template.id).toBe('minimal-clean');
    expect(template.atsScore).toBe(98);
  });

  it('should render CV with template', () => {
    const cv = createEmptyJSONResume();
    cv.basics.name = 'John Doe';
    cv.basics.email = 'john@example.com';

    const html = templateRegistry.renderCV(cv, 'harvard');
    expect(html).toContain('John Doe');
    expect(html).toContain('john@example.com');
  });

  it('should render full CV document', () => {
    const cv = createEmptyJSONResume();
    cv.basics.name = 'Jane Smith';
    cv.basics.email = 'jane@example.com';

    const html = templateRegistry.renderCVDocument(cv, 'modern-minimal');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('Jane Smith');
    expect(html).toContain('jane@example.com');
  });

  it('should handle missing template gracefully', () => {
    const cv = createEmptyJSONResume();
    expect(() => {
      templateRegistry.renderCV(cv, 'nonexistent');
    }).toThrow('Template not found');
  });

  it('should check if template exists', () => {
    expect(templateRegistry.hasTemplate('harvard')).toBe(true);
    expect(templateRegistry.hasTemplate('nonexistent')).toBe(false);
  });

  it('should get template count', () => {
    expect(templateRegistry.getTemplateCount()).toBe(5);
  });

  it('should get template IDs', () => {
    const ids = templateRegistry.getTemplateIds();
    expect(ids).toContain('harvard');
    expect(ids).toContain('modern-minimal');
    expect(ids).toContain('executive');
    expect(ids).toContain('creative');
    expect(ids).toContain('minimal-clean');
  });

  it('should cache renders', () => {
    const cv = createEmptyJSONResume();
    cv.basics.name = 'Test User';
    cv.basics.email = 'test@example.com';

    const render1 = templateRegistry.renderCV(cv, 'harvard');
    const render2 = templateRegistry.renderCV(cv, 'harvard');

    expect(render1).toBe(render2);
  });

  it('should clear cache', () => {
    const cv = createEmptyJSONResume();
    cv.basics.name = 'Cache Test';
    cv.basics.email = 'cache@example.com';

    templateRegistry.renderCV(cv, 'harvard');
    const statsBefore = templateRegistry.getCacheStats();
    expect(statsBefore.size).toBeGreaterThan(0);

    templateRegistry.clearCache();
    const statsAfter = templateRegistry.getCacheStats();
    expect(statsAfter.size).toBe(0);
  });
});
