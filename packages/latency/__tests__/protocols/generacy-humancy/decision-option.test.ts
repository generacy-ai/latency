import { describe, it, expect } from 'vitest';
import {
  ExtendedDecisionOptionSchema,
  parseExtendedDecisionOption,
  safeParseExtendedDecisionOption,
} from '../../../src/protocols/generacy-humancy/decision-option.js';

describe('ExtendedDecisionOptionSchema', () => {
  describe('valid data parsing', () => {
    it('accepts full object with all fields', () => {
      const data = {
        id: 'opt-1',
        label: 'Option One',
        value: 'option_one',
        description: 'This is the first option',
        recommended: true,
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('accepts minimal object with only required fields', () => {
      const data = {
        id: 'opt-2',
        label: 'Option Two',
        value: 'option_two',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe('invalid data rejection - missing required fields', () => {
    it('rejects missing id', () => {
      const data = {
        label: 'Option',
        value: 'option',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing label', () => {
      const data = {
        id: 'opt-1',
        value: 'option',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing value', () => {
      const data = {
        id: 'opt-1',
        label: 'Option',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('invalid data rejection - empty strings', () => {
    it('rejects empty string for id', () => {
      const data = {
        id: '',
        label: 'Option',
        value: 'option',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects empty string for label', () => {
      const data = {
        id: 'opt-1',
        label: '',
        value: 'option',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects empty string for value', () => {
      const data = {
        id: 'opt-1',
        label: 'Option',
        value: '',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('strip behavior', () => {
    it('removes extra unknown properties', () => {
      const data = {
        id: 'opt-1',
        label: 'Option',
        value: 'option',
        unknownField: 'should be removed',
        anotherUnknown: 123,
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: 'opt-1',
          label: 'Option',
          value: 'option',
        });
        expect(result.data).not.toHaveProperty('unknownField');
        expect(result.data).not.toHaveProperty('anotherUnknown');
      }
    });
  });

  describe('optional field handling', () => {
    it('accepts undefined description', () => {
      const data = {
        id: 'opt-1',
        label: 'Option',
        value: 'option',
        recommended: true,
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it('accepts undefined recommended', () => {
      const data = {
        id: 'opt-1',
        label: 'Option',
        value: 'option',
        description: 'A description',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recommended).toBeUndefined();
      }
    });

    it('accepts empty string for optional description', () => {
      const data = {
        id: 'opt-1',
        label: 'Option',
        value: 'option',
        description: '',
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('accepts false for optional recommended', () => {
      const data = {
        id: 'opt-1',
        label: 'Option',
        value: 'option',
        recommended: false,
      };
      const result = ExtendedDecisionOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recommended).toBe(false);
      }
    });
  });
});

describe('parseExtendedDecisionOption', () => {
  it('returns parsed data for valid input', () => {
    const data = {
      id: 'opt-1',
      label: 'Option',
      value: 'option',
    };
    const result = parseExtendedDecisionOption(data);
    expect(result).toEqual(data);
  });

  it('throws for invalid input', () => {
    const data = {
      id: '',
      label: 'Option',
      value: 'option',
    };
    expect(() => parseExtendedDecisionOption(data)).toThrow();
  });
});

describe('safeParseExtendedDecisionOption', () => {
  it('returns success result for valid input', () => {
    const data = {
      id: 'opt-1',
      label: 'Option',
      value: 'option',
    };
    const result = safeParseExtendedDecisionOption(data);
    expect(result.success).toBe(true);
  });

  it('returns failure result for invalid input', () => {
    const data = {
      id: '',
      label: 'Option',
      value: 'option',
    };
    const result = safeParseExtendedDecisionOption(data);
    expect(result.success).toBe(false);
  });
});
