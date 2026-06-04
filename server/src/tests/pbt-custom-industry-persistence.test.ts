/**
 * Property-Based Test: Custom Industry Persistence
 * Task 3.3: Validates that custom industries persist and can be retrieved
 * 
 * Property: For any custom industry created by a user, it SHALL be retrievable 
 * in subsequent sessions and applicable to CV generation.
 * 
 * Validates: Requirements 3.3, 4.2
 */

import fc from 'fast-check';
import { industryManager, IndustryProfile } from '../services/industryManager';

// Arbitraries for generating test data
const arbIndustryName = fc.stringMatching(/^[A-Z][a-z]+ (Industry|Sector|Field)$/);
const arbSkill = fc.stringMatching(/^[A-Za-z]+$/);
const arbPowerWord = fc.stringMatching(/^[A-Za-z]+$/);
const arbSection = fc.stringMatching(/^(summary|experience|education|skills|projects|certifications)$/);

// Generator for custom industry profiles
const arbCustomIndustry = fc.record({
  name: arbIndustryName,
  requiredSections: fc.array(arbSection, { minLength: 1, maxLength: 4 }),
  optionalSections: fc.array(arbSection, { minLength: 0, maxLength: 3 }),
  prioritySkills: fc.array(arbSkill, { minLength: 1, maxLength: 5 }),
  powerWords: fc.array(arbPowerWord, { minLength: 1, maxLength: 5 }),
  certifications: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 }),
  keywords: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
  formatPreferences: fc.record({
    summaryLength: fc.integer({ min: 50, max: 500 }),
    bulletPointsPerJob: fc.integer({ min: 2, max: 8 }),
    skillsFormat: fc.oneof(fc.constant('categories'), fc.constant('list'))
  }),
  outdatedPractices: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 })
});

describe('Property-Based Test: Custom Industry Persistence', () => {
  const testUserId = `test-user-${Date.now()}`;

  it('should persist and retrieve custom industries (100+ iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(arbCustomIndustry, async (industryData: any) => {
        // Create custom industry
        const created = await industryManager.createCustomIndustry(testUserId, industryData);

        // Property 1: Created industry should have an ID
        expect(created.id).toBeDefined();
        expect(created.id.length).toBeGreaterThan(0);

        // Property 2: Created industry should have all provided fields
        expect(created.name).toBe(industryData.name);
        expect(created.requiredSections).toEqual(industryData.requiredSections);
        expect(created.optionalSections).toEqual(industryData.optionalSections);
        expect(created.prioritySkills).toEqual(industryData.prioritySkills);
        expect(created.powerWords).toEqual(industryData.powerWords);

        // Property 3: Should be marked as custom
        expect(created.isCustom).toBe(true);

        // Property 4: Should have userId
        expect(created.userId).toBe(testUserId);

        // Property 5: Should have timestamps
        expect(created.createdAt).toBeDefined();
        expect(created.updatedAt).toBeDefined();

        // Property 6: Should be retrievable by ID
        const retrieved = await industryManager.getIndustry(testUserId, created.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);

        // Property 7: Retrieved data should match created data
        expect(retrieved?.name).toBe(created.name);
        expect(retrieved?.requiredSections).toEqual(created.requiredSections);
        expect(retrieved?.prioritySkills).toEqual(created.prioritySkills);
        expect(retrieved?.powerWords).toEqual(created.powerWords);

        // Property 8: Should appear in list of industries
        const industries = await industryManager.listIndustries(testUserId);
        const found = industries.find(i => i.id === created.id);
        expect(found).toBeDefined();
        expect(found?.name).toBe(created.name);

        // Property 9: Should be retrievable multiple times with same result
        const retrieved2 = await industryManager.getIndustry(testUserId, created.id);
        expect(retrieved2?.id).toBe(retrieved?.id);
        expect(retrieved2?.name).toBe(retrieved?.name);

        // Property 10: Should not be retrievable by other users
        const otherUserId = `other-user-${Date.now()}`;
        const notFound = await industryManager.getIndustry(otherUserId, created.id);
        expect(notFound).toBeNull();

        // Cleanup
        await industryManager.deleteCustomIndustry(testUserId, created.id);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should update custom industries and persist changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(arbCustomIndustry, arbCustomIndustry),
        async ([industryData1, industryData2]: [any, any]) => {
          // Create initial industry
          const created = await industryManager.createCustomIndustry(testUserId, industryData1);

          // Update with new data
          const updated = await industryManager.updateCustomIndustry(testUserId, created.id, {
            name: industryData2.name,
            powerWords: industryData2.powerWords
          });

          // Property 1: Updated industry should have new values
          expect(updated.name).toBe(industryData2.name);
          expect(updated.powerWords).toEqual(industryData2.powerWords);

          // Property 2: ID should remain the same
          expect(updated.id).toBe(created.id);

          // Property 3: Updated timestamp should be newer
          expect(new Date(updated.updatedAt!).getTime())
            .toBeGreaterThanOrEqual(new Date(created.updatedAt!).getTime());

          // Property 4: Changes should persist
          const retrieved = await industryManager.getIndustry(testUserId, created.id);
          expect(retrieved?.name).toBe(industryData2.name);
          expect(retrieved?.powerWords).toEqual(industryData2.powerWords);

          // Property 5: Unchanged fields should remain
          expect(retrieved?.requiredSections).toEqual(created.requiredSections);

          // Cleanup
          await industryManager.deleteCustomIndustry(testUserId, created.id);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should delete custom industries and remove from persistence', async () => {
    await fc.assert(
      fc.asyncProperty(arbCustomIndustry, async (industryData: any) => {
        // Create industry
        const created = await industryManager.createCustomIndustry(testUserId, industryData);
        const industryId = created.id;

        // Verify it exists
        let retrieved = await industryManager.getIndustry(testUserId, industryId);
        expect(retrieved).toBeDefined();

        // Delete it
        await industryManager.deleteCustomIndustry(testUserId, industryId);

        // Property 1: Should not be retrievable after deletion
        retrieved = await industryManager.getIndustry(testUserId, industryId);
        expect(retrieved).toBeNull();

        // Property 2: Should not appear in list
        const industries = await industryManager.listIndustries(testUserId);
        const found = industries.find(i => i.id === industryId);
        expect(found).toBeUndefined();

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should list all industries including custom ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbCustomIndustry, { minLength: 1, maxLength: 3 }),
        async (industriesData: any[]) => {
          const createdIds: string[] = [];

          // Create multiple industries
          for (const data of industriesData) {
            const created = await industryManager.createCustomIndustry(testUserId, data);
            createdIds.push(created.id);
          }

          // List all industries
          const industries = await industryManager.listIndustries(testUserId);

          // Property 1: Should include predefined industries
          const predefined = industryManager.getPredefinedIndustries();
          expect(industries.length).toBeGreaterThanOrEqual(predefined.length);

          // Property 2: Should include all created custom industries
          for (const id of createdIds) {
            const found = industries.find(i => i.id === id);
            expect(found).toBeDefined();
          }

          // Property 3: Custom industries should be marked as custom
          for (const id of createdIds) {
            const industry = industries.find(i => i.id === id);
            expect(industry?.isCustom).toBe(true);
          }

          // Property 4: Should have correct count
          const customCount = industries.filter(i => i.isCustom).length;
          expect(customCount).toBe(createdIds.length);

          // Cleanup
          for (const id of createdIds) {
            await industryManager.deleteCustomIndustry(testUserId, id);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle concurrent operations on same industry', async () => {
    await fc.assert(
      fc.asyncProperty(arbCustomIndustry, async (industryData: any) => {
        // Create industry
        const created = await industryManager.createCustomIndustry(testUserId, industryData);

        // Property 1: Multiple concurrent reads should work
        const reads = await Promise.all([
          industryManager.getIndustry(testUserId, created.id),
          industryManager.getIndustry(testUserId, created.id),
          industryManager.getIndustry(testUserId, created.id)
        ]);

        for (const read of reads) {
          expect(read?.id).toBe(created.id);
        }

        // Property 2: Multiple concurrent lists should work
        const lists = await Promise.all([
          industryManager.listIndustries(testUserId),
          industryManager.listIndustries(testUserId),
          industryManager.listIndustries(testUserId)
        ]);

        for (const list of lists) {
          const found = list.find(i => i.id === created.id);
          expect(found).toBeDefined();
        }

        // Cleanup
        await industryManager.deleteCustomIndustry(testUserId, created.id);

        return true;
      }),
      { numRuns: 30 }
    );
  });

  it('should preserve all fields through persistence cycle', async () => {
    await fc.assert(
      fc.asyncProperty(arbCustomIndustry, async (industryData: any) => {
        // Create industry
        const created = await industryManager.createCustomIndustry(testUserId, industryData);

        // Retrieve and verify all fields
        const retrieved = await industryManager.getIndustry(testUserId, created.id);

        // Property 1: All string fields should match
        expect(retrieved?.name).toBe(created.name);

        // Property 2: All array fields should match
        expect(retrieved?.requiredSections).toEqual(created.requiredSections);
        expect(retrieved?.optionalSections).toEqual(created.optionalSections);
        expect(retrieved?.prioritySkills).toEqual(created.prioritySkills);
        expect(retrieved?.powerWords).toEqual(created.powerWords);
        expect(retrieved?.certifications).toEqual(created.certifications);
        expect(retrieved?.keywords).toEqual(created.keywords);
        expect(retrieved?.outdatedPractices).toEqual(created.outdatedPractices);

        // Property 3: Object fields should match
        expect(retrieved?.formatPreferences).toEqual(created.formatPreferences);

        // Property 4: Metadata should be present
        expect(retrieved?.isCustom).toBe(true);
        expect(retrieved?.userId).toBe(testUserId);
        expect(retrieved?.createdAt).toBeDefined();
        expect(retrieved?.updatedAt).toBeDefined();

        // Cleanup
        await industryManager.deleteCustomIndustry(testUserId, created.id);

        return true;
      }),
      { numRuns: 50 }
    );
  });
});
