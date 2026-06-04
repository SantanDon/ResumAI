/**
 * Property-Based Test: Industry Validation
 * Task 3.5: Validates that invalid industry profiles are rejected
 * 
 * Property: For any custom industry creation attempt, the system SHALL reject 
 * industries missing required fields (name, at least one priority skill).
 * 
 * Validates: Requirements 3.5, 4.4
 */

import fc from 'fast-check';
import { industryManager } from '../services/industryManager';

// Arbitraries for generating test data
const arbValidName = fc.stringMatching(/^[A-Z][a-z]+ (Industry|Sector|Field)$/);
const arbInvalidName = fc.oneof(
  fc.constant(''),
  fc.constant('   '),
  fc.string({ minLength: 101, maxLength: 200 })
);
const arbValidSkill = fc.stringMatching(/^[A-Za-z]+$/);
const arbValidPowerWord = fc.stringMatching(/^[A-Za-z]+$/);

describe('Property-Based Test: Industry Validation', () => {
  const testUserId = `test-user-${Date.now()}`;

  it('should reject industries with missing name (100+ iterations)', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined)),
          prioritySkills: fc.array(arbValidSkill, { minLength: 1, maxLength: 3 }),
          requiredSections: fc.constant(['summary', 'experience']),
          optionalSections: fc.constant([]),
          powerWords: fc.array(arbValidPowerWord, { maxLength: 3 }),
          certifications: fc.constant([]),
          keywords: fc.constant([]),
          formatPreferences: fc.constant({}),
          outdatedPractices: fc.constant([])
        } as any),
        (industryData: any) => {
          // Validate
          const validation = industryManager.validateIndustry(industryData);

          // Property 1: Should be invalid
          expect(validation.valid).toBe(false);

          // Property 2: Should have error about name
          expect(validation.errors.length).toBeGreaterThan(0);
          expect(validation.errors.some(e => e.includes('name'))).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject industries with empty priority skills (100+ iterations)', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: arbValidName,
          prioritySkills: fc.oneof(
            fc.constant([]),
            fc.constant(null),
            fc.constant(undefined)
          ),
          requiredSections: fc.constant(['summary', 'experience']),
          optionalSections: fc.constant([]),
          powerWords: fc.array(arbValidPowerWord, { maxLength: 3 }),
          certifications: fc.constant([]),
          keywords: fc.constant([]),
          formatPreferences: fc.constant({}),
          outdatedPractices: fc.constant([])
        } as any),
        (industryData: any) => {
          // Validate
          const validation = industryManager.validateIndustry(industryData);

          // Property 1: Should be invalid
          expect(validation.valid).toBe(false);

          // Property 2: Should have error about priority skills
          expect(validation.errors.length).toBeGreaterThan(0);
          expect(validation.errors.some(e => e.includes('priority skill'))).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject industries with name exceeding max length', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 101, maxLength: 200 }),
          prioritySkills: fc.array(arbValidSkill, { minLength: 1, maxLength: 3 }),
          requiredSections: fc.constant(['summary', 'experience']),
          optionalSections: fc.constant([]),
          powerWords: fc.array(arbValidPowerWord, { maxLength: 3 }),
          certifications: fc.constant([]),
          keywords: fc.constant([]),
          formatPreferences: fc.constant({}),
          outdatedPractices: fc.constant([])
        } as any),
        (industryData: any) => {
          // Validate
          const validation = industryManager.validateIndustry(industryData);

          // Property 1: Should be invalid
          expect(validation.valid).toBe(false);

          // Property 2: Should have error about name length
          expect(validation.errors.length).toBeGreaterThan(0);
          expect(validation.errors.some(e => e.includes('less than 100'))).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept valid industries with all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: arbValidName,
          prioritySkills: fc.array(arbValidSkill, { minLength: 1, maxLength: 5 }),
          requiredSections: fc.array(
            fc.stringMatching(/^(summary|experience|education|skills)$/),
            { minLength: 1, maxLength: 4 }
          ),
          optionalSections: fc.array(
            fc.stringMatching(/^(projects|certifications|languages)$/),
            { maxLength: 3 }
          ),
          powerWords: fc.array(arbValidPowerWord, { maxLength: 5 }),
          certifications: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 }),
          keywords: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
          formatPreferences: fc.record({
            summaryLength: fc.integer({ min: 50, max: 500 }),
            bulletPointsPerJob: fc.integer({ min: 2, max: 8 }),
            skillsFormat: fc.oneof(fc.constant('categories'), fc.constant('list'))
          }),
          outdatedPractices: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 })
        } as any),
        (industryData: any) => {
          // Validate
          const validation = industryManager.validateIndustry(industryData);

          // Property 1: Should be valid
          expect(validation.valid).toBe(true);

          // Property 2: Should have no errors
          expect(validation.errors.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept industries with only required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: arbValidName,
          prioritySkills: fc.array(arbValidSkill, { minLength: 1, maxLength: 3 })
        } as any),
        (industryData: any) => {
          // Validate
          const validation = industryManager.validateIndustry(industryData);

          // Property 1: Should be valid
          expect(validation.valid).toBe(true);

          // Property 2: Should have no errors
          expect(validation.errors.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject creation of invalid industries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.oneof(fc.constant(''), fc.constant(null)),
          prioritySkills: fc.array(arbValidSkill, { minLength: 1, maxLength: 3 })
        } as any),
        async (industryData: any) => {
          // Attempt to create invalid industry
          try {
            await industryManager.createCustomIndustry(testUserId, industryData);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Property 1: Should throw error
            expect(error).toBeDefined();

            // Property 2: Error should mention validation
            expect((error as Error).message).toContain('Invalid');
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject update with invalid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: arbValidName,
          prioritySkills: fc.array(arbValidSkill, { minLength: 1, maxLength: 3 })
        } as any),
        async (industryData: any) => {
          // Create valid industry
          const created = await industryManager.createCustomIndustry(testUserId, industryData);

          // Attempt to update with invalid data
          try {
            await industryManager.updateCustomIndustry(testUserId, created.id, {
              name: '',
              prioritySkills: []
            });
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Property 1: Should throw error
            expect(error).toBeDefined();

            // Property 2: Error should mention validation
            expect((error as Error).message).toContain('Invalid');
          }

          // Cleanup
          await industryManager.deleteCustomIndustry(testUserId, created.id);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should provide detailed validation errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.constant(''),
          prioritySkills: fc.constant([]),
          requiredSections: fc.constant([]),
          optionalSections: fc.constant([]),
          powerWords: fc.constant([]),
          certifications: fc.constant([]),
          keywords: fc.constant([]),
          formatPreferences: fc.constant({}),
          outdatedPractices: fc.constant([])
        } as any),
        (industryData: any) => {
          // Validate
          const validation = industryManager.validateIndustry(industryData);

          // Property 1: Should be invalid
          expect(validation.valid).toBe(false);

          // Property 2: Should have multiple errors
          expect(validation.errors.length).toBeGreaterThanOrEqual(2);

          // Property 3: Errors should be descriptive
          for (const error of validation.errors) {
            expect(error.length).toBeGreaterThan(0);
            expect(typeof error).toBe('string');
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle edge cases in validation', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant({}),
          fc.constant({ name: null }),
          fc.constant({ prioritySkills: null })
        ),
        (industryData: any) => {
          // Validate - should not throw
          const validation = industryManager.validateIndustry(industryData);

          // Property 1: Should return valid result object
          expect(validation).toBeDefined();
          expect(validation.valid).toBeDefined();
          expect(validation.errors).toBeDefined();
          expect(Array.isArray(validation.errors)).toBe(true);

          // Property 2: Invalid data should fail validation
          if (industryData === null || industryData === undefined || Object.keys(industryData).length === 0) {
            expect(validation.valid).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
