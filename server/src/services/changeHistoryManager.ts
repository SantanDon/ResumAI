/**
 * Change History Manager Service
 * Manages CV change history for undo/restore functionality
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { 
  JSONResume, 
  DeltaChange, 
  ChangeHistoryEntry, 
  ChangeType 
} from '../types/jsonResume';

const MAX_HISTORY_ENTRIES = 50;

interface DBHistoryEntry {
  id: string;
  cv_id: string;
  change_type: string;
  changes: string | null;
  previous_state: string;
  new_state: string;
  score_before: number | null;
  score_after: number | null;
  created_at: string;
}

class ChangeHistoryManagerService {
  /**
   * Record a change to the history
   */
  recordChange(
    cvId: string,
    changeType: ChangeType,
    previousState: JSONResume,
    newState: JSONResume,
    changes: DeltaChange[] | null = null,
    scoreBefore: number = 0,
    scoreAfter: number = 0
  ): string {
    const id = uuidv4();
    
    try {
      const stmt = db.prepare(`
        INSERT INTO cv_change_history (
          id, cv_id, change_type, changes, previous_state, new_state, 
          score_before, score_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        cvId,
        changeType,
        changes ? JSON.stringify(changes) : null,
        JSON.stringify(previousState),
        JSON.stringify(newState),
        scoreBefore,
        scoreAfter,
        new Date().toISOString()
      );

      // Prune old entries if needed
      this.pruneHistory(cvId, MAX_HISTORY_ENTRIES);

      return id;
    } catch (error) {
      console.error('Error recording change history:', error);
      throw error;
    }
  }

  /**
   * Get change history for a CV
   */
  getHistory(cvId: string, limit: number = MAX_HISTORY_ENTRIES): ChangeHistoryEntry[] {
    try {
      const stmt = db.prepare(`
        SELECT * FROM cv_change_history 
        WHERE cv_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `);

      const rows = stmt.all(cvId, limit) as DBHistoryEntry[];
      
      return rows.map(row => this.dbRowToEntry(row));
    } catch (error) {
      console.error('Error fetching change history:', error);
      return [];
    }
  }

  /**
   * Get a specific history entry
   */
  getHistoryEntry(historyId: string): ChangeHistoryEntry | null {
    try {
      const stmt = db.prepare('SELECT * FROM cv_change_history WHERE id = ?');
      const row = stmt.get(historyId) as DBHistoryEntry | undefined;
      
      return row ? this.dbRowToEntry(row) : null;
    } catch (error) {
      console.error('Error fetching history entry:', error);
      return null;
    }
  }

  /**
   * Undo the last change (return to previous state)
   */
  undo(cvId: string): JSONResume | null {
    const history = this.getHistory(cvId, 1);
    
    if (history.length === 0) {
      return null;
    }

    const lastChange = history[0];
    
    // Record the undo as a restore operation
    this.recordChange(
      cvId,
      'restore',
      lastChange.newState,
      lastChange.previousState,
      null,
      lastChange.qualityScoreAfter,
      lastChange.qualityScoreBefore
    );

    return lastChange.previousState;
  }

  /**
   * Restore to a specific history entry
   */
  restore(cvId: string, historyId: string): JSONResume | null {
    const entry = this.getHistoryEntry(historyId);
    
    if (!entry || entry.cvId !== cvId) {
      return null;
    }

    // Get current state for recording
    const currentHistory = this.getHistory(cvId, 1);
    const currentState = currentHistory.length > 0 
      ? currentHistory[0].newState 
      : entry.newState;

    // Record the restore operation
    this.recordChange(
      cvId,
      'restore',
      currentState,
      entry.previousState,
      null,
      0,
      entry.qualityScoreBefore
    );

    return entry.previousState;
  }

  /**
   * Prune history to keep only the most recent entries
   */
  pruneHistory(cvId: string, keepCount: number): void {
    try {
      // Get IDs to keep
      const keepStmt = db.prepare(`
        SELECT id FROM cv_change_history 
        WHERE cv_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      const keepIds = keepStmt.all(cvId, keepCount) as { id: string }[];
      
      if (keepIds.length === 0) return;

      const idsToKeep = keepIds.map(r => r.id);
      
      // Delete entries not in the keep list
      const deleteStmt = db.prepare(`
        DELETE FROM cv_change_history 
        WHERE cv_id = ? AND id NOT IN (${idsToKeep.map(() => '?').join(',')})
      `);
      
      deleteStmt.run(cvId, ...idsToKeep);
    } catch (error) {
      console.error('Error pruning history:', error);
    }
  }

  /**
   * Get history count for a CV
   */
  getHistoryCount(cvId: string): number {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM cv_change_history WHERE cv_id = ?');
      const result = stmt.get(cvId) as { count: number };
      return result.count;
    } catch (error) {
      console.error('Error getting history count:', error);
      return 0;
    }
  }

  /**
   * Clear all history for a CV
   */
  clearHistory(cvId: string): void {
    try {
      const stmt = db.prepare('DELETE FROM cv_change_history WHERE cv_id = ?');
      stmt.run(cvId);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  /**
   * Get history summary (for display)
   */
  getHistorySummary(cvId: string, limit: number = 10): Array<{
    id: string;
    timestamp: string;
    changeType: ChangeType;
    affectedFields: string[];
    scoreDelta: number;
  }> {
    const history = this.getHistory(cvId, limit);
    
    return history.map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      changeType: entry.changeType,
      affectedFields: entry.changes 
        ? entry.changes.map(c => c.path) 
        : ['full_cv'],
      scoreDelta: entry.qualityScoreAfter - entry.qualityScoreBefore
    }));
  }

  /**
   * Convert database row to ChangeHistoryEntry
   */
  private dbRowToEntry(row: DBHistoryEntry): ChangeHistoryEntry {
    return {
      id: row.id,
      cvId: row.cv_id,
      timestamp: row.created_at,
      changeType: row.change_type as ChangeType,
      changes: row.changes ? JSON.parse(row.changes) : null,
      previousState: JSON.parse(row.previous_state),
      newState: JSON.parse(row.new_state),
      qualityScoreBefore: row.score_before || 0,
      qualityScoreAfter: row.score_after || 0
    };
  }
}

// Export singleton instance
export const changeHistoryManager = new ChangeHistoryManagerService();
