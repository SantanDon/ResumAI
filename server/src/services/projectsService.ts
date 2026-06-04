/**
 * Projects Service
 * Manages user's portfolio projects for CV inclusion
 * 
 * Format: name, brief description (1-2 sentences), tech stack, URL
 * Example: "DocketDive: South African Legal AI Assistant - Simplifies law for researchers, students, and public. Built with React, TypeScript, Vercel"
 */

import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

interface ProjectData {
  name: string;
  description: string; // 1-2 sentences max
  technologies: string[];
  url?: string;
  highlights?: string[];
}

class ProjectsService {
  /**
   * Add a new project
   */
  addProject(userId: string, project: ProjectData): string {
    try {
      const id = uuidv4();
      
      // Validate description length (1-2 sentences, roughly 50-200 chars)
      if (project.description.length < 20 || project.description.length > 300) {
        throw new Error('Description should be 1-2 sentences (20-300 characters)');
      }

      const stmt = db.prepare(`
        INSERT INTO projects (
          id, user_id, name, description, tech_stack, url, highlights
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        userId,
        project.name,
        project.description,
        JSON.stringify(project.technologies),
        project.url || null,
        project.highlights ? JSON.stringify(project.highlights) : null
      );

      return id;
    } catch (error) {
      console.error('[ProjectsService] Error adding project:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  getUserProjects(userId: string): ProjectData[] {
    try {
      const stmt = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC');
      const results = stmt.all(userId) as any[];

      return results.map(result => ({
        name: result.name,
        description: result.description,
        technologies: JSON.parse(result.tech_stack),
        url: result.url,
        highlights: result.highlights ? JSON.parse(result.highlights) : undefined
      }));
    } catch (error) {
      console.error('[ProjectsService] Error getting user projects:', error);
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string) {
    try {
      const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
      const result = stmt.get(projectId) as any;

      if (result) {
        return {
          id: result.id,
          name: result.name,
          description: result.description,
          technologies: JSON.parse(result.tech_stack),
          url: result.url,
          highlights: result.highlights ? JSON.parse(result.highlights) : undefined,
          createdAt: result.created_at,
          updatedAt: result.updated_at
        };
      }
      return null;
    } catch (error) {
      console.error('[ProjectsService] Error getting project:', error);
      throw error;
    }
  }

  /**
   * Update project
   */
  updateProject(projectId: string, updates: Partial<ProjectData>): boolean {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Validate description if provided
      if (updates.description && (updates.description.length < 20 || updates.description.length > 300)) {
        throw new Error('Description should be 1-2 sentences (20-300 characters)');
      }

      const stmt = db.prepare(`
        UPDATE projects SET
          name = ?,
          description = ?,
          tech_stack = ?,
          url = ?,
          highlights = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        updates.name || project.name,
        updates.description || project.description,
        updates.technologies ? JSON.stringify(updates.technologies) : JSON.stringify(project.technologies),
        updates.url || project.url || null,
        updates.highlights ? JSON.stringify(updates.highlights) : null,
        projectId
      );

      return true;
    } catch (error) {
      console.error('[ProjectsService] Error updating project:', error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  deleteProject(projectId: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(projectId);
      return result.changes > 0;
    } catch (error) {
      console.error('[ProjectsService] Error deleting project:', error);
      throw error;
    }
  }

  /**
   * Format project for CV display
   * Example: "DocketDive: South African Legal AI Assistant - Simplifies law for researchers, students, and public. Built with React, TypeScript, Vercel"
   */
  formatForCV(project: ProjectData): string {
    const techStack = project.technologies.join(', ');
    return `${project.name}: ${project.description} Built with ${techStack}${project.url ? ` - ${project.url}` : ''}`;
  }

  /**
   * Get projects matching job skills
   * Returns projects that use technologies mentioned in job requirements
   */
  getMatchingProjects(userId: string, jobSkills: string[]): ProjectData[] {
    try {
      const allProjects = this.getUserProjects(userId);
      
      return allProjects.filter(project => {
        // Check if any project technology matches job skills
        return project.technologies.some(tech =>
          jobSkills.some(skill =>
            skill.toLowerCase().includes(tech.toLowerCase()) ||
            tech.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    } catch (error) {
      console.error('[ProjectsService] Error getting matching projects:', error);
      throw error;
    }
  }

  /**
   * Initialize with Demo projects
   */
  initializeDemoProjects(userId: string): void {
    try {
      // Check if projects already exist
      const existing = this.getUserProjects(userId);
      if (existing.length > 0) {
        return; // Already initialized
      }

      // Add DocketDive
      this.addProject(userId, {
        name: 'DocketDive',
        description: 'South African Legal AI Assistant that simplifies law for researchers, students, and public. Cuts burnout for legal professionals.',
        technologies: ['React', 'TypeScript', 'Vercel', 'AI/ML'],
        url: 'https://docketdive.vercel.app/',
        highlights: ['Legal document analysis', 'AI-powered simplification', 'Multi-user support']
      });

      // Add StudyPod
      this.addProject(userId, {
        name: 'StudyPod',
        description: 'Learning platform designed to help students collaborate and learn effectively. Features interactive study sessions and progress tracking.',
        technologies: ['React', 'Node.js', 'MongoDB', 'Vercel'],
        url: 'https://studypod-lm.vercel.app/',
        highlights: ['Collaborative learning', 'Progress tracking', 'Study sessions']
      });
    } catch (error) {
      console.error('[ProjectsService] Error initializing demo projects:', error);
      // Don't throw - this is optional initialization
    }
  }
}

export const projectsService = new ProjectsService();
