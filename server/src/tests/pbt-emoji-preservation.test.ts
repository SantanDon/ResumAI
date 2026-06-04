/**
 * Property-Based Test: Emoji Preservation
 * Task 2.3: Validates that emojis are preserved in formatted output
 * 
 * Property: For any message containing emojis, the rendered output 
 * SHALL preserve all emojis in their original positions.
 * 
 * Validates: Requirements 2.6
 */

import fc from 'fast-check';
import { messageFormatterService } from '../services/messageFormatter';

// Common emojis for testing
const emojis = [
  '✅', '❌', '⚠️', '✨', '🎉', '🚀', '💡', '📝', '📊', '📈',
  '👍', '👎', '❤️', '💯', '🔥', '⭐', '🌟', '💼', '🎯', '📱',
  '💻', '🖥️', '⚙️', '🔧', '🔨', '📚', '📖', '✍️', '🎓', '🏆',
  '🎁', '🎊', '🎈', '🎀', '🌈', '☀️', '🌙', '⏰', '⏱️', '📅',
  '🔔', '📢', '📣', '💬', '💭', '🗨️', '🗯️', '👤', '👥', '🤝'
];

// Generator for emoji strings
const arbEmoji = fc.oneof(...emojis.map(e => fc.constant(e)));

// Generator for messages with emojis
const arbMessageWithEmojis = fc.oneof(
  fc.tuple(arbEmoji, fc.string({ minLength: 5, maxLength: 50 }))
    .map(([emoji, text]) => `${emoji} ${text}`),
  fc.tuple(arbEmoji, fc.string({ minLength: 5, maxLength: 50 }))
    .map(([emoji, text]) => `${text} ${emoji}`),
  fc.array(arbEmoji, { minLength: 2, maxLength: 5 })
    .map(emojiList => emojiList.join(' ')),
  fc.tuple(
    arbEmoji,
    fc.string({ minLength: 5, maxLength: 30 }),
    arbEmoji,
    fc.string({ minLength: 5, maxLength: 30 })
  ).map(([e1, t1, e2, t2]) => `${e1} ${t1}\n${e2} ${t2}`),
  fc.tuple(
    arbEmoji,
    fc.string({ minLength: 5, maxLength: 50 })
  ).map(([emoji, text]) => `**${emoji} ${text}**`),
  fc.tuple(
    arbEmoji,
    fc.string({ minLength: 5, maxLength: 50 })
  ).map(([emoji, text]) => `## ${emoji} ${text}`),
  fc.tuple(
    arbEmoji,
    fc.string({ minLength: 5, maxLength: 50 })
  ).map(([emoji, text]) => `• ${emoji} ${text}`),
  fc.array(fc.tuple(arbEmoji, fc.string({ minLength: 3, maxLength: 30 })), { minLength: 2, maxLength: 4 })
    .map(items => items.map(([e, t]) => `• ${e} ${t}`).join('\n'))
);

describe('Property-Based Test: Emoji Preservation', () => {
  it('should preserve all emojis in formatted output (100+ iterations)', () => {
    fc.assert(
      fc.property(arbMessageWithEmojis, (message: string) => {
        const html = messageFormatterService.formatMessage(message);

        // Extract all emojis from original message
        const originalEmojis = message.match(/[\p{Emoji}]/gu) || [];

        // Extract all emojis from HTML output
        const htmlEmojis = html.match(/[\p{Emoji}]/gu) || [];

        // Property 1: All emojis should be preserved
        expect(htmlEmojis.length).toBe(originalEmojis.length);

        // Property 2: Each emoji should appear in the output
        for (const emoji of originalEmojis) {
          expect(html).toContain(emoji);
        }

        // Property 3: Emojis should be in the same order
        const originalEmojiString = originalEmojis.join('');
        const htmlEmojiString = htmlEmojis.join('');
        expect(htmlEmojiString).toContain(originalEmojiString);

        // Property 4: HTML should still be valid
        expect(html).toContain('<div class="message-content">');
        expect(html).toContain('</div>');

        // Property 5: Emojis should not be escaped or encoded
        expect(html).not.toContain('&#');
        expect(html).not.toContain('&amp;');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve emojis with markdown formatting', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          arbEmoji,
          fc.string({ minLength: 5, maxLength: 30 })
        ),
        ([emoji, text]: [string, string]) => {
          const message = `**${emoji} ${text}**`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Emoji should be preserved
          expect(html).toContain(emoji);

          // Property 2: Text should be in strong tag
          expect(html).toContain('<strong>');

          // Property 3: Emoji should not be escaped
          expect(html).not.toContain('&#');

          // Property 4: Emoji should appear before or with text
          const emojiIndex = html.indexOf(emoji);
          const textIndex = html.indexOf(text);
          expect(emojiIndex).toBeGreaterThanOrEqual(0);
          expect(textIndex).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve emojis in lists', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(arbEmoji, fc.string({ minLength: 3, maxLength: 30 })), { minLength: 2, maxLength: 5 }),
        (items: Array<[string, string]>) => {
          const message = items.map(([emoji, text]) => `• ${emoji} ${text}`).join('\n');
          const html = messageFormatterService.formatMessage(message);

          // Property 1: All emojis should be preserved
          for (const [emoji] of items) {
            expect(html).toContain(emoji);
          }

          // Property 2: Should have list structure
          expect(html).toContain('<ul');
          expect(html).toContain('<li>');

          // Property 3: Emojis should not be escaped
          expect(html).not.toContain('&#');

          // Property 4: Each emoji should appear in a list item
          const liMatches = html.match(/<li>[^<]*[\p{Emoji}][^<]*<\/li>/gu) || [];
          expect(liMatches.length).toBeGreaterThanOrEqual(items.length);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve emojis in headers', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 3 }),
          arbEmoji,
          fc.string({ minLength: 5, maxLength: 30 })
        ),
        ([level, emoji, text]: [number, string, string]) => {
          const hashes = '#'.repeat(level);
          const message = `${hashes} ${emoji} ${text}`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Emoji should be preserved
          expect(html).toContain(emoji);

          // Property 2: Should have heading tag
          expect(html).toContain(`<h${level}`);

          // Property 3: Emoji should not be escaped
          expect(html).not.toContain('&#');

          // Property 4: Emoji should be in the heading
          const headingRegex = new RegExp(`<h${level}[^>]*>[^<]*${emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</h${level}>`, 'u');
          expect(html).toMatch(headingRegex);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve multiple emojis in same message', () => {
    fc.assert(
      fc.property(
        fc.array(arbEmoji, { minLength: 3, maxLength: 10 }),
        (emojiList: string[]) => {
          const message = emojiList.join(' ');
          const html = messageFormatterService.formatMessage(message);

          // Property 1: All emojis should be preserved
          for (const emoji of emojiList) {
            expect(html).toContain(emoji);
          }

          // Property 2: Count should match
          const htmlEmojis = html.match(/[\p{Emoji}]/gu) || [];
          expect(htmlEmojis.length).toBe(emojiList.length);

          // Property 3: Order should be preserved
          let lastIndex = 0;
          for (const emoji of emojiList) {
            const index = html.indexOf(emoji, lastIndex);
            expect(index).toBeGreaterThanOrEqual(lastIndex);
            lastIndex = index + emoji.length;
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve emojis with special characters', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          arbEmoji,
          fc.string({ minLength: 5, maxLength: 30 })
        ),
        ([emoji, text]: [string, string]) => {
          const message = `${emoji} **${text}** & more`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Emoji should be preserved
          expect(html).toContain(emoji);

          // Property 2: Ampersand should be handled
          expect(html).toMatch(/&|&amp;/);

          // Property 3: Text should be in strong tag
          expect(html).toContain('<strong>');

          // Property 4: Emoji should not be escaped
          expect(html).not.toContain('&#');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle edge cases: emoji-only messages', () => {
    fc.assert(
      fc.property(
        fc.array(arbEmoji, { minLength: 1, maxLength: 5 }),
        (emojiList: string[]) => {
          const message = emojiList.join('');
          const html = messageFormatterService.formatMessage(message);

          // Property 1: All emojis should be preserved
          for (const emoji of emojiList) {
            expect(html).toContain(emoji);
          }

          // Property 2: Should still have valid HTML structure
          expect(html).toContain('<div class="message-content">');
          expect(html).toContain('</div>');

          // Property 3: Should not throw
          expect(() => messageFormatterService.formatMessage(message)).not.toThrow();

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should preserve emoji positions relative to text', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          arbEmoji,
          fc.string({ minLength: 5, maxLength: 20 }),
          arbEmoji,
          fc.string({ minLength: 5, maxLength: 20 })
        ),
        ([emoji1, text1, emoji2, text2]: [string, string, string, string]) => {
          const message = `${emoji1} ${text1} ${emoji2} ${text2}`;
          const html = messageFormatterService.formatMessage(message);

          // Property 1: Both emojis should be preserved
          expect(html).toContain(emoji1);
          expect(html).toContain(emoji2);

          // Property 2: First emoji should appear before second
          const emoji1Index = html.indexOf(emoji1);
          const emoji2Index = html.indexOf(emoji2);
          expect(emoji1Index).toBeLessThan(emoji2Index);

          // Property 3: Text should be between emojis
          const text1Index = html.indexOf(text1);
          expect(text1Index).toBeGreaterThan(emoji1Index);
          expect(text1Index).toBeLessThan(emoji2Index);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
