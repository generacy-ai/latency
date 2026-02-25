import { describe, it, expect } from 'vitest';
import {
  ExportValueSchema,
  ExportBoundarySchema,
  ExportMetaPreferenceSchema,
  ExportPrincipleSchema,
  ExportPatternSchema,
  KnowledgeExportSchema,
  parseKnowledgeExport,
  safeParseKnowledgeExport,
} from '../knowledge-export.js';

describe('Knowledge Export Schemas', () => {
  describe('ExportValueSchema', () => {
    it('should accept valid value', () => {
      const value = {
        id: 'val_abc12345',
        name: 'simplicity',
        description: 'Prefer simple solutions',
        weight: 0.8,
      };
      const result = ExportValueSchema.safeParse(value);
      expect(result.success).toBe(true);
    });

    it('should accept value with tension', () => {
      const value = {
        id: 'val_abc12345',
        name: 'flexibility',
        description: 'Adaptable solutions',
        weight: 0.7,
        inTensionWith: ['val_def67890'],
      };
      const result = ExportValueSchema.safeParse(value);
      expect(result.success).toBe(true);
    });

    it('should reject weight above 1', () => {
      const value = {
        id: 'val_abc12345',
        name: 'test',
        description: 'test',
        weight: 1.5,
      };
      const result = ExportValueSchema.safeParse(value);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportBoundarySchema', () => {
    it('should accept absolute boundary', () => {
      const boundary = {
        id: 'bnd_abc12345',
        description: 'Never compromise privacy',
        type: 'absolute',
      };
      const result = ExportBoundarySchema.safeParse(boundary);
      expect(result.success).toBe(true);
    });

    it('should accept contextual boundary with context', () => {
      const boundary = {
        id: 'bnd_abc12345',
        description: 'Avoid overtime',
        type: 'contextual',
        context: 'During family events',
      };
      const result = ExportBoundarySchema.safeParse(boundary);
      expect(result.success).toBe(true);
    });
  });

  describe('ExportMetaPreferenceSchema', () => {
    it('should accept valid meta-preference', () => {
      const metaPref = {
        id: 'mpf_abc12345',
        category: 'decision_style',
        preference: 'Prefer quick decisions over perfect ones',
        strength: 0.7,
      };
      const result = ExportMetaPreferenceSchema.safeParse(metaPref);
      expect(result.success).toBe(true);
    });

    it('should reject empty category', () => {
      const metaPref = {
        id: 'mpf_abc12345',
        category: '',
        preference: 'test',
        strength: 0.5,
      };
      const result = ExportMetaPreferenceSchema.safeParse(metaPref);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportPrincipleSchema', () => {
    const createValidPrinciple = () => ({
      id: 'pri_abc12345',
      domain: ['architecture', 'backend'],
      statement: 'Prefer fewer services unless compelling reason',
      rationale: 'Reduces operational complexity',
      applicability: {
        when: ['team size < 5'],
        unless: ['clear scaling requirements'],
      },
      confidence: 0.85,
      learnedWeight: 0.9,
      status: 'active',
    });

    it('should accept valid principle', () => {
      const principle = createValidPrinciple();
      const result = ExportPrincipleSchema.safeParse(principle);
      expect(result.success).toBe(true);
    });

    it('should accept all status values', () => {
      const statuses = ['active', 'deprecated', 'under_review'];
      statuses.forEach((status) => {
        const principle = createValidPrinciple();
        principle.status = status as 'active';
        const result = ExportPrincipleSchema.safeParse(principle);
        expect(result.success).toBe(true);
      });
    });

    it('should accept principle with evidence count', () => {
      const principle = createValidPrinciple();
      (principle as typeof principle & { evidenceCount: number }).evidenceCount = 10;
      const result = ExportPrincipleSchema.safeParse(principle);
      expect(result.success).toBe(true);
    });

    it('should reject confidence above 1', () => {
      const principle = createValidPrinciple();
      principle.confidence = 1.5;
      const result = ExportPrincipleSchema.safeParse(principle);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportPatternSchema', () => {
    it('should accept valid pattern', () => {
      const pattern = {
        id: 'pat_abc12345',
        observation: 'When team < 5, prefers monorepo',
        frequency: 8,
        contexts: ['startup', 'side_project'],
        status: 'proposed_principle',
      };
      const result = ExportPatternSchema.safeParse(pattern);
      expect(result.success).toBe(true);
    });

    it('should accept all status values', () => {
      const statuses = ['observed', 'proposed_principle', 'rejected', 'promoted'];
      statuses.forEach((status) => {
        const pattern = {
          id: 'pat_abc12345',
          observation: 'test',
          frequency: 1,
          contexts: ['test'],
          status,
        };
        const result = ExportPatternSchema.safeParse(pattern);
        expect(result.success).toBe(true);
      });
    });

    it('should accept promoted pattern with principle ID', () => {
      const pattern = {
        id: 'pat_abc12345',
        observation: 'test',
        frequency: 10,
        contexts: ['test'],
        status: 'promoted',
        promotedToPrincipleId: 'pri_abc12345',
      };
      const result = ExportPatternSchema.safeParse(pattern);
      expect(result.success).toBe(true);
    });
  });

  describe('KnowledgeExportSchema', () => {
    const createValidExport = () => ({
      exportVersion: '1.0.0',
      exportedAt: '2024-01-15T12:00:00Z',
      philosophy: {
        values: [
          {
            id: 'val_abc12345',
            name: 'simplicity',
            description: 'Keep it simple',
            weight: 0.8,
          },
        ],
        metaPreferences: [],
        boundaries: [],
      },
      principles: [
        {
          id: 'pri_abc12345',
          domain: ['architecture'],
          statement: 'Keep services minimal',
          rationale: 'Less complexity',
          applicability: { when: [], unless: [] },
          confidence: 0.9,
          learnedWeight: 0.85,
          status: 'active',
        },
      ],
      patterns: [],
      domains: [{ name: 'architecture' }],
    });

    it('should accept valid knowledge export', () => {
      const exportData = createValidExport();
      const result = KnowledgeExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export without philosophy', () => {
      const exportData = createValidExport();
      delete (exportData as Partial<typeof exportData>).philosophy;
      const result = KnowledgeExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with statistics', () => {
      const exportData = createValidExport();
      (exportData as typeof exportData & { statistics: object }).statistics = {
        valuesCount: 5,
        boundariesCount: 3,
        principlesCount: 10,
        patternsCount: 15,
        promotedPatternsCount: 5,
      };
      const result = KnowledgeExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept empty arrays', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        principles: [],
        patterns: [],
        domains: [],
      };
      const result = KnowledgeExportSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid version format', () => {
      const exportData = createValidExport();
      exportData.exportVersion = 'version1';
      const result = KnowledgeExportSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    it('parseKnowledgeExport should return parsed data', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        principles: [],
        patterns: [],
        domains: [],
      };
      const result = parseKnowledgeExport(exportData);
      expect(result.exportVersion).toBe('1.0.0');
    });

    it('parseKnowledgeExport should throw on invalid data', () => {
      expect(() => parseKnowledgeExport({ invalid: 'data' })).toThrow();
    });

    it('safeParseKnowledgeExport should return success result', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        principles: [],
        patterns: [],
        domains: [],
      };
      const result = safeParseKnowledgeExport(exportData);
      expect(result.success).toBe(true);
    });

    it('safeParseKnowledgeExport should return error on invalid data', () => {
      const result = safeParseKnowledgeExport({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
