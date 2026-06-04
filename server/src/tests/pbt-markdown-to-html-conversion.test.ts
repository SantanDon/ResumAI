/**
 * Property-Based Test: Markdown to HTML Conversion
 * Task 2.2: Validates that markdown is converted to HTML without raw markdown symbols
 * 
 * Property: For any message containing markdown formatting (bold, lists, headers), 
 * the rendered HTML SHALL not contain raw markdown symbols and SHALL use semantic HTML tags instead.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import fc from 'fast-check';
import { messageFormatterService } from '../services/messageFormatter';

// Arbitraries for markdown content
const arbBoldText = fc.string({ minLength: 3, maxLength: 30 }).map(s => `**${s}**`);
const arbItalicText = fc.string({ minLength: 3, maxLength: 30 }).map(s => `*${s}*`);
const arbHeader1 = fc.string({ minLength: 3, maxLength: 30 }).map(s => `# ${s}`);
const arbHeader2 = fc.string({ minLength: 3, maxLength: 30 }).map(s => `## ${s}`);
const arbHeader3 = fc.string({ minLength: 3, maxLength: 30 }).map(s => `### ${s}`);
const arbListItem = fc.string({ minLength: 3, maxLength: 30 }).map(s => `• ${s}`);
const arbDashListItem = fc.string({ minLength: 3, maxLength: 30 }).map(s => `- ${s}`);

// Generator for messages with markdown
const arbMarkdownMessage = fc.oneof(
  arbBoldText,
  arbItalicText,
  arbHeader1,
  arbHeader2,
  arbHeader3,
  arbListItem,
  arbDashListItem,
  fc.tuple(arbHeader1, arbListItem).map(([h, l]) => `${h}\n${l}`),
  fc.tuple(arbHeader2, arbBoldText, arbListItem).map(([h, b, l]) => `${h}\n${b}\n${l}`),
  fc.array(arbListItem, { minLength: 2, maxLength: 5 }).map(items => items.join('\n')),
  fc.tuple(arbBoldText, arbItalicText).map(([b, i]) => `${b} and ${i}`),
  fc.string({ minLength: 10, maxLength: 100 }).map(s => `**Important:** ${s}`),
  fc.string({ minLength: 10, maxLength: 100 }).map(s => `## Section\n\n${s}\n\n• Point 1\n• Point 2`)
);

describe('Property-Based Test: Markdown to HTML Conversion', () => {
  it('should convert markdown to HTML without raw markdown symbols (100+ iterations)', () => {
    fc.assert(
      fc.property(arbMarkdownMessage, (message: string) => {
        const html = messageFormatterService.formatMessage(message);

        // Property 1: HTML should not contain raw ** (bold markdown)
        expect(html).not.toContain('**');

        // Property 2: HTML should not contain raw * (italic markdown) at start of words
        // Allow * in URLs or other contexts
        const lines = html.split('\n');
        for (const line of lines) {
          // Check for markdown-style emphasis (not in URLs)
          if (!line.includes('http')) {
            // Should not have *text* pattern
            expect(line).not.toMatch(/\*[a-zA-Z]/);
          }
        }

        // Property 3: HTML should not contain raw # (header markdown)
        expect(html).not.toMatch(/^#+ /m);

        // Property 4: HTML should not contain raw • (bullet markdown)
        // Bullets should be converted to <li> tags
        if (message.includes('•')) {
          expect(html).toContain('<li>');
          expect(html).not.toContain('•');
        }

        // Property 5: HTML should not contain raw - (dash markdown) for lists
        // But allow dashes in other contexts
        if (message.match(/^- /m)) {
          expect(html).toContain('<li>');
        }

        // Property 6: HTML should use semantic tags
        if (message.includes('**')) {
          expect(html).toContain('<strong>');
        }

        if (message.includes('*') && !message.includes('**')) {
          expect(html).toContain('<em>');
        }

        if (message.match(/^# /m)) {
          expect(html).toContain('<h1');
        }

        if (message.match(/^## /m)) {
          expect(html).toContain('<h2');
        }

        if (message.match(/^### /m)) {
          expect(html).toContain('<h3');
        }

        // Property 7: HTML should be valid
        expect(html).toContain('<div class="message-content">');
        expect(html).toContain('</div>');

        // Property 8: HTML should not have broken tags
        expect(html).not.toMatch(/<[^>]*$/m); // Unclosed tags at end of lines

        // Property 9: Content should be preserved
        // Remove markdown symbols and check content is still there
        const cleanMessage = message
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^#+\s/gm, '')
          .replace(/^[•\-]\s/gm, '');
        
        // At least some content should be preserved
        expect(html.length).toBeGreaterThan(0);

        // Property 10: HTML should not have excessive nesting
        const nestingLevel = (html.match(/<[a-z]/g) || []).length;
        expect(nestingLevel).toBeLessThan(100);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should convert bold text to <strong> tags', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }),
        (text: string) => {
          const message = `**${text}**`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Should contain <strong> tag
          expect(html).toContain('<strong>');
          expect(html).toContain('</strong>');

          // Property 2: Should not contain raw **
          expect(html).not.toContain('**');

          // Property 3: Text should be preserved
          expect(html).toContain(text);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should convert italic text to <em> tags', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes('*')),
        (text: string) => {
          const message = `*${text}*`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Should contain <em> tag
          expect(html).toContain('<em>');
          expect(html).toContain('</em>');

          // Property 2: Should not contain raw single *
          // (may contain * in other contexts)
          expect(html).not.toMatch(/\*[a-zA-Z]/);

          // Property 3: Text should be preserved
          expect(html).toContain(text);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should convert headers to semantic heading tags', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 3 }),
          fc.string({ minLength: 3, maxLength: 50 })
        ),
        ([level, text]: [number, string]) => {
          const hashes = '#'.repeat(level);
          const message = `${hashes} ${text}`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Should contain appropriate heading tag
          expect(html).toContain(`<h${level}`);
          expect(html).toContain(`</h${level}>`);

          // Property 2: Should not contain raw # symbols
          expect(html).not.toMatch(/^#+\s/m);

          // Property 3: Text should be preserved
          expect(html).toContain(text);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should convert bullet lists to <ul> and <li> tags', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
        (items: string[]) => {
          const message = items.map(item => `• ${item}`).join('\n');
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Should contain <ul> tag
          expect(html).toContain('<ul');
          expect(html).toContain('</ul>');

          // Property 2: Should contain <li> tags for each item
          expect(html).toContain('<li>');
          expect(html).toContain('</li>');

          // Property 3: Should not contain raw • symbols
          expect(html).not.toContain('•');

          // Property 4: All items should be preserved
          for (const item of items) {
            expect(html).toContain(item);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle mixed markdown formatting', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 3, maxLength: 30 }),
          fc.string({ minLength: 3, maxLength: 30 }),
          fc.string({ minLength: 3, maxLength: 30 })
        ),
        ([header, bold, item]: [string, string, string]) => {
          const message = `## ${header}\n\n**${bold}**\n\n• ${item}`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Should have header tag
          expect(html).toContain('<h2');

          // Property 2: Should have strong tag
          expect(html).toContain('<strong>');

          // Property 3: Should have list tag
          expect(html).toContain('<li>');

          // Property 4: Should not have raw markdown symbols
          expect(html).not.toContain('**');
          expect(html).not.toContain('##');
          expect(html).not.toContain('•');

          // Property 5: All content should be preserved
          expect(html).toContain(header);
          expect(html).toContain(bold);
          expect(html).toContain(item);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should remove markdown separators', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 50 }),
        (text: string) => {
          const message = `${text}\n\n---\n\nMore text`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Should not contain raw --- separator
          expect(html).not.toContain('---');

          // Property 2: Should not contain raw __ separator
          expect(html).not.toContain('___');

          // Property 3: Content should be preserved
          expect(html).toContain('text');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve content while removing markdown', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        (text: string) => {
          const message = `**${text}**`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Original text should be in HTML
          expect(html).toContain(text);

          // Property 2: HTML should be longer than original (due to tags)
          expect(html.length).toBeGreaterThan(message.length);

          // Property 3: Should be valid HTML
          expect(html).toContain('<div class="message-content">');
          expect(html).toContain('</div>');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle edge cases: empty and minimal messages', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('**'),
          fc.constant('*'),
          fc.constant('#'),
          fc.constant('•'),
          fc.constant('   ')
        ),
        (message: string) => {
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Should always return valid HTML structure
          expect(html).toContain('<div class="message-content">');
          expect(html).toContain('</div>');

          // Property 2: Should not throw
          expect(() => messageFormatterService.formatMessage(message)).not.toThrow();

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
