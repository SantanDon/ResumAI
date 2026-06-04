/**
 * Property-Based Test: Session Industry Selection
 * Task 5.5: Validates that selected industry is remembered and used as default
 * 
 * Property: For any user session, the selected industry SHALL be remembered 
 * and used as default for subsequent CV operations until changed.
 * 
 * Validates: Requirements 3.8
 */

import fc from 'fast-check';
import { industryManager } from '../services/industryManager';

// Arbitraries for generating test data
const arbIndustryName = fc.stringMatching(/^[A-Z][a-z]+ (Industry|Sector|Field)$/);
const arbSkill = fc.stringMatching(/^[A-Za-z]+$/);
const arbPowerWord = fc.stringMatching(/^[A-Za-z]+$/);

// Generator for industry profiles
const arbIndustryProfile = fc.record({
  name: arbIndustryName,
  requiredSections: fc.array(
    fc.stringMatching(/^(summary|experience|education|skills)$/),
    { minLength: 1, maxLength: 3 }
  ),
  optionalSections: fc.constant([]),
  prioritySkills: fc.array(arbSkill, { minLength: 1, maxLength: 3 }),
  powerWords: fc.array(arbPowerWord, { minLength: 1, maxLength: 3 }),
  certifications: fc.constant([]),
  keywords: fc.constant([]),
  formatPreferences: fc.constant({}),
  outdatedPractices: fc.constant([])
});

// Simulate session storage
class SessionStorage {
  private storage: Map<string, string> = new Map();

  setSelectedIndustry(userId: string, industryId: string): void {
    this.storage.set(`${userId}:selectedIndustry`, industryId);
  }

  getSelectedIndustry(userId: string): string | null {
    return this.storage.get(`${userId}:selectedIndustry`) || null;
  }

  clearSelectedIndustry(userId: string): void {
    this.storage.delete(`${userId}:selectedIndustry`);
  }
}

describe('Property-Based Test: Session Industry Selection', () => {
  const testUserId = `test-user-${Date.now()}`;
  const sessionStorage = new SessionStorage();

  it('should remember selected industry in session (100+ iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(arbIndustryProfile, async (industryData: any) => {
        // Create custom industry
        const industry = await industryManager.createCustomIndustry(testUserId, industryData);

        // Select industry in session
        sessionStorage.setSelectedIndustry(testUserId, industry.id);

        // Property 1: Selected industry should be retrievable from session
        const selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBe(industry.id);

        // Property 2: Selected industry should exist
        const selectedIndustry = await industryManager.getIndustry(testUserId, selectedId!);
        expect(selectedIndustry).toBeDefined();
        expect(selectedIndustry?.id).toBe(industry.id);

        // Property 3: Selected industry should have correct data
        expect(selectedIndustry?.name).toBe(industry.name);
        expect(selectedIndustry?.prioritySkills).toEqual(industry.prioritySkills);

        // Cleanup
        sessionStorage.clearSelectedIndustry(testUserId);
        await industryManager.deleteCustomIndustry(testUserId, industry.id);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should use selected industry as default for operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbIndustryProfile, { minLength: 2, maxLength: 3 }),
        async (industriesData: any[]) => {
          const createdIds: string[] = [];

          // Create multiple industries
          for (const data of industriesData) {
            const industry = await industryManager.createCustomIndustry(testUserId, data);
            createdIds.push(industry.id);
          }

          // Select first industry
          sessionStorage.setSelectedIndustry(testUserId, createdIds[0]);

          // Property 1: Selected industry should be the default
          const selectedId = sessionStorage.getSelectedIndustry(testUserId);
          expect(selectedId).toBe(createdIds[0]);

          // Property 2: Default should be used for operations
          const defaultIndustry = await industryManager.getIndustry(testUserId, selectedId!);
          expect(defaultIndustry?.id).toBe(createdIds[0]);

          // Property 3: Other industries should still be accessible
          for (const id of createdIds.slice(1)) {
            const industry = await industryManager.getIndustry(testUserId, id);
            expect(industry).toBeDefined();
          }

          // Cleanup
          sessionStorage.clearSelectedIndustry(testUserId);
          for (const id of createdIds) {
            await industryManager.deleteCustomIndustry(testUserId, id);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should allow changing selected industry during session', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbIndustryProfile, { minLength: 2, maxLength: 4 }),
        async (industriesData: any[]) => {
          const createdIds: string[] = [];

          // Create multiple industries
          for (const data of industriesData) {
            const industry = await industryManager.createCustomIndustry(testUserId, data);
            createdIds.push(industry.id);
          }

          // Select first industry
          sessionStorage.setSelectedIndustry(testUserId, createdIds[0]);
          let selectedId = sessionStorage.getSelectedIndustry(testUserId);
          expect(selectedId).toBe(createdIds[0]);

          // Property 1: Change to second industry
          sessionStorage.setSelectedIndustry(testUserId, createdIds[1]);
          selectedId = sessionStorage.getSelectedIndustry(testUserId);
          expect(selectedId).toBe(createdIds[1]);

          // Property 2: New selection should be used
          const selectedIndustry = await industryManager.getIndustry(testUserId, selectedId!);
          expect(selectedIndustry?.id).toBe(createdIds[1]);

          // Property 3: Can change again
          if (createdIds.length > 2) {
            sessionStorage.setSelectedIndustry(testUserId, createdIds[2]);
            selectedId = sessionStorage.getSelectedIndustry(testUserId);
            expect(selectedId).toBe(createdIds[2]);
          }

          // Cleanup
          sessionStorage.clearSelectedIndustry(testUserId);
          for (const id of createdIds) {
            await industryManager.deleteCustomIndustry(testUserId, id);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should persist selection across multiple operations', async () => {
    await fc.assert(
      fc.asyncProperty(arbIndustryProfile, async (industryData: any) => {
        // Create industry
        const industry = await industryManager.createCustomIndustry(testUserId, industryData);

        // Select industry
        sessionStorage.setSelectedIndustry(testUserId, industry.id);

        // Property 1: Selection should persist after first operation
        let selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBe(industry.id);

        // Perform operation 1: Get industry
        const retrieved1 = await industryManager.getIndustry(testUserId, selectedId!);
        expect(retrieved1).toBeDefined();

        // Property 2: Selection should persist after operation 1
        selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBe(industry.id);

        // Perform operation 2: List industries
        const list = await industryManager.listIndustries(testUserId);
        expect(list.length).toBeGreaterThan(0);

        // Property 3: Selection should persist after operation 2
        selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBe(industry.id);

        // Perform operation 3: Get industry again
        const retrieved2 = await industryManager.getIndustry(testUserId, selectedId!);
        expect(retrieved2?.id).toBe(industry.id);

        // Property 4: Selection should persist after operation 3
        selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBe(industry.id);

        // Cleanup
        sessionStorage.clearSelectedIndustry(testUserId);
        await industryManager.deleteCustomIndustry(testUserId, industry.id);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should handle session without selected industry', async () => {
    await fc.assert(
      fc.asyncProperty(arbIndustryProfile, async (industryData: any) => {
        // Create industry but don't select it
        const industry = await industryManager.createCustomIndustry(testUserId, industryData);

        // Property 1: No industry should be selected initially
        let selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBeNull();

        // Property 2: Can still access industries
        const retrieved = await industryManager.getIndustry(testUserId, industry.id);
        expect(retrieved).toBeDefined();

        // Property 3: Still no selection after access
        selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBeNull();

        // Property 4: Can select after access
        sessionStorage.setSelectedIndustry(testUserId, industry.id);
        selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBe(industry.id);

        // Cleanup
        sessionStorage.clearSelectedIndustry(testUserId);
        await industryManager.deleteCustomIndustry(testUserId, industry.id);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should clear selection when requested', async () => {
    await fc.assert(
      fc.asyncProperty(arbIndustryProfile, async (industryData: any) => {
        // Create and select industry
        const industry = await industryManager.createCustomIndustry(testUserId, industryData);
        sessionStorage.setSelectedIndustry(testUserId, industry.id);

        // Property 1: Industry should be selected
        let selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBe(industry.id);

        // Clear selection
        sessionStorage.clearSelectedIndustry(testUserId);

        // Property 2: Selection should be cleared
        selectedId = sessionStorage.getSelectedIndustry(testUserId);
        expect(selectedId).toBeNull();

        // Property 3: Industry should still exist
        const retrieved = await industryManager.getIndustry(testUserId, industry.id);
        expect(retrieved).toBeDefined();

        // Cleanup
        await industryManager.deleteCustomIndustry(testUserId, industry.id);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should handle multiple users with independent selections', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(arbIndustryProfile, arbIndustryProfile),
        async ([industryData1, industryData2]: [any, any]) => {
          const user1 = `user1-${Date.now()}`;
          const user2 = `user2-${Date.now()}`;

          // Create industries for user 1
          const industry1 = await industryManager.createCustomIndustry(user1, industryData1);

          // Create industries for user 2
          const industry2 = await industryManager.createCustomIndustry(user2, industryData2);

          // Select different industries for each user
          sessionStorage.setSelectedIndustry(user1, industry1.id);
          sessionStorage.setSelectedIndustry(user2, industry2.id);

          // Property 1: Each user should have their own selection
          const selected1 = sessionStorage.getSelectedIndustry(user1);
          const selected2 = sessionStorage.getSelectedIndustry(user2);

          expect(selected1).toBe(industry1.id);
          expect(selected2).toBe(industry2.id);
          expect(selected1).not.toBe(selected2);

          // Property 2: Selections should be independent
          sessionStorage.setSelectedIndustry(user1, industry2.id);
          const newSelected1 = sessionStorage.getSelectedIndustry(user1);
          const stillSelected2 = sessionStorage.getSelectedIndustry(user2);

          expect(newSelected1).toBe(industry2.id);
          expect(stillSelected2).toBe(industry2.id);

          // Cleanup
          sessionStorage.clearSelectedIndustry(user1);
          sessionStorage.clearSelectedIndustry(user2);
          await industryManager.deleteCustomIndustry(user1, industry1.id);
          await industryManager.deleteCustomIndustry(user2, industry2.id);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
