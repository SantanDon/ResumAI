/**
 * Caching Layer Service
 * Implements LRU caching for templates, industry profiles, and PDFs
 * Provides performance optimization for CV generation
 */

/**
 * Generic LRU Cache implementation
 */
export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      this.hits++;
      return value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V): void {
    // If key exists, remove it first
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // If cache is full, remove least recently used (first entry)
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    // Add to end (most recently used)
    this.cache.set(key, value);
  }

  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete key from cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; hitRate: number; size: number; maxSize: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Template Cache Key
 */
export interface TemplateCacheKey {
  cvHash: string;
  templateId: string;
  highlightChanges?: string;
}

/**
 * Industry Cache Entry
 */
export interface IndustryCacheEntry {
  userId: string;
  industry: string;
  profile: any;
  timestamp: number;
}

/**
 * PDF Cache Entry
 */
export interface PDFCacheEntry {
  cvHash: string;
  templateId: string;
  buffer: Buffer;
  timestamp: number;
  size: number;
}

/**
 * Cache Statistics
 */
export interface CacheStats {
  templateCache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  };
  industryCache: {
    size: number;
    maxSize: number;
    entries: number;
  };
  pdfCache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
    totalBytes: number;
    maxBytes: number;
  };
}

/**
 * Caching Layer Service - Singleton
 */
class CachingLayerService {
  // Template rendering cache (LRU)
  private templateCache: LRUCache<string, string>;

  // Industry profile cache (per-user)
  private industryCache: Map<string, IndustryCacheEntry> = new Map();
  private maxIndustryCacheSize: number = 1000;
  private industryTTL: number = 3600000; // 1 hour

  // PDF cache (LRU)
  private pdfCache: LRUCache<string, PDFCacheEntry>;
  private totalPDFBytes: number = 0;
  private maxPDFBytes: number = 500 * 1024 * 1024; // 500MB

  constructor() {
    this.templateCache = new LRUCache<string, string>(50);
    this.pdfCache = new LRUCache<string, PDFCacheEntry>(20);
  }

  // ============================================
  // TEMPLATE CACHE METHODS
  // ============================================

  /**
   * Get cached template rendering
   */
  getTemplateCache(cvHash: string, templateId: string): string | undefined {
    const key = this.generateTemplateCacheKey(cvHash, templateId);
    return this.templateCache.get(key);
  }

  /**
   * Set template cache
   */
  setTemplateCache(cvHash: string, templateId: string, html: string): void {
    const key = this.generateTemplateCacheKey(cvHash, templateId);
    this.templateCache.set(key, html);
  }

  /**
   * Clear template cache
   */
  clearTemplateCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get template cache statistics
   */
  getTemplateCacheStats(): any {
    return this.templateCache.getStats();
  }

  // ============================================
  // INDUSTRY CACHE METHODS
  // ============================================

  /**
   * Get cached industry profile
   */
  getIndustryCache(userId: string, industry: string): any | undefined {
    const key = `${userId}:${industry}`;
    const entry = this.industryCache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.industryTTL) {
      this.industryCache.delete(key);
      return undefined;
    }

    return entry.profile;
  }

  /**
   * Set industry cache
   */
  setIndustryCache(userId: string, industry: string, profile: any): void {
    const key = `${userId}:${industry}`;

    // Check cache size
    if (this.industryCache.size >= this.maxIndustryCacheSize) {
      // Remove oldest entry
      let oldestKey: string | undefined;
      let oldestTime = Date.now();

      for (const [k, v] of this.industryCache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.industryCache.delete(oldestKey);
      }
    }

    this.industryCache.set(key, {
      userId,
      industry,
      profile,
      timestamp: Date.now()
    });
  }

  /**
   * Clear industry cache
   */
  clearIndustryCache(): void {
    this.industryCache.clear();
  }

  /**
   * Clear expired industry cache entries
   */
  clearExpiredIndustryCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.industryCache.entries()) {
      if (now - entry.timestamp > this.industryTTL) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.industryCache.delete(key);
    }
  }

  /**
   * Get industry cache statistics
   */
  getIndustryCacheStats(): any {
    return {
      size: this.industryCache.size,
      maxSize: this.maxIndustryCacheSize,
      entries: this.industryCache.size,
      ttl: this.industryTTL
    };
  }

  // ============================================
  // PDF CACHE METHODS
  // ============================================

  /**
   * Get cached PDF
   */
  getPDFCache(cvHash: string, templateId: string): Buffer | undefined {
    const key = this.generatePDFCacheKey(cvHash, templateId);
    const entry = this.pdfCache.get(key);
    return entry?.buffer;
  }

  /**
   * Set PDF cache
   */
  setPDFCache(cvHash: string, templateId: string, buffer: Buffer): void {
    const key = this.generatePDFCacheKey(cvHash, templateId);

    // Check if we need to evict based on size
    if (this.totalPDFBytes + buffer.length > this.maxPDFBytes) {
      this.evictPDFCache(buffer.length);
    }

    const entry: PDFCacheEntry = {
      cvHash,
      templateId,
      buffer,
      timestamp: Date.now(),
      size: buffer.length
    };

    this.pdfCache.set(key, entry);
    this.totalPDFBytes += buffer.length;
  }

  /**
   * Evict PDF cache entries to make room
   */
  private evictPDFCache(requiredSpace: number): void {
    // Simple strategy: remove oldest entries until we have enough space
    const stats = this.pdfCache.getStats();
    const entriesToRemove = Math.ceil(stats.size * 0.3); // Remove 30% of entries

    // Note: LRUCache doesn't expose entries, so we'll just clear if needed
    if (this.totalPDFBytes + requiredSpace > this.maxPDFBytes) {
      this.clearPDFCache();
      this.totalPDFBytes = 0;
    }
  }

  /**
   * Clear PDF cache
   */
  clearPDFCache(): void {
    this.pdfCache.clear();
    this.totalPDFBytes = 0;
  }

  /**
   * Get PDF cache statistics
   */
  getPDFCacheStats(): any {
    const stats = this.pdfCache.getStats();
    return {
      ...stats,
      totalBytes: this.totalPDFBytes,
      maxBytes: this.maxPDFBytes
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Generate template cache key
   */
  private generateTemplateCacheKey(cvHash: string, templateId: string): string {
    return `template:${cvHash}:${templateId}`;
  }

  /**
   * Generate PDF cache key
   */
  private generatePDFCacheKey(cvHash: string, templateId: string): string {
    return `pdf:${cvHash}:${templateId}`;
  }

  /**
   * Generate CV hash from JSON Resume
   */
  generateCVHash(cv: any): string {
    // Simple hash based on name and key fields
    const key = `${cv.basics?.name || ''}:${cv.work?.length || 0}:${cv.education?.length || 0}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.clearTemplateCache();
    this.clearIndustryCache();
    this.clearPDFCache();
  }

  /**
   * Get all cache statistics
   */
  getAllCacheStats(): CacheStats {
    return {
      templateCache: this.getTemplateCacheStats(),
      industryCache: this.getIndustryCacheStats(),
      pdfCache: this.getPDFCacheStats()
    };
  }

  /**
   * Invalidate cache for a specific CV
   */
  invalidateCVCache(cvHash: string): void {
    // This would require exposing more methods from LRUCache
    // For now, we can clear all caches
    this.clearAllCaches();
  }

  /**
   * Set cache TTL for industry cache
   */
  setIndustryTTL(ttl: number): void {
    this.industryTTL = ttl;
  }

  /**
   * Set max cache sizes
   */
  setMaxCacheSizes(templateSize: number, industrySize: number, pdfSize: number): void {
    // Would need to expose this in LRUCache
    this.maxIndustryCacheSize = industrySize;
    this.maxPDFBytes = pdfSize * 1024 * 1024; // Convert MB to bytes
  }

  /**
   * Get cache hit rate for templates
   */
  getTemplateCacheHitRate(): number {
    return this.templateCache.getHitRate();
  }

  /**
   * Get cache hit rate for PDFs
   */
  getPDFCacheHitRate(): number {
    return this.pdfCache.getHitRate();
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.templateCache.resetStats();
    this.pdfCache.resetStats();
  }
}

// Export singleton instance
export const cachingLayer = new CachingLayerService();

/**
 * Helper functions for cache management
 */
export function getCacheStats(): CacheStats {
  return cachingLayer.getAllCacheStats();
}

export function clearAllCaches(): void {
  cachingLayer.clearAllCaches();
}

export function generateCVHash(cv: any): string {
  return cachingLayer.generateCVHash(cv);
}
