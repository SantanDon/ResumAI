/**
 * Message Formatter Service
 * Converts markdown formatting to semantic HTML for clean chat display
 * Removes raw markdown symbols and preserves emojis
 * 
 * Features:
 * - Convert markdown headers (# ## ###) to semantic HTML
 * - Convert bold (**text**) and italic (*text*) to HTML tags
 * - Convert bullet lists to <ul><li> elements
 * - Remove markdown separators (---)
 * - Preserve emojis and special characters
 * - Cache formatted messages for performance
 * 
 * Supported Markdown:
 * - Headers: # Header 1, ## Header 2, ### Header 3
 * - Bold: **bold text**
 * - Italic: *italic text*
 * - Lists: • item or - item
 * - Separators: --- (removed)
 * 
 * Usage:
 * ```typescript
 * const html = messageFormatterService.formatMessage('**Bold** text with • list items');
 * // Returns: <div class="message-content"><p><strong>Bold</strong> text with <ul><li>list items</li></ul></p></div>
 * ```
 */

// Cache for compiled regex patterns
const regexCache = new Map<string, RegExp>();

class MessageFormatterService {
  private messageCache = new Map<string, string>();
  private cacheSize = 0;
  private maxCacheSize = 100; // Max number of cached messages

  /**
   * Convert markdown message to semantic HTML
   * Removes raw markdown symbols and uses CSS styling instead
   */
  formatMessage(content: string): string {
    if (!content) return '';

    // Check cache
    const cacheKey = this.generateCacheKey(content);
    if (this.messageCache.has(cacheKey)) {
      return this.messageCache.get(cacheKey)!;
    }

    let html = content;

    // Step 1: Preserve emojis by marking them
    html = this.preserveEmojis(html);

    // Step 2: Convert markdown headers (# ## ###) to semantic HTML
    html = this.parseHeaders(html);

    // Step 3: Convert bold text (**text**) to <strong>
    html = this.parseBold(html);

    // Step 4: Convert italic text (*text*) to <em>
    html = this.parseItalic(html);

    // Step 5: Convert bullet lists (• or -) to <ul><li>
    html = this.parseLists(html);

    // Step 6: Remove markdown separators (---)
    html = this.removeSeparators(html);

    // Step 7: Convert line breaks to <br>
    html = this.parseLineBreaks(html);

    // Step 8: Wrap in semantic container
    html = `<div class="message-content">${html}</div>`;

    // Cache the result
    this.cacheMessage(cacheKey, html);

    return html;
  }

  /**
   * Generate cache key for message
   */
  private generateCacheKey(content: string): string {
    // Simple hash based on content length and first/last chars
    return `${content.length}:${content.charCodeAt(0)}:${content.charCodeAt(content.length - 1)}`;
  }

  /**
   * Cache message with LRU eviction
   */
  private cacheMessage(key: string, html: string): void {
    if (this.cacheSize >= this.maxCacheSize) {
      const firstKey = this.messageCache.keys().next().value;
      if (firstKey !== undefined) {
        this.messageCache.delete(firstKey);
        this.cacheSize--;
      }
    }
    this.messageCache.set(key, html);
    this.cacheSize++;
  }

  /**
   * Clear message cache
   */
  clearCache(): void {
    this.messageCache.clear();
    this.cacheSize = 0;
  }

    /**
     * Parse markdown headers (# ## ###) to semantic HTML
     */
    private parseHeaders(content: string): string {
        // ### Header 3 -> <h3>Header 3</h3>
        content = content.replace(/^### (.+)$/gm, '<h3 class="message-h3">$1</h3>');
        
        // ## Header 2 -> <h2>Header 2</h2>
        content = content.replace(/^## (.+)$/gm, '<h2 class="message-h2">$1</h2>');
        
        // # Header 1 -> <h1>Header 1</h1>
        content = content.replace(/^# (.+)$/gm, '<h1 class="message-h1">$1</h1>');

        return content;
    }

    /**
     * Parse bold text (**text**) to <strong>
     */
    private parseBold(content: string): string {
        // **text** -> <strong>text</strong>
        content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // __text__ -> <strong>text</strong>
        content = content.replace(/__(.+?)__/g, '<strong>$1</strong>');

        return content;
    }

    /**
     * Parse italic text (*text*) to <em>
     */
    private parseItalic(content: string): string {
        // *text* -> <em>text</em> (but not **text**)
        content = content.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
        
        // _text_ -> <em>text</em> (but not __text__)
        content = content.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

        return content;
    }

    /**
     * Parse bullet lists (• or -) to <ul><li>
     */
    private parseLists(content: string): string {
        // Split by lines
        const lines = content.split('\n');
        let inList = false;
        let result: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Check if line starts with bullet or dash
            if (trimmed.match(/^[•\-\*]\s+/)) {
                if (!inList) {
                    result.push('<ul class="message-list">');
                    inList = true;
                }
                
                // Extract list item text
                const itemText = trimmed.replace(/^[•\-\*]\s+/, '');
                result.push(`<li>${itemText}</li>`);
            } else if (inList && trimmed === '') {
                // Empty line ends list
                result.push('</ul>');
                inList = false;
                result.push('');
            } else if (inList && !trimmed.match(/^[•\-\*]\s+/)) {
                // Non-list line ends list
                result.push('</ul>');
                inList = false;
                result.push(line);
            } else {
                result.push(line);
            }
        }

        // Close any open list
        if (inList) {
            result.push('</ul>');
        }

        return result.join('\n');
    }

    /**
     * Remove markdown separators (---)
     */
    private removeSeparators(content: string): string {
        // Remove lines that are just dashes/underscores
        content = content.replace(/^[\-_]{3,}$/gm, '');
        
        // Remove extra blank lines
        content = content.replace(/\n\n\n+/g, '\n\n');

        return content;
    }

    /**
     * Convert line breaks to <br> tags
     */
    private parseLineBreaks(content: string): string {
        // Convert double newlines to paragraph breaks
        content = content.replace(/\n\n/g, '</p><p>');
        
        // Wrap in paragraph
        if (!content.startsWith('<p>')) {
            content = `<p>${content}</p>`;
        }
        if (!content.endsWith('</p>')) {
            content = `${content}</p>`;
        }

        return content;
    }

    /**
     * Preserve emojis by marking them
     */
    private preserveEmojis(content: string): string {
        // Emojis are already preserved in the string, just ensure they're not modified
        // This is a placeholder for future emoji-specific handling if needed
        return content;
    }

    /**
     * Get CSS styles for formatted messages
     */
    getStyles(): string {
        return `
            <style>
                .message-content {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #1a1a1a;
                }

                .message-content h1 {
                    font-size: 1.5em;
                    font-weight: 700;
                    margin: 0.5em 0;
                    color: #111827;
                }

                .message-content h2 {
                    font-size: 1.25em;
                    font-weight: 700;
                    margin: 0.4em 0;
                    color: #1f2937;
                }

                .message-content h3 {
                    font-size: 1.1em;
                    font-weight: 600;
                    margin: 0.3em 0;
                    color: #374151;
                }

                .message-content strong {
                    font-weight: 600;
                    color: #111827;
                }

                .message-content em {
                    font-style: italic;
                    color: #4b5563;
                }

                .message-content p {
                    margin: 0.5em 0;
                }

                .message-content ul.message-list {
                    margin: 0.5em 0;
                    padding-left: 1.5em;
                    list-style: disc;
                }

                .message-content ul.message-list li {
                    margin: 0.25em 0;
                    color: #374151;
                }

                .message-content code {
                    background: #f3f4f6;
                    padding: 0.2em 0.4em;
                    border-radius: 3px;
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 0.9em;
                }

                .message-content pre {
                    background: #f3f4f6;
                    padding: 1em;
                    border-radius: 6px;
                    overflow-x: auto;
                    margin: 0.5em 0;
                }

                .message-content pre code {
                    background: none;
                    padding: 0;
                }
            </style>
        `;
    }
}

export const messageFormatterService = new MessageFormatterService();
