import { describe, it, expect } from 'vitest';
import {
  DecisionResponseSchema,
  parseDecisionResponse,
  safeParseDecisionResponse,
} from '../../../src/protocols/agency-humancy/decision-response.js';

describe('DecisionResponse', () => {
  const validResponseWithOption = {
    requestId: 'req-123',
    selectedOption: 'option-a',
    respondedAt: '2026-01-16T12:00:00Z',
    respondedBy: 'user-456',
  };

  const validResponseWithFreeform = {
    requestId: 'req-123',
    freeformResponse: 'I think we should wait until after the meeting.',
    respondedAt: '2026-01-16T12:00:00Z',
  };

  it('should validate response with selected option', () => {
    expect(parseDecisionResponse(validResponseWithOption)).toEqual(validResponseWithOption);
  });

  it('should validate response with freeform text', () => {
    expect(parseDecisionResponse(validResponseWithFreeform)).toEqual(validResponseWithFreeform);
  });

  it('should validate response with both option and freeform', () => {
    const bothResponse = {
      ...validResponseWithOption,
      freeformResponse: 'Additional context',
    };
    expect(safeParseDecisionResponse(bothResponse).success).toBe(true);
  });

  it('should reject response without any answer', () => {
    const invalid = {
      requestId: 'req-123',
      respondedAt: '2026-01-16T12:00:00Z',
    };
    expect(safeParseDecisionResponse(invalid).success).toBe(false);
  });

  it('should require requestId', () => {
    const invalid = {
      requestId: '',
      selectedOption: 'option-a',
      respondedAt: '2026-01-16T12:00:00Z',
    };
    expect(safeParseDecisionResponse(invalid).success).toBe(false);
  });

  it('should require valid ISO datetime for respondedAt', () => {
    const invalidDates = [
      '2026-01-16',
      '12:00:00',
      'invalid-date',
      '2026/01/16T12:00:00Z',
    ];
    for (const date of invalidDates) {
      const invalid = {
        requestId: 'req-123',
        selectedOption: 'opt',
        respondedAt: date,
      };
      expect(safeParseDecisionResponse(invalid).success).toBe(false);
    }
  });

  it('should accept various valid ISO datetime formats', () => {
    const validDates = [
      '2026-01-16T12:00:00Z',
      '2026-01-16T12:00:00.000Z',
      '2026-01-16T12:00:00+00:00',
      '2026-01-16T07:00:00-05:00',
    ];
    for (const date of validDates) {
      const valid = {
        requestId: 'req-123',
        selectedOption: 'opt',
        respondedAt: date,
      };
      expect(safeParseDecisionResponse(valid).success).toBe(true);
    }
  });

  it('should allow optional respondedBy', () => {
    expect(safeParseDecisionResponse(validResponseWithFreeform).success).toBe(true);
    expect(validResponseWithFreeform).not.toHaveProperty('respondedBy');
  });

  it('should reject empty selectedOption if provided', () => {
    const invalid = {
      requestId: 'req-123',
      selectedOption: '',
      respondedAt: '2026-01-16T12:00:00Z',
    };
    expect(safeParseDecisionResponse(invalid).success).toBe(false);
  });

  it('should allow empty freeformResponse if selectedOption is provided', () => {
    const valid = {
      requestId: 'req-123',
      selectedOption: 'opt',
      freeformResponse: '',
      respondedAt: '2026-01-16T12:00:00Z',
    };
    // Empty string freeformResponse counts as undefined for the refinement
    // but selectedOption is present, so it should pass
    expect(safeParseDecisionResponse(valid).success).toBe(true);
  });
});
