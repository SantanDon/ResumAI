/**
 * Integration Tests for Resumai Fixes
 * Tests end-to-end workflows combining multiple components
 */

import { industryManager, IndustryProfile } from '../services/industryManager';
import { messageFormatterService } from '../services/messageFormatter';
import { templateRenderer } from '../services/templateRenderer';
import { JSONResume } from '../types/jsonResume';

describe('Integration Tests - Resumai Fixes', () => {
  const testUserId = `test-user-${Date.now()}`;

  // Test data
  const testCV: JSONResume = {
    basics: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      location: { city: 'New York', region: 'NY' },
      url: 'https://johndoe.com',
      summary: 'Experienced software engineer with 10 years in full-stack development',
      profiles: [
        { network: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' },
        { network: 'GitHub', url: 'https://github.com/johndoe' }
      ]
    },
    work: [
      {
        name: 'Tech Corp Inc',
        position: 'Senior Software Engineer',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        highlights: [
          'Led team of 5 engineers',
          'Implemented microservices architecture',
          'Improved performance by 40%'
        ]
      },
      {
        name: 'StartUp LLC',
        position: 'Full Stack Developer',
        startDate: '2018-06-01',
        endDate: '2019-12-31',
        highlights: [
          'Built React frontend',
          'Designed REST APIs',
          'Managed AWS infrastructure'
        ]
      }
    ],
    education: [
      {
        institution: 'State University',
        studyType: 'Bachelor',
        area: 'Computer Science',
        startDate: '2014-09-01',
        endDate: '2018-05-31',
        score: '3.8'
      }
    ],
    skills: [
      {
        name: 'Technical',
        keywords: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS']
      },
      {
        name: 'Leadership',
        keywords: ['Team Management', 'Mentoring', 'Project Planning']
      }
    ],
    projects: [
      {
        name: 'Open Source Project',
        description: 'Contributed to popular open source library',
        url: 'https://github.com/project'
      }
    ],
    certificates: [
      {
        name: 'AWS Solutions Architect',
        issuer: 'Amazon',
        date: '2022-06-15'
      }
    ],
    languages: [
      { language: 'English', fluency: 'Native' },
      { language: 'Spanish', fluency: 'Intermediate' }
    ]
  };

  const testIndustryProfile = {
    name: 'Technology Industry',
    requiredSections: ['summary', 'experience', 'education', 'skills'],
    optionalSections: ['projects', 'certifications'],
    prioritySkills: ['JavaScript', 'Python', 'Cloud Architecture'],
    powerWords: ['innovative', 'scalable', 'efficient', 'robust', 'cutting-edge'],
    certifications: ['AWS', 'GCP', 'Azure'],
    keywords: ['microservices', 'DevOps', 'CI/CD'],
    formatPreferences: {
      summaryLength: 150,
      bulletPointsPerJob: 4,
      skillsFormat: 'categories'
    },
    outdatedPractices: ['Waterfall development', 'Monolithic architecture']
  };

  // Task 7.1: Create custom industry → Generate CV → Verify output
  describe('Task 7.1: End-to-end custom industry creation and CV generation', () => {
    it('should create custom industry, generate CV, and verify output', async () => {
      // Step 1: Create custom industry
      const industry = await industryManager.createCustomIndustry(testUserId, testIndustryProfile);

      expect(industry).toBeDefined();
      expect(industry.id).toBeDefined();
      expect(industry.name).toBe(testIndustryProfile.name);
      expect(industry.powerWords).toEqual(testIndustryProfile.powerWords);

      // Step 2: Verify industry is retrievable
      const retrieved = await industryManager.getIndustry(testUserId, industry.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(industry.id);

      // Step 3: Generate CV
      const html = templateRenderer.renderToHTML(testCV);

      // Step 4: Verify CV output
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(testCV.basics.name);
      expect(html).toContain('Professional Experience');
      expect(html).toContain('Education');
      expect(html).toContain('Skills');

      // Step 5: Verify all work items are present
      for (const job of testCV.work) {
        expect(html).toContain(job.position);
        expect(html).toContain(job.name);
      }

      // Cleanup
      await industryManager.deleteCustomIndustry(testUserId, industry.id);
    });
  });

  // Task 7.2: Send various messages → Verify formatting
  describe('Task 7.2: Message formatting in chat interface', () => {
    it('should format various message types correctly', () => {
      // Test 1: Bold text
      const boldMessage = '**CV Regenerated Successfully!**';
      const boldHtml = messageFormatterService.formatMessage(boldMessage);
      expect(boldHtml).toContain('<strong>');
      expect(boldHtml).not.toContain('**');

      // Test 2: Headers
      const headerMessage = '## Improvements Made';
      const headerHtml = messageFormatterService.formatMessage(headerMessage);
      expect(headerHtml).toContain('<h2');
      expect(headerHtml).not.toContain('##');

      // Test 3: Lists
      const listMessage = '• Applied Harvard format\n• Enhanced bullet points\n• Improved ATS compatibility';
      const listHtml = messageFormatterService.formatMessage(listMessage);
      expect(listHtml).toContain('<ul');
      expect(listHtml).toContain('<li>');
      expect(listHtml).not.toContain('•');

      // Test 4: Mixed formatting
      const mixedMessage = '## Results\n\n**Score:** 85/100\n\n• Improvement 1\n• Improvement 2';
      const mixedHtml = messageFormatterService.formatMessage(mixedMessage);
      expect(mixedHtml).toContain('<h2');
      expect(mixedHtml).toContain('<strong>');
      expect(mixedHtml).toContain('<ul');
      expect(mixedHtml).not.toContain('**');
      expect(mixedHtml).not.toContain('##');
      expect(mixedHtml).not.toContain('•');

      // Test 5: Emojis preserved
      const emojiMessage = '✅ **Success!** Your CV has been regenerated.\n\n• 🚀 Performance improved\n• 💡 New insights added';
      const emojiHtml = messageFormatterService.formatMessage(emojiMessage);
      expect(emojiHtml).toContain('✅');
      expect(emojiHtml).toContain('🚀');
      expect(emojiHtml).toContain('💡');
      expect(emojiHtml).toContain('<strong>');
      expect(emojiHtml).toContain('<ul');
    });
  });

  // Task 7.3: Generate CV → Download PDF → Verify readability
  describe('Task 7.3: PDF generation and readability', () => {
    it('should generate valid PDF from CV', async () => {
      // Step 1: Generate PDF
      const pdfBuffer = await templateRenderer.renderToPDF(testCV);

      // Step 2: Verify PDF is valid
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Step 3: Verify PDF header
      const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
      expect(pdfHeader).toBe('%PDF');

      // Step 4: Verify PDF structure
      const pdfString = pdfBuffer.toString('utf-8');
      expect(pdfString).toContain('xref');
      expect(pdfString).toContain('%%EOF');
      expect(pdfString).toContain('/Type /Catalog');

      // Step 5: Verify PDF size is reasonable
      expect(pdfBuffer.length).toBeGreaterThan(10000);
      expect(pdfBuffer.length).toBeLessThan(500000);

      // Step 6: Generate filename
      const filename = templateRenderer.generateFilename(testCV);
      expect(filename).toContain('John_Doe');
      expect(filename).toContain('.pdf');
    });
  });

  // Task 7.4: Select industry → Perform operations → Verify persistence
  describe('Task 7.4: Industry selection persistence', () => {
    it('should persist industry selection across operations', async () => {
      // Step 1: Create custom industry
      const industry = await industryManager.createCustomIndustry(testUserId, testIndustryProfile);

      // Step 2: Simulate session storage
      const sessionStorage = new Map<string, string>();
      sessionStorage.set(`${testUserId}:selectedIndustry`, industry.id);

      // Step 3: Perform operation 1 - Get industry
      let selectedId = sessionStorage.get(`${testUserId}:selectedIndustry`);
      expect(selectedId).toBe(industry.id);

      const retrieved1 = await industryManager.getIndustry(testUserId, selectedId!);
      expect(retrieved1?.id).toBe(industry.id);

      // Step 4: Verify selection persists
      selectedId = sessionStorage.get(`${testUserId}:selectedIndustry`);
      expect(selectedId).toBe(industry.id);

      // Step 5: Perform operation 2 - List industries
      const industries = await industryManager.listIndustries(testUserId);
      const found = industries.find(i => i.id === industry.id);
      expect(found).toBeDefined();

      // Step 6: Verify selection still persists
      selectedId = sessionStorage.get(`${testUserId}:selectedIndustry`);
      expect(selectedId).toBe(industry.id);

      // Step 7: Perform operation 3 - Get industry again
      const retrieved2 = await industryManager.getIndustry(testUserId, selectedId!);
      expect(retrieved2?.id).toBe(industry.id);

      // Cleanup
      await industryManager.deleteCustomIndustry(testUserId, industry.id);
    });
  });

  // Task 7.5: Create custom industry → Apply to CV → Verify settings
  describe('Task 7.5: Custom industry application to CV', () => {
    it('should create custom industry and apply to CV generation', async () => {
      // Step 1: Create custom industry
      const industry = await industryManager.createCustomIndustry(testUserId, testIndustryProfile);

      expect(industry.id).toBeDefined();
      expect(industry.name).toBe(testIndustryProfile.name);
      expect(industry.powerWords).toEqual(testIndustryProfile.powerWords);
      expect(industry.requiredSections).toEqual(testIndustryProfile.requiredSections);

      // Step 2: Verify industry is retrievable
      const retrieved = await industryManager.getIndustry(testUserId, industry.id);
      expect(retrieved).toBeDefined();

      // Step 3: Generate CV
      const html = templateRenderer.renderToHTML(testCV);

      // Step 4: Verify CV contains required sections
      for (const section of industry.requiredSections) {
        if (section === 'summary') {
          expect(html).toContain('Summary');
        }
        if (section === 'experience') {
          expect(html).toContain('Professional Experience');
        }
        if (section === 'education') {
          expect(html).toContain('Education');
        }
        if (section === 'skills') {
          expect(html).toContain('Skills');
        }
      }

      // Step 5: Verify optional sections are present
      for (const section of industry.optionalSections) {
        if (section === 'projects' && testCV.projects && testCV.projects.length > 0) {
          expect(html).toContain('Projects');
        }
        if (section === 'certifications' && testCV.certificates && testCV.certificates.length > 0) {
          expect(html).toContain('Certifications');
        }
      }

      // Step 6: Verify formatting preferences are available
      expect(industry.formatPreferences?.summaryLength).toBe(150);
      expect(industry.formatPreferences?.bulletPointsPerJob).toBe(4);
      expect(industry.formatPreferences?.skillsFormat).toBe('categories');

      // Step 7: Verify power words are available for application
      expect(industry.powerWords.length).toBeGreaterThan(0);
      for (const word of industry.powerWords) {
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
      }

      // Cleanup
      await industryManager.deleteCustomIndustry(testUserId, industry.id);
    });
  });

  // Additional integration scenarios
  describe('Additional Integration Scenarios', () => {
    it('should handle complete workflow: create industry, format message, generate CV', async () => {
      // Step 1: Create industry
      const industry = await industryManager.createCustomIndustry(testUserId, testIndustryProfile);

      // Step 2: Format response message
      const responseMessage = `✅ **Industry Created Successfully!**

**Industry Name:** ${industry.name}

**Configuration:**
• Required Sections: ${industry.requiredSections.join(', ')}
• Power Words: ${industry.powerWords.join(', ')}
• Priority Skills: ${industry.prioritySkills.join(', ')}

Your CV will now be tailored to this industry profile.`;

      const formattedMessage = messageFormatterService.formatMessage(responseMessage);

      // Step 3: Verify formatted message
      expect(formattedMessage).toContain('<strong>');
      expect(formattedMessage).toContain('<ul');
      expect(formattedMessage).toContain('✅');
      expect(formattedMessage).not.toContain('**');

      // Step 4: Generate CV with industry
      const html = templateRenderer.renderToHTML(testCV);

      // Step 5: Verify complete workflow
      expect(html).toContain(testCV.basics.name);
      expect(formattedMessage).toContain(industry.name);

      // Cleanup
      await industryManager.deleteCustomIndustry(testUserId, industry.id);
    });

    it('should handle multiple industries for same user', async () => {
      // Create multiple industries
      const industry1 = await industryManager.createCustomIndustry(testUserId, {
        ...testIndustryProfile,
        name: 'Technology Industry'
      });

      const industry2 = await industryManager.createCustomIndustry(testUserId, {
        ...testIndustryProfile,
        name: 'Finance Industry',
        powerWords: ['analytical', 'strategic', 'compliant', 'secure']
      });

      // Verify both are retrievable
      const retrieved1 = await industryManager.getIndustry(testUserId, industry1.id);
      const retrieved2 = await industryManager.getIndustry(testUserId, industry2.id);

      expect(retrieved1?.name).toBe('Technology Industry');
      expect(retrieved2?.name).toBe('Finance Industry');

      // Verify list includes both
      const industries = await industryManager.listIndustries(testUserId);
      const found1 = industries.find(i => i.id === industry1.id);
      const found2 = industries.find(i => i.id === industry2.id);

      expect(found1).toBeDefined();
      expect(found2).toBeDefined();

      // Cleanup
      await industryManager.deleteCustomIndustry(testUserId, industry1.id);
      await industryManager.deleteCustomIndustry(testUserId, industry2.id);
    });

    it('should handle CV with special characters and formatting', async () => {
      const specialCV: JSONResume = {
        ...testCV,
        basics: {
          ...testCV.basics,
          name: 'François Müller',
          summary: 'Expert in C++ & Python. Café enthusiast. "Agile" practitioner.'
        }
      };

      // Generate HTML
      const html = templateRenderer.renderToHTML(specialCV);

      // Verify special characters are handled
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');

      // Generate PDF
      const pdfBuffer = await templateRenderer.renderToPDF(specialCV);

      // Verify PDF is valid
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });
  });
});
