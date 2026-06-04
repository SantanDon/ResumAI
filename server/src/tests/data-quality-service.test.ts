/**
 * Data Quality Service Tests
 * Tests for spelling, grammar, and format validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dataQualityService, validateCV, checkSpelling, correctSpelling } from '../services/dataQualityService';
import { JSONResume } from '../types/jsonResume';

// Sample CV for testing
const sampleCV: JSONResume = {
  basics: {
    name: 'John Doe',
    label: 'Software Engineer',
    image: '',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    url: 'https://johndoe.com',
    summary: 'Experienced software engineer with 5 years of experience',
    location: {
      address: '123 Main St',
      postalCode: '12345',
      city: 'San Francisco',
      countryCode: 'US',
      region: 'California'
    },
    profiles: []
  },
  work: [
    {
      name: 'Tech Company',
      position: 'Senior Engineer',
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      summary: 'Led development of key features',
      highlights: [
        'Achieved 50% performance improvement',
        'Led team of 5 engineers',
        'Delivered project on time'
      ],
      url: '',
      location: ''
    }
  ],
  education: [
    {
      institution: 'University of California',
      studyType: 'Bachelor',
      area: 'Computer Science',
      score: '3.8',
      startDate: '2016-09-01',
      endDate: '2020-05-31',
      courses: []
    }
  ],
  skills: [
    {
      name: 'Programming',
      level: 'Expert',
      keywords: ['JavaScript', 'TypeScript', 'Python']
    }
  ],
  languages: [],
  projects: [],
  certificates: [],
  publications: [],
  volunteer: [],
  interests: [],
  references: []
};

describe('Data Quality Service - Spelling', () => {
  it('should detect spelling errors', () => {
    const text = 'I achived great responsibilites in managment';
    const errors = checkSpelling(text);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.word === 'achived')).toBe(true);
  });

  it('should suggest corrections', () => {
    const text = 'I achived great results';
    const errors = checkSpelling(text);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].suggestions).toContain('achieved');
  });

  it('should correct spelling in text', () => {
    const text = 'I achived great responsibilites';
    const corrected = correctSpelling(text);
    
    expect(corrected).toContain('achieved');
    expect(corrected).toContain('responsibilities');
  });

  it('should handle case-insensitive corrections', () => {
    const text = 'I ACHIVED great results';
    const corrected = correctSpelling(text);
    
    expect(corrected.toLowerCase()).toContain('achieved');
  });

  it('should not flag correct spelling', () => {
    const text = 'I achieved great responsibilities';
    const errors = checkSpelling(text);
    
    expect(errors.length).toBe(0);
  });
});

describe('Data Quality Service - Format Validation', () => {
  it('should validate email format', () => {
    const cv = { ...sampleCV };
    cv.basics.email = 'invalid-email';
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field === 'basics.email')).toBe(true);
  });

  it('should accept valid email format', () => {
    const cv = { ...sampleCV };
    cv.basics.email = 'john@example.com';
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field === 'basics.email')).toBe(false);
  });

  it('should validate phone format', () => {
    const cv = { ...sampleCV };
    cv.basics.phone = '123'; // Too short
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field === 'basics.phone')).toBe(true);
  });

  it('should accept valid phone format', () => {
    const cv = { ...sampleCV };
    cv.basics.phone = '+1 (555) 123-4567';
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field === 'basics.phone')).toBe(false);
  });

  it('should validate date format', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].startDate = 'invalid-date';
    }
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field.includes('startDate'))).toBe(true);
  });

  it('should accept valid date formats', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].startDate = '2020-01-01';
    }
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field.includes('startDate'))).toBe(false);
  });

  it('should accept MM/DD/YYYY date format', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].startDate = '01/15/2020';
    }
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field.includes('startDate'))).toBe(false);
  });

  it('should accept MM/YYYY date format', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].startDate = '01/2020';
    }
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field.includes('startDate'))).toBe(false);
  });

  it('should accept Present as date', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].endDate = 'Present';
    }
    
    const result = validateCV(cv);
    expect(result.formatIssues.some(i => i.field.includes('endDate'))).toBe(false);
  });
});

describe('Data Quality Service - Duplicates', () => {
  it('should detect duplicate work experience', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work.push(cv.work[0]);
    }
    
    const result = validateCV(cv);
    expect(result.duplicates.length).toBeGreaterThan(0);
  });

  it('should detect duplicate education', () => {
    const cv = { ...sampleCV };
    if (cv.education) {
      cv.education.push(cv.education[0]);
    }
    
    const result = validateCV(cv);
    expect(result.duplicates.length).toBeGreaterThan(0);
  });

  it('should detect duplicate skills', () => {
    const cv = { ...sampleCV };
    if (cv.skills) {
      cv.skills.push(cv.skills[0]);
    }
    
    const result = validateCV(cv);
    expect(result.duplicates.length).toBeGreaterThan(0);
  });

  it('should remove duplicates', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work.push(cv.work[0]);
    }
    
    const deduped = dataQualityService.deduplicateContent(cv);
    expect(deduped.work?.length).toBe(1);
  });
});

describe('Data Quality Service - Normalization', () => {
  it('should normalize dates to ISO format', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].startDate = '01/15/2020';
    }
    
    const normalized = dataQualityService.normalizeFormatting(cv);
    expect(normalized.work?.[0].startDate).toBe('2020-01-15');
  });

  it('should correct spelling during normalization', () => {
    const cv = { ...sampleCV };
    if (cv.basics) {
      cv.basics.summary = 'I achived great responsibilites';
    }
    
    const normalized = dataQualityService.normalizeFormatting(cv);
    expect(normalized.basics?.summary).toContain('achieved');
  });

  it('should correct spelling in highlights', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].highlights = ['Achived great results'];
    }
    
    const normalized = dataQualityService.normalizeFormatting(cv);
    expect(normalized.work?.[0].highlights?.[0]).toContain('achieved');
  });
});

describe('Data Quality Service - Content Optimization', () => {
  it('should limit summary to 150 words', () => {
    const cv = { ...sampleCV };
    const longSummary = Array(200).fill('word').join(' ');
    if (cv.basics) {
      cv.basics.summary = longSummary;
    }
    
    const optimized = dataQualityService.optimizeLength(cv);
    const wordCount = optimized.basics?.summary?.split(/\s+/).length || 0;
    expect(wordCount).toBeLessThanOrEqual(151); // 150 words + ellipsis
  });

  it('should limit highlights to 5 per job', () => {
    const cv = { ...sampleCV };
    if (cv.work) {
      cv.work[0].highlights = Array(10).fill('Achievement');
    }
    
    const optimized = dataQualityService.optimizeLength(cv);
    expect(optimized.work?.[0].highlights?.length).toBeLessThanOrEqual(5);
  });
});

describe('Data Quality Service - Placeholder Detection', () => {
  it('should detect placeholder text', () => {
    const cv = { ...sampleCV };
    if (cv.basics) {
      cv.basics.summary = '[Your summary here]';
    }
    
    const hasPlaceholder = dataQualityService.hasPlaceholderText(cv);
    expect(hasPlaceholder).toBe(true);
  });

  it('should find placeholder locations', () => {
    const cv = { ...sampleCV };
    if (cv.basics) {
      cv.basics.summary = '[Your summary here]';
    }
    
    const placeholders = dataQualityService.findPlaceholderText(cv);
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('should not flag normal text as placeholder', () => {
    // Create a minimal clean CV without any placeholder-like text
    const cv: JSONResume = {
      basics: {
        name: 'John Doe',
        label: 'Software Engineer',
        image: '',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        url: 'https://johndoe.com',
        summary: 'Experienced software engineer with 5 years of experience',
        location: {
          address: '123 Main St',
          postalCode: '12345',
          city: 'San Francisco',
          countryCode: 'US',
          region: 'California'
        },
        profiles: []
      },
      work: [],
      education: [],
      skills: [],
      languages: [],
      projects: [],
      certificates: [],
      publications: [],
      volunteer: [],
      interests: [],
      references: []
    };
    
    const hasPlaceholder = dataQualityService.hasPlaceholderText(cv);
    expect(hasPlaceholder).toBe(false);
  });
});

describe('Data Quality Service - Validation', () => {
  it('should validate complete CV', () => {
    const result = validateCV(sampleCV);
    
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('spellingErrors');
    expect(result).toHaveProperty('formatIssues');
    expect(result).toHaveProperty('duplicates');
    expect(result).toHaveProperty('suggestions');
  });

  it('should calculate quality score', () => {
    const result = validateCV(sampleCV);
    
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should mark valid CV as valid', () => {
    // Create a minimal clean CV
    const cv: JSONResume = {
      basics: {
        name: 'John Doe',
        label: 'Software Engineer',
        image: '',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        url: 'https://johndoe.com',
        summary: 'Experienced software engineer',
        location: {
          address: '123 Main St',
          postalCode: '12345',
          city: 'San Francisco',
          countryCode: 'US',
          region: 'California'
        },
        profiles: []
      },
      work: [],
      education: [],
      skills: [],
      languages: [],
      projects: [],
      certificates: [],
      publications: [],
      volunteer: [],
      interests: [],
      references: []
    };
    
    const result = validateCV(cv);
    expect(result.valid).toBe(true);
  });

  it('should mark invalid CV as invalid', () => {
    const cv = { ...sampleCV };
    cv.basics.email = 'invalid-email';
    
    const result = validateCV(cv);
    expect(result.valid).toBe(false);
  });

  it('should provide suggestions', () => {
    const cv = { ...sampleCV };
    cv.basics.email = 'invalid-email';
    
    const result = validateCV(cv);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

describe('Data Quality Service - Power Words', () => {
  it('should identify power words in text', () => {
    const text = 'I achieved great results and led the team';
    const suggestions = dataQualityService.getPowerWordSuggestions(text);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('achieved');
    expect(suggestions).toContain('led');
  });

  it('should not flag weak verbs as power words', () => {
    const text = 'I did some work and made changes';
    const suggestions = dataQualityService.getPowerWordSuggestions(text);
    
    expect(suggestions).not.toContain('did');
    expect(suggestions).not.toContain('made');
  });
});

describe('Data Quality Service - Quality Metrics', () => {
  it('should calculate quality metrics', () => {
    const metrics = dataQualityService.getQualityMetrics(sampleCV);
    
    expect(metrics).toHaveProperty('completeness');
    expect(metrics).toHaveProperty('consistency');
    expect(metrics).toHaveProperty('clarity');
    expect(metrics).toHaveProperty('impact');
  });

  it('should return metrics between 0 and 100', () => {
    const metrics = dataQualityService.getQualityMetrics(sampleCV);
    
    expect(metrics.completeness).toBeGreaterThanOrEqual(0);
    expect(metrics.completeness).toBeLessThanOrEqual(100);
    expect(metrics.consistency).toBeGreaterThanOrEqual(0);
    expect(metrics.consistency).toBeLessThanOrEqual(100);
    expect(metrics.clarity).toBeGreaterThanOrEqual(0);
    expect(metrics.clarity).toBeLessThanOrEqual(100);
    expect(metrics.impact).toBeGreaterThanOrEqual(0);
    expect(metrics.impact).toBeLessThanOrEqual(100);
  });

  it('should rate complete CV higher', () => {
    const incompleteCv = { ...sampleCV };
    incompleteCv.work = [];
    
    const completeMetrics = dataQualityService.getQualityMetrics(sampleCV);
    const incompleteMetrics = dataQualityService.getQualityMetrics(incompleteCv);
    
    expect(completeMetrics.completeness).toBeGreaterThan(incompleteMetrics.completeness);
  });
});
