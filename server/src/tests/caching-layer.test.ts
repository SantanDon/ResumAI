/**
 * Caching Layer Tests
 * Tests for LRU cache, template cache, industry cache, and PDF cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache, cachingLayer, generateCVHash } from '../services/cachingLayer';
import { performanceOptimizer } from '../services/performanceOptimizer';

describe('LRUCache', () => {
  let cache: LRUCache<string, string>;

  beforeEach(() => {
    cache = new LRUCache<string, string>(3);
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should evict least recently used item when full', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    // Cache is full, adding new item should evict key1
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key4')).toBe('value4');
  });

  it('should move accessed item to end (most recently used)', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    // Access key1, making it most recently used
    cache.get('key1');
    
    // Add new item, should evict key2 (least recently used)
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeUndefined();
  });

  it('should track cache hits and misses', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // hit
    cache.get('key2'); // miss
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('should calculate hit rate correctly', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // hit
    cache.get('key1'); // hit
    cache.get('key2'); // miss
    
    const hitRate = cache.getHitRate();
    expect(hitRate).toBeCloseTo(66.67, 1);
  });

  it('should clear cache', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    
    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should check if key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);
  });

  it('should delete key', () => {
    cache.set('key1', 'value1');
    const deleted = cache.delete('key1');
    
    expect(deleted).toBe(true);
    expect(cache.has('key1')).toBe(false);
  });

  it('should return correct size', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    expect(cache.size()).toBe(2);
  });
});

describe('Caching Layer - Template Cache', () => {
  beforeEach(() => {
    cachingLayer.clearTemplateCache();
  });

  it('should cache template rendering', () => {
    const cvHash = 'test-hash-123';
    const templateId = 'harvard';
    const html = '<html>Test CV</html>';
    
    cachingLayer.setTemplateCache(cvHash, templateId, html);
    const cached = cachingLayer.getTemplateCache(cvHash, templateId);
    
    expect(cached).toBe(html);
  });

  it('should return undefined for uncached template', () => {
    const cached = cachingLayer.getTemplateCache('nonexistent', 'harvard');
    expect(cached).toBeUndefined();
  });

  it('should track template cache statistics', () => {
    const cvHash = 'test-hash-123';
    const templateId = 'harvard';
    const html = '<html>Test CV</html>';
    
    cachingLayer.setTemplateCache(cvHash, templateId, html);
    cachingLayer.getTemplateCache(cvHash, templateId); // hit
    cachingLayer.getTemplateCache('other', 'harvard'); // miss
    
    const stats = cachingLayer.getTemplateCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('should clear template cache', () => {
    cachingLayer.setTemplateCache('hash1', 'harvard', '<html>Test</html>');
    cachingLayer.clearTemplateCache();
    
    const cached = cachingLayer.getTemplateCache('hash1', 'harvard');
    expect(cached).toBeUndefined();
  });
});

describe('Caching Layer - Industry Cache', () => {
  beforeEach(() => {
    cachingLayer.clearIndustryCache();
  });

  it('should cache industry profile', () => {
    const userId = 'user-123';
    const industry = 'technology';
    const profile = { skills: ['JavaScript', 'TypeScript'] };
    
    cachingLayer.setIndustryCache(userId, industry, profile);
    const cached = cachingLayer.getIndustryCache(userId, industry);
    
    expect(cached).toEqual(profile);
  });

  it('should return undefined for uncached industry', () => {
    const cached = cachingLayer.getIndustryCache('user-123', 'nonexistent');
    expect(cached).toBeUndefined();
  });

  it('should expire industry cache entries', async () => {
    const userId = 'user-123';
    const industry = 'technology';
    const profile = { skills: ['JavaScript'] };
    
    cachingLayer.setIndustryTTL(100); // 100ms TTL
    cachingLayer.setIndustryCache(userId, industry, profile);
    
    // Should be cached immediately
    expect(cachingLayer.getIndustryCache(userId, industry)).toEqual(profile);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should be expired
    expect(cachingLayer.getIndustryCache(userId, industry)).toBeUndefined();
  });

  it('should track industry cache statistics', () => {
    const stats = cachingLayer.getIndustryCacheStats();
    
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxSize');
    expect(stats).toHaveProperty('entries');
    expect(stats).toHaveProperty('ttl');
  });

  it('should clear industry cache', () => {
    cachingLayer.setIndustryCache('user-123', 'technology', { skills: [] });
    cachingLayer.clearIndustryCache();
    
    const cached = cachingLayer.getIndustryCache('user-123', 'technology');
    expect(cached).toBeUndefined();
  });
});

describe('Caching Layer - PDF Cache', () => {
  beforeEach(() => {
    cachingLayer.clearPDFCache();
  });

  it('should cache PDF buffer', () => {
    const cvHash = 'test-hash-123';
    const templateId = 'harvard';
    const buffer = Buffer.from('PDF content');
    
    cachingLayer.setPDFCache(cvHash, templateId, buffer);
    const cached = cachingLayer.getPDFCache(cvHash, templateId);
    
    expect(cached).toEqual(buffer);
  });

  it('should return undefined for uncached PDF', () => {
    const cached = cachingLayer.getPDFCache('nonexistent', 'harvard');
    expect(cached).toBeUndefined();
  });

  it('should track PDF cache statistics', () => {
    const buffer = Buffer.from('PDF content');
    cachingLayer.setPDFCache('hash1', 'harvard', buffer);
    
    const stats = cachingLayer.getPDFCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxSize');
    expect(stats).toHaveProperty('totalBytes');
    expect(stats.totalBytes).toBe(buffer.length);
  });

  it('should clear PDF cache', () => {
    const buffer = Buffer.from('PDF content');
    cachingLayer.setPDFCache('hash1', 'harvard', buffer);
    cachingLayer.clearPDFCache();
    
    const cached = cachingLayer.getPDFCache('hash1', 'harvard');
    expect(cached).toBeUndefined();
  });
});

describe('Caching Layer - CV Hash Generation', () => {
  it('should generate consistent hash for same CV', () => {
    const cv = {
      basics: { name: 'John Doe' },
      work: [{ position: 'Engineer' }],
      education: [{ institution: 'MIT' }]
    };
    
    const hash1 = generateCVHash(cv);
    const hash2 = generateCVHash(cv);
    
    expect(hash1).toBe(hash2);
  });

  it('should generate different hash for different CVs', () => {
    const cv1 = {
      basics: { name: 'John Doe' },
      work: [{ position: 'Engineer' }],
      education: []
    };
    
    const cv2 = {
      basics: { name: 'Jane Smith' },
      work: [{ position: 'Designer' }],
      education: []
    };
    
    const hash1 = generateCVHash(cv1);
    const hash2 = generateCVHash(cv2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should handle missing fields gracefully', () => {
    const cv = { basics: { name: 'John Doe' } };
    const hash = generateCVHash(cv);
    
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });
});

describe('Caching Layer - All Caches', () => {
  beforeEach(() => {
    cachingLayer.clearAllCaches();
  });

  it('should clear all caches', () => {
    cachingLayer.setTemplateCache('hash1', 'harvard', '<html>Test</html>');
    cachingLayer.setIndustryCache('user1', 'tech', { skills: [] });
    cachingLayer.setPDFCache('hash1', 'harvard', Buffer.from('PDF'));
    
    cachingLayer.clearAllCaches();
    
    expect(cachingLayer.getTemplateCache('hash1', 'harvard')).toBeUndefined();
    expect(cachingLayer.getIndustryCache('user1', 'tech')).toBeUndefined();
    expect(cachingLayer.getPDFCache('hash1', 'harvard')).toBeUndefined();
  });

  it('should get all cache statistics', () => {
    const stats = cachingLayer.getAllCacheStats();
    
    expect(stats).toHaveProperty('templateCache');
    expect(stats).toHaveProperty('industryCache');
    expect(stats).toHaveProperty('pdfCache');
  });
});

describe('Performance Optimizer', () => {
  beforeEach(() => {
    performanceOptimizer.resetStats();
  });

  it('should record metrics', () => {
    performanceOptimizer.recordMetrics({
      renderTime: 100,
      pdfGenerationTime: 500,
      totalGenerationTime: 600,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash1'
    });
    
    const metrics = performanceOptimizer.getMetrics();
    expect(metrics.length).toBe(1);
    expect(metrics[0].renderTime).toBe(100);
  });

  it('should calculate average render time', () => {
    performanceOptimizer.recordMetrics({
      renderTime: 100,
      pdfGenerationTime: 500,
      totalGenerationTime: 600,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash1'
    });
    
    performanceOptimizer.recordMetrics({
      renderTime: 200,
      pdfGenerationTime: 500,
      totalGenerationTime: 700,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash2'
    });
    
    const avg = performanceOptimizer.getAverageRenderTime();
    expect(avg).toBe(150);
  });

  it('should calculate cache hit rate', () => {
    performanceOptimizer.recordMetrics({
      renderTime: 100,
      pdfGenerationTime: 500,
      totalGenerationTime: 600,
      cacheHit: true,
      templateId: 'harvard',
      cvHash: 'hash1'
    });
    
    performanceOptimizer.recordMetrics({
      renderTime: 100,
      pdfGenerationTime: 500,
      totalGenerationTime: 600,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash2'
    });
    
    const hitRate = performanceOptimizer.getCacheHitRate();
    expect(hitRate).toBe(50);
  });

  it('should generate performance report', () => {
    performanceOptimizer.recordMetrics({
      renderTime: 100,
      pdfGenerationTime: 500,
      totalGenerationTime: 600,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash1'
    });
    
    const report = performanceOptimizer.generateReport();
    
    expect(report).toHaveProperty('averageRenderTime');
    expect(report).toHaveProperty('averagePDFTime');
    expect(report).toHaveProperty('averageTotalTime');
    expect(report).toHaveProperty('templateCacheHitRate');
    expect(report).toHaveProperty('cacheStats');
  });

  it('should check performance targets', () => {
    performanceOptimizer.recordMetrics({
      renderTime: 1000,
      pdfGenerationTime: 1500,
      totalGenerationTime: 2500,
      cacheHit: true,
      templateId: 'harvard',
      cvHash: 'hash1'
    });
    
    const targets = performanceOptimizer.checkPerformanceTargets();
    
    expect(targets).toHaveProperty('renderTime');
    expect(targets).toHaveProperty('pdfTime');
    expect(targets).toHaveProperty('cacheHitRate');
  });

  it('should get percentiles', () => {
    for (let i = 0; i < 100; i++) {
      performanceOptimizer.recordMetrics({
        renderTime: 100 + i * 10,
        pdfGenerationTime: 500,
        totalGenerationTime: 600 + i * 10,
        cacheHit: false,
        templateId: 'harvard',
        cvHash: `hash${i}`
      });
    }
    
    const percentiles = performanceOptimizer.getPercentiles();
    
    expect(percentiles.p50).toBeLessThan(percentiles.p75);
    expect(percentiles.p75).toBeLessThan(percentiles.p90);
    expect(percentiles.p90).toBeLessThan(percentiles.p95);
    expect(percentiles.p95).toBeLessThan(percentiles.p99);
  });

  it('should get slowest operations', () => {
    performanceOptimizer.recordMetrics({
      renderTime: 100,
      pdfGenerationTime: 500,
      totalGenerationTime: 600,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash1'
    });
    
    performanceOptimizer.recordMetrics({
      renderTime: 200,
      pdfGenerationTime: 1000,
      totalGenerationTime: 1200,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash2'
    });
    
    const slowest = performanceOptimizer.getSlowestOperations(1);
    expect(slowest[0].totalGenerationTime).toBe(1200);
  });

  it('should clear metrics', () => {
    performanceOptimizer.recordMetrics({
      renderTime: 100,
      pdfGenerationTime: 500,
      totalGenerationTime: 600,
      cacheHit: false,
      templateId: 'harvard',
      cvHash: 'hash1'
    });
    
    performanceOptimizer.clearMetrics();
    
    const metrics = performanceOptimizer.getMetrics();
    expect(metrics.length).toBe(0);
  });
});
