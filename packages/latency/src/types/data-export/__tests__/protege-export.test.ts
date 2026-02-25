import { describe, it, expect } from 'vitest';
import {
  ExportCoachingRecordSchema,
  CoachingHistoryExportSchema,
  ExportUserPreferencesSchema,
  ProtegeDataExportSchema,
  parseProtegeDataExport,
  safeParseProtegeDataExport,
} from '../protege-export.js';

describe('Protege Data Export Schemas', () => {
  describe('ExportCoachingRecordSchema', () => {
    it('should accept valid coaching record', () => {
      const record = {
        id: 'coach_abc12345',
        decisionId: 'tld_def67890',
        timestamp: '2024-01-15T10:30:00Z',
        overrideReason: 'missing_context',
        explanation: 'AI did not consider budget constraints',
      };
      const result = ExportCoachingRecordSchema.safeParse(record);
      expect(result.success).toBe(true);
    });

    it('should accept all override reason values', () => {
      const reasons = [
        'missing_context',
        'incorrect_weight',
        'wrong_principle',
        'new_information',
        'preference_change',
        'special_case',
        'other',
      ];
      reasons.forEach((reason) => {
        const record = {
          id: 'coach_abc12345',
          decisionId: 'tld_def67890',
          timestamp: '2024-01-15T10:30:00Z',
          overrideReason: reason,
        };
        const result = ExportCoachingRecordSchema.safeParse(record);
        expect(result.success).toBe(true);
      });
    });

    it('should accept record with scope', () => {
      const record = {
        id: 'coach_abc12345',
        decisionId: 'tld_def67890',
        timestamp: '2024-01-15T10:30:00Z',
        scope: {
          appliesTo: 'this_domain',
          domain: ['architecture'],
        },
      };
      const result = ExportCoachingRecordSchema.safeParse(record);
      expect(result.success).toBe(true);
    });

    it('should reject invalid timestamp', () => {
      const record = {
        id: 'coach_abc12345',
        decisionId: 'tld_def67890',
        timestamp: 'not-a-date',
      };
      const result = ExportCoachingRecordSchema.safeParse(record);
      expect(result.success).toBe(false);
    });
  });

  describe('CoachingHistoryExportSchema', () => {
    it('should accept valid coaching history', () => {
      const history = {
        records: [
          {
            id: 'coach_abc12345',
            decisionId: 'tld_def67890',
            timestamp: '2024-01-15T10:30:00Z',
          },
        ],
        totalCount: 1,
      };
      const result = CoachingHistoryExportSchema.safeParse(history);
      expect(result.success).toBe(true);
    });

    it('should accept history with statistics', () => {
      const history = {
        records: [],
        totalCount: 50,
        statistics: {
          byReason: { missing_context: 20, wrong_principle: 15, other: 15 },
          knowledgeUpdatesCount: 10,
        },
      };
      const result = CoachingHistoryExportSchema.safeParse(history);
      expect(result.success).toBe(true);
    });
  });

  describe('ExportUserPreferencesSchema', () => {
    it('should accept valid preferences', () => {
      const prefs = {
        notifications: {
          email: true,
          inApp: true,
          urgencyThreshold: 'high',
        },
        decisionQueue: {
          defaultSort: 'urgency',
          showResolved: false,
        },
        learning: {
          coachingFrequency: 'on_override',
          autoDetectPatterns: true,
          patternThreshold: 5,
        },
        display: {
          theme: 'dark',
          language: 'en',
          timezone: 'America/New_York',
        },
      };
      const result = ExportUserPreferencesSchema.safeParse(prefs);
      expect(result.success).toBe(true);
    });

    it('should accept empty preferences', () => {
      const prefs = {};
      const result = ExportUserPreferencesSchema.safeParse(prefs);
      expect(result.success).toBe(true);
    });

    it('should accept all theme values', () => {
      const themes = ['light', 'dark', 'system'];
      themes.forEach((theme) => {
        const prefs = { display: { theme } };
        const result = ExportUserPreferencesSchema.safeParse(prefs);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all sort values', () => {
      const sorts = ['newest', 'oldest', 'urgency', 'domain'];
      sorts.forEach((sort) => {
        const prefs = { decisionQueue: { defaultSort: sort } };
        const result = ExportUserPreferencesSchema.safeParse(prefs);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('ProtegeDataExportSchema', () => {
    const createValidExport = () => ({
      exportVersion: '1.0.0',
      exportedAt: '2024-01-15T12:00:00Z',
      userId: 'user_abc123',
      knowledge: {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        principles: [],
        patterns: [],
        domains: [],
      },
      decisionHistory: {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        decisions: [],
        totalCount: 0,
      },
      coachingHistory: {
        records: [],
        totalCount: 0,
      },
      preferences: {
        display: { theme: 'dark' },
      },
    });

    it('should accept complete export', () => {
      const exportData = createValidExport();
      const result = ProtegeDataExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept minimal export', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        userId: 'user_abc123',
      };
      const result = ProtegeDataExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with metadata', () => {
      const exportData = createValidExport();
      (exportData as typeof exportData & { metadata: object }).metadata = {
        description: 'Full backup',
        reason: 'backup',
        retentionDays: 90,
        requestedBy: 'user_abc123',
        isComplete: true,
        includedSections: ['knowledge', 'decisionHistory', 'coachingHistory', 'preferences'],
      };
      const result = ProtegeDataExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept all export reason values', () => {
      const reasons = ['backup', 'transfer', 'compliance', 'analysis', 'other'];
      reasons.forEach((reason) => {
        const exportData = createValidExport();
        (exportData as typeof exportData & { metadata: { reason: string } }).metadata = {
          reason,
        };
        const result = ProtegeDataExportSchema.safeParse(exportData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject missing userId', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
      };
      const result = ProtegeDataExportSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid version format', () => {
      const exportData = createValidExport();
      exportData.exportVersion = 'v1.0';
      const result = ProtegeDataExportSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    it('parseProtegeDataExport should return parsed data', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        userId: 'user_abc123',
      };
      const result = parseProtegeDataExport(exportData);
      expect(result.userId).toBe('user_abc123');
    });

    it('parseProtegeDataExport should throw on invalid data', () => {
      expect(() => parseProtegeDataExport({ invalid: 'data' })).toThrow();
    });

    it('safeParseProtegeDataExport should return success result', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        userId: 'user_abc123',
      };
      const result = safeParseProtegeDataExport(exportData);
      expect(result.success).toBe(true);
    });

    it('safeParseProtegeDataExport should return error on invalid data', () => {
      const result = safeParseProtegeDataExport({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
