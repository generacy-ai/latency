import { describe, it, expect } from 'vitest';
import {
  RecommendationSummarySchema,
  DecisionRecordSchema,
  DecisionHistoryExportSchema,
  ExportDateRangeSchema,
  parseDecisionRecord,
  safeParseDecisionRecord,
  parseDecisionHistoryExport,
  safeParseDecisionHistoryExport,
} from '../decision-history.js';

describe('Decision History Export Schemas', () => {
  describe('RecommendationSummarySchema', () => {
    it('should accept valid recommendation summary', () => {
      const summary = {
        optionId: 'dopt_abc12345',
        confidence: 0.85,
        reasoning: 'Based on user preferences',
      };
      const result = RecommendationSummarySchema.safeParse(summary);
      expect(result.success).toBe(true);
    });

    it('should accept minimal recommendation summary', () => {
      const summary = {
        optionId: 'dopt_abc12345',
        confidence: 0.5,
      };
      const result = RecommendationSummarySchema.safeParse(summary);
      expect(result.success).toBe(true);
    });

    it('should reject confidence below 0', () => {
      const summary = {
        optionId: 'dopt_abc12345',
        confidence: -0.1,
      };
      const result = RecommendationSummarySchema.safeParse(summary);
      expect(result.success).toBe(false);
    });

    it('should reject confidence above 1', () => {
      const summary = {
        optionId: 'dopt_abc12345',
        confidence: 1.5,
      };
      const result = RecommendationSummarySchema.safeParse(summary);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportDateRangeSchema', () => {
    it('should accept valid date range', () => {
      const range = {
        from: '2024-01-01T00:00:00Z',
        to: '2024-12-31T23:59:59Z',
      };
      const result = ExportDateRangeSchema.safeParse(range);
      expect(result.success).toBe(true);
    });

    it('should reject from after to', () => {
      const range = {
        from: '2024-12-31T00:00:00Z',
        to: '2024-01-01T00:00:00Z',
      };
      const result = ExportDateRangeSchema.safeParse(range);
      expect(result.success).toBe(false);
    });

    it('should accept same date for from and to', () => {
      const range = {
        from: '2024-06-15T12:00:00Z',
        to: '2024-06-15T12:00:00Z',
      };
      const result = ExportDateRangeSchema.safeParse(range);
      expect(result.success).toBe(true);
    });
  });

  describe('DecisionRecordSchema', () => {
    const createValidRecord = () => ({
      id: 'tld_abc12345',
      timestamp: '2024-01-15T10:30:00Z',
      domain: ['architecture', 'backend'],
      title: 'Choose database technology',
      baseline: { optionId: 'dopt_001', confidence: 0.7 },
      protege: { optionId: 'dopt_002', confidence: 0.85 },
      humanDecision: { optionId: 'dopt_002' },
      outcome: 'positive',
    });

    it('should accept valid decision record', () => {
      const record = createValidRecord();
      const result = DecisionRecordSchema.safeParse(record);
      expect(result.success).toBe(true);
    });

    it('should accept minimal decision record', () => {
      const record = {
        id: 'tld_abc12345',
        timestamp: '2024-01-15T10:30:00Z',
        domain: ['infrastructure'],
        humanDecision: { optionId: 'dopt_001' },
      };
      const result = DecisionRecordSchema.safeParse(record);
      expect(result.success).toBe(true);
    });

    it('should accept record with all outcome types', () => {
      const outcomes = ['positive', 'negative', 'neutral', 'pending', 'not_applicable'];
      outcomes.forEach((outcome) => {
        const record = createValidRecord();
        record.outcome = outcome as 'positive';
        const result = DecisionRecordSchema.safeParse(record);
        expect(result.success).toBe(true);
      });
    });

    it('should accept record with override flag', () => {
      const record = createValidRecord();
      record.humanDecision.wasOverride = true;
      record.humanDecision.reasoning = 'Different context than AI predicted';
      const result = DecisionRecordSchema.safeParse(record);
      expect(result.success).toBe(true);
    });

    it('should reject invalid timestamp', () => {
      const record = createValidRecord();
      record.timestamp = 'not-a-date';
      const result = DecisionRecordSchema.safeParse(record);
      expect(result.success).toBe(false);
    });

    it('should reject empty domain array', () => {
      const record = createValidRecord();
      record.domain = [];
      const result = DecisionRecordSchema.safeParse(record);
      expect(result.success).toBe(false);
    });
  });

  describe('DecisionHistoryExportSchema', () => {
    const createValidExport = () => ({
      exportVersion: '1.0.0',
      exportedAt: '2024-01-15T12:00:00Z',
      decisions: [
        {
          id: 'tld_abc12345',
          timestamp: '2024-01-10T10:30:00Z',
          domain: ['architecture'],
          humanDecision: { optionId: 'dopt_001' },
          outcome: 'positive',
        },
      ],
      dateRange: {
        from: '2023-01-01T00:00:00Z',
        to: '2024-01-15T12:00:00Z',
      },
      totalCount: 150,
    });

    it('should accept valid export', () => {
      const exportData = createValidExport();
      const result = DecisionHistoryExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with statistics', () => {
      const exportData = createValidExport();
      (exportData as typeof exportData & { statistics: object }).statistics = {
        byOutcome: { positive: 100, negative: 30, neutral: 20 },
        overrideCount: 45,
        coachingCount: 12,
      };
      const result = DecisionHistoryExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with empty decisions', () => {
      const exportData = createValidExport();
      exportData.decisions = [];
      exportData.totalCount = 0;
      const result = DecisionHistoryExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid version format', () => {
      const exportData = createValidExport();
      exportData.exportVersion = 'v1';
      const result = DecisionHistoryExportSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });

    it('should reject negative totalCount', () => {
      const exportData = createValidExport();
      exportData.totalCount = -5;
      const result = DecisionHistoryExportSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    const createValidExport = () => ({
      exportVersion: '1.0.0',
      exportedAt: '2024-01-15T12:00:00Z',
      decisions: [],
      totalCount: 0,
    });

    it('parseDecisionRecord should return parsed data', () => {
      const record = {
        id: 'tld_abc12345',
        timestamp: '2024-01-15T10:30:00Z',
        domain: ['test'],
        humanDecision: { optionId: 'dopt_001' },
      };
      const result = parseDecisionRecord(record);
      expect(result.id).toBe('tld_abc12345');
    });

    it('parseDecisionRecord should throw on invalid data', () => {
      expect(() => parseDecisionRecord({ invalid: 'data' })).toThrow();
    });

    it('safeParseDecisionRecord should return success result', () => {
      const record = {
        id: 'tld_abc12345',
        timestamp: '2024-01-15T10:30:00Z',
        domain: ['test'],
        humanDecision: { optionId: 'dopt_001' },
      };
      const result = safeParseDecisionRecord(record);
      expect(result.success).toBe(true);
    });

    it('parseDecisionHistoryExport should return parsed data', () => {
      const exportData = createValidExport();
      const result = parseDecisionHistoryExport(exportData);
      expect(result.exportVersion).toBe('1.0.0');
    });

    it('parseDecisionHistoryExport should throw on invalid data', () => {
      expect(() => parseDecisionHistoryExport({ invalid: 'data' })).toThrow();
    });

    it('safeParseDecisionHistoryExport should return error on invalid data', () => {
      const result = safeParseDecisionHistoryExport({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
