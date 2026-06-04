/**
 * Performance Optimizer Service
 * Tracks metrics, manages caching, and optimizes CV generation performance
 */

import { cachingLayer, generateCVHash, CacheStats } from './cachingLayer';
import { JSONResume } from '../types/jsonResume';

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  renderTime: number; // ms
  pdfGenerationTime: number; // ms
  totalGenerationTime: number; // ms
  cacheHit: boolean;
  templateId: string;
  cvHash: string;
  timestamp: number;
}

/**
 * Performance Report
 */
export interface PerformanceReport {
  averageRenderTime: number;
  averagePDFTime: number;
  averageTotalTime: number;
  templateCacheHitRate: number;
  pdfCacheHitRate: number;
  totalOperations: number;
  metricsCollected: number;
  cacheStats: CacheStats;
}

/**
 * Performance Optimizer Service - Singleton
 */
class PerformanceOptimizerService {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsSize: number = 1000;
  private operationCount: number = 0;

  constructor() {
    // Initialize
  }

  // ============================================
  // METRICS TRACKING
  // ============================================

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetrics);
    this.operationCount++;

    // Keep metrics array bounded
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific template
   */
  getMetricsForTemplate(templateId: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.templateId === templateId);
  }

  /**
   * Get metrics for a specific CV
   */
  getMetricsForCV(cvHash: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.cvHash === cvHash);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.operationCount = 0;
  }

  // ============================================
  // PERFORMANCE ANALYSIS
  // ============================================

  /**
   * Calculate average render time
   */
  getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.renderTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Calculate average PDF generation time
   */
  getAveragePDFTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.pdfGenerationTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Calculate average total generation time
   */
  getAverageTotalTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.totalGenerationTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Calculate cache hit rate
   */
  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const hits = this.metrics.filter(m => m.cacheHit).length;
    return (hits / this.metrics.length) * 100;
  }

  /**
   * Get performance percentiles
   */
  getPercentiles(): {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  } {
    if (this.metrics.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    const times = this.metrics.map(m => m.totalGenerationTime).sort((a, b) => a - b);
    const len = times.length;

    return {
      p50: times[Math.floor(len * 0.5)],
      p75: times[Math.floor(len * 0.75)],
      p90: times[Math.floor(len * 0.9)],
      p95: times[Math.floor(len * 0.95)],
      p99: times[Math.floor(len * 0.99)]
    };
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.totalGenerationTime - a.totalGenerationTime)
      .slice(0, limit);
  }

  /**
   * Get fastest operations
   */
  getFastestOperations(limit: number = 10): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => a.totalGenerationTime - b.totalGenerationTime)
      .slice(0, limit);
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return cachingLayer.getAllCacheStats();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    cachingLayer.clearAllCaches();
  }

  /**
   * Clear template cache
   */
  clearTemplateCache(): void {
    cachingLayer.clearTemplateCache();
  }

  /**
   * Clear industry cache
   */
  clearIndustryCache(): void {
    cachingLayer.clearIndustryCache();
  }

  /**
   * Clear PDF cache
   */
  clearPDFCache(): void {
    cachingLayer.clearPDFCache();
  }

  /**
   * Get template cache hit rate
   */
  getTemplateCacheHitRate(): number {
    return cachingLayer.getTemplateCacheHitRate();
  }

  /**
   * Get PDF cache hit rate
   */
  getPDFCacheHitRate(): number {
    return cachingLayer.getPDFCacheHitRate();
  }

  // ============================================
  // PERFORMANCE REPORTING
  // ============================================

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const cacheStats = this.getCacheStats();

    return {
      averageRenderTime: this.getAverageRenderTime(),
      averagePDFTime: this.getAveragePDFTime(),
      averageTotalTime: this.getAverageTotalTime(),
      templateCacheHitRate: this.getTemplateCacheHitRate(),
      pdfCacheHitRate: this.getPDFCacheHitRate(),
      totalOperations: this.operationCount,
      metricsCollected: this.metrics.length,
      cacheStats
    };
  }

  /**
   * Check if performance targets are met
   */
  checkPerformanceTargets(): {
    renderTime: boolean; // < 1.5s
    pdfTime: boolean; // < 2s
    cacheHitRate: boolean; // > 80%
  } {
    return {
      renderTime: this.getAverageRenderTime() < 1500,
      pdfTime: this.getAveragePDFTime() < 2000,
      cacheHitRate: this.getCacheHitRate() > 80
    };
  }

  /**
   * Get performance summary
   */
  getSummary(): string {
    const report = this.generateReport();
    const targets = this.checkPerformanceTargets();

    return `
Performance Summary
===================
Average Render Time: ${report.averageRenderTime.toFixed(2)}ms ${targets.renderTime ? '✓' : '✗'}
Average PDF Time: ${report.averagePDFTime.toFixed(2)}ms ${targets.pdfTime ? '✓' : '✗'}
Average Total Time: ${report.averageTotalTime.toFixed(2)}ms
Template Cache Hit Rate: ${report.templateCacheHitRate.toFixed(2)}% ${targets.cacheHitRate ? '✓' : '✗'}
PDF Cache Hit Rate: ${report.pdfCacheHitRate.toFixed(2)}%
Total Operations: ${report.totalOperations}
Metrics Collected: ${report.metricsCollected}

Cache Statistics
================
Template Cache: ${report.cacheStats.templateCache.size}/${report.cacheStats.templateCache.maxSize} (${report.cacheStats.templateCache.hitRate.toFixed(2)}% hit rate)
Industry Cache: ${report.cacheStats.industryCache.size}/${report.cacheStats.industryCache.maxSize}
PDF Cache: ${report.cacheStats.pdfCache.size}/${report.cacheStats.pdfCache.maxSize} (${report.cacheStats.pdfCache.totalBytes / 1024 / 1024}MB / ${report.cacheStats.pdfCache.maxBytes / 1024 / 1024}MB)
    `;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        summary: {
          averageRenderTime: this.getAverageRenderTime(),
          averagePDFTime: this.getAveragePDFTime(),
          averageTotalTime: this.getAverageTotalTime(),
          cacheHitRate: this.getCacheHitRate(),
          percentiles: this.getPercentiles(),
          totalOperations: this.operationCount
        }
      },
      null,
      2
    );
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.clearMetrics();
    cachingLayer.resetStats();
  }

  /**
   * Get operation count
   */
  getOperationCount(): number {
    return this.operationCount;
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizerService();

/**
 * Helper functions
 */
export function recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
  performanceOptimizer.recordMetrics(metrics);
}

export function getPerformanceReport(): PerformanceReport {
  return performanceOptimizer.generateReport();
}

export function checkPerformanceTargets(): {
  renderTime: boolean;
  pdfTime: boolean;
  cacheHitRate: boolean;
} {
  return performanceOptimizer.checkPerformanceTargets();
}

export function getPerformanceSummary(): string {
  return performanceOptimizer.getSummary();
}
