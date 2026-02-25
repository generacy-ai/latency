import { describe, it, expect } from 'vitest';
import {
  DecisionTypeSchema,
  UrgencyLevelSchema,
  DecisionOptionSchema,
  DecisionRequestSchema,
  parseDecisionRequest,
  safeParseDecisionRequest,
} from '../../../src/protocols/agency-humancy/decision-request.js';

describe('DecisionType', () => {
  it('should accept valid decision types', () => {
    const validTypes = ['question', 'review', 'decision'];
    for (const type of validTypes) {
      expect(DecisionTypeSchema.parse(type)).toBe(type);
    }
  });

  it('should reject invalid decision types', () => {
    expect(DecisionTypeSchema.safeParse('invalid').success).toBe(false);
    expect(DecisionTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('UrgencyLevel', () => {
  it('should accept valid urgency levels', () => {
    const validLevels = ['blocking_now', 'blocking_soon', 'when_available'];
    for (const level of validLevels) {
      expect(UrgencyLevelSchema.parse(level)).toBe(level);
    }
  });

  it('should reject invalid urgency levels', () => {
    expect(UrgencyLevelSchema.safeParse('urgent').success).toBe(false);
    expect(UrgencyLevelSchema.safeParse('low').success).toBe(false);
  });
});

describe('DecisionOption', () => {
  it('should validate a valid option', () => {
    const validOption = {
      id: 'option-a',
      label: 'Option A',
      description: 'The first option',
    };
    expect(DecisionOptionSchema.parse(validOption)).toEqual(validOption);
  });

  it('should allow option without description', () => {
    const optionWithoutDesc = {
      id: 'option-b',
      label: 'Option B',
    };
    expect(DecisionOptionSchema.safeParse(optionWithoutDesc).success).toBe(true);
  });

  it('should require id', () => {
    const invalid = {
      id: '',
      label: 'Label',
    };
    expect(DecisionOptionSchema.safeParse(invalid).success).toBe(false);
  });

  it('should require label', () => {
    const invalid = {
      id: 'opt',
      label: '',
    };
    expect(DecisionOptionSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('DecisionRequest', () => {
  const validRequest = {
    id: 'req-123',
    type: 'decision' as const,
    urgency: 'blocking_now' as const,
    question: 'Should we proceed with the deployment?',
    context: 'Production deployment pending',
    options: [
      { id: 'yes', label: 'Yes, deploy' },
      { id: 'no', label: 'No, wait' },
    ],
    relatedIssue: 42,
    timeout: 300000,
  };

  it('should validate a full decision request', () => {
    expect(parseDecisionRequest(validRequest)).toEqual(validRequest);
  });

  it('should allow minimal request without optional fields', () => {
    const minimalRequest = {
      id: 'req-456',
      type: 'question' as const,
      urgency: 'when_available' as const,
      question: 'What is the preferred approach?',
    };
    expect(safeParseDecisionRequest(minimalRequest).success).toBe(true);
  });

  it('should require id', () => {
    const invalid = { ...validRequest, id: '' };
    expect(safeParseDecisionRequest(invalid).success).toBe(false);
  });

  it('should require question', () => {
    const invalid = { ...validRequest, question: '' };
    expect(safeParseDecisionRequest(invalid).success).toBe(false);
  });

  it('should reject negative timeout', () => {
    const invalid = { ...validRequest, timeout: -1 };
    expect(safeParseDecisionRequest(invalid).success).toBe(false);
  });

  it('should reject zero timeout', () => {
    const invalid = { ...validRequest, timeout: 0 };
    expect(safeParseDecisionRequest(invalid).success).toBe(false);
  });

  it('should accept positive timeout', () => {
    const valid = { ...validRequest, timeout: 1 };
    expect(safeParseDecisionRequest(valid).success).toBe(true);
  });

  it('should reject negative relatedIssue', () => {
    const invalid = { ...validRequest, relatedIssue: -1 };
    expect(safeParseDecisionRequest(invalid).success).toBe(false);
  });

  it('should reject non-integer relatedIssue', () => {
    const invalid = { ...validRequest, relatedIssue: 1.5 };
    expect(safeParseDecisionRequest(invalid).success).toBe(false);
  });

  it('should validate all urgency levels in context', () => {
    for (const urgency of ['blocking_now', 'blocking_soon', 'when_available'] as const) {
      const request = { ...validRequest, urgency };
      expect(safeParseDecisionRequest(request).success).toBe(true);
    }
  });

  it('should validate all decision types in context', () => {
    for (const type of ['question', 'review', 'decision'] as const) {
      const request = { ...validRequest, type };
      expect(safeParseDecisionRequest(request).success).toBe(true);
    }
  });
});
