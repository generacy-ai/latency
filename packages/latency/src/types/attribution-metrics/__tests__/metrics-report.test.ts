import { describe, it, expect } from 'vitest';
import {
  ReportSummarySchema,
  MetricsReportSchema,
  parseReportSummary,
  safeParseReportSummary,
  parseMetricsReport,
  safeParseMetricsReport,
} from '../metrics-report.js';

describe('ReportSummarySchema', () => {
  const validSummary = {
    overallAdditiveValue: 0.42,
    strongestDomains: ['content_moderation', 'loan_approval'],
    growthAreas: ['fraud_detection'],
    protegeTrainingLevel: 'proficient' as const,
  };

  describe('valid shapes', () => {
    it('accepts valid summary', () => {
      const result = ReportSummarySchema.safeParse(validSummary);
      expect(result.success).toBe(true);
    });

    it('accepts all training levels', () => {
      const levels = ['novice', 'developing', 'proficient', 'expert'] as const;
      for (const level of levels) {
        const result = ReportSummarySchema.safeParse({
          ...validSummary,
          protegeTrainingLevel: level,
        });
        expect(result.success).toBe(true);
      }
    });

    it('accepts empty domain arrays', () => {
      const result = ReportSummarySchema.safeParse({
        ...validSummary,
        strongestDomains: [],
        growthAreas: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts boundary values for overallAdditiveValue', () => {
      expect(ReportSummarySchema.safeParse({ ...validSummary, overallAdditiveValue: 0 }).success).toBe(true);
      expect(ReportSummarySchema.safeParse({ ...validSummary, overallAdditiveValue: 1 }).success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = ReportSummarySchema.safeParse({
        ...validSummary,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects overallAdditiveValue below 0', () => {
      const result = ReportSummarySchema.safeParse({
        ...validSummary,
        overallAdditiveValue: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects overallAdditiveValue above 1', () => {
      const result = ReportSummarySchema.safeParse({
        ...validSummary,
        overallAdditiveValue: 1.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty string in strongestDomains', () => {
      const result = ReportSummarySchema.safeParse({
        ...validSummary,
        strongestDomains: ['valid', ''],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid training level', () => {
      const result = ReportSummarySchema.safeParse({
        ...validSummary,
        protegeTrainingLevel: 'master',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('MetricsReportSchema', () => {
  const validMetrics = {
    id: 'metrics_abc12345',
    userId: 'user_123',
    period: {
      type: 'month' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    },
    calculatedAt: new Date(),
    interventionRate: 0.15,
    additiveValue: 0.42,
    protegeStandaloneValue: 0.35,
    uniqueHumanContribution: 0.07,
    domainBreakdown: [],
    volumeCapacity: {
      decisionsPerHour: 12.5,
      decisionsPerDay: 95,
      averageResponseTime: 45.2,
      peakThroughput: 22,
    },
    trend: {
      direction: 'stable' as const,
      changePercent: 0,
      comparedToPeriod: {
        type: 'month' as const,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-31'),
      },
    },
  };

  const validReport = {
    id: 'report_abc12345',
    userId: 'user_123',
    generatedAt: new Date(),
    summary: {
      overallAdditiveValue: 0.42,
      strongestDomains: ['content_moderation', 'loan_approval'],
      growthAreas: ['fraud_detection'],
      protegeTrainingLevel: 'proficient' as const,
    },
    detailed: [validMetrics],
    verificationHash: 'sha256:abc123def456789',
    verifiedBy: 'humancy_platform' as const,
  };

  describe('valid shapes', () => {
    it('accepts valid report', () => {
      const result = MetricsReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });

    it('accepts empty detailed array', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        detailed: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts multiple periods in detailed', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        detailed: [
          validMetrics,
          {
            ...validMetrics,
            id: 'metrics_def12345',
            period: {
              type: 'month' as const,
              startDate: new Date('2024-02-01'),
              endDate: new Date('2024-02-29'),
            },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('coerces string date', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        generatedAt: '2024-01-31T12:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generatedAt).toBeInstanceOf(Date);
      }
    });

    it('allows passthrough of unknown fields', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        id: 'wrong_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty verificationHash', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        verificationHash: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid verifiedBy', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        verifiedBy: 'other_platform',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid summary', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        summary: {
          overallAdditiveValue: 1.5, // invalid
          strongestDomains: [],
          growthAreas: [],
          protegeTrainingLevel: 'proficient',
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid metrics in detailed', () => {
      const result = MetricsReportSchema.safeParse({
        ...validReport,
        detailed: [
          {
            id: 'invalid_id', // wrong prefix
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseReportSummary returns parsed data', () => {
      const result = parseReportSummary({
        overallAdditiveValue: 0.5,
        strongestDomains: ['test'],
        growthAreas: [],
        protegeTrainingLevel: 'expert',
      });
      expect(result.overallAdditiveValue).toBe(0.5);
      expect(result.protegeTrainingLevel).toBe('expert');
    });

    it('safeParseReportSummary handles invalid data', () => {
      const result = safeParseReportSummary({ overallAdditiveValue: 2 });
      expect(result.success).toBe(false);
    });

    it('parseMetricsReport returns parsed data', () => {
      const result = parseMetricsReport(validReport);
      expect(result.id).toBe('report_abc12345');
      expect(result.verifiedBy).toBe('humancy_platform');
      expect(result.detailed).toHaveLength(1);
    });

    it('parseMetricsReport throws on invalid data', () => {
      expect(() => parseMetricsReport({ id: 'invalid' })).toThrow();
    });

    it('safeParseMetricsReport returns success result', () => {
      const result = safeParseMetricsReport(validReport);
      expect(result.success).toBe(true);
    });

    it('safeParseMetricsReport returns error result for invalid data', () => {
      const result = safeParseMetricsReport({ id: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
