import { describe, it, expect } from 'vitest';
import {
  ModeSettingRequestSchema,
  ModeSettingResponseSchema,
  parseModeSettingRequest,
  safeParseModeSettingRequest,
  parseModeSettingResponse,
  safeParseModeSettingResponse,
} from '../mode-setting.js';

describe('ModeSettingRequestSchema', () => {
  it('validates minimal request', () => {
    const data = {
      mode: 'research',
    };
    expect(ModeSettingRequestSchema.parse(data)).toEqual(data);
  });

  it('validates full request with all optional fields', () => {
    const data = {
      mode: 'coding',
      context: 'Working on feature X',
      duration: 3600000,
      timeout: 5000,
    };
    expect(ModeSettingRequestSchema.parse(data)).toEqual(data);
  });

  it('rejects empty mode string', () => {
    const data = {
      mode: '',
    };
    expect(() => ModeSettingRequestSchema.parse(data)).toThrow();
  });

  it('rejects negative duration', () => {
    const data = {
      mode: 'research',
      duration: -1000,
    };
    expect(() => ModeSettingRequestSchema.parse(data)).toThrow();
  });

  it('rejects zero timeout', () => {
    const data = {
      mode: 'research',
      timeout: 0,
    };
    expect(() => ModeSettingRequestSchema.parse(data)).toThrow();
  });

  it('rejects non-integer duration', () => {
    const data = {
      mode: 'research',
      duration: 1000.5,
    };
    expect(() => ModeSettingRequestSchema.parse(data)).toThrow();
  });
});

describe('ModeSettingResponseSchema', () => {
  it('validates success response', () => {
    const data = {
      success: true,
      activeMode: 'research',
      availableTools: ['search', 'browse', 'analyze'],
    };
    expect(ModeSettingResponseSchema.parse(data)).toEqual(data);
  });

  it('validates response with empty tools array', () => {
    const data = {
      success: true,
      activeMode: 'restricted',
      availableTools: [],
    };
    expect(ModeSettingResponseSchema.parse(data)).toEqual(data);
  });

  it('rejects response with success: false', () => {
    const data = {
      success: false,
      activeMode: 'research',
      availableTools: [],
    };
    expect(() => ModeSettingResponseSchema.parse(data)).toThrow();
  });

  it('rejects empty activeMode', () => {
    const data = {
      success: true,
      activeMode: '',
      availableTools: [],
    };
    expect(() => ModeSettingResponseSchema.parse(data)).toThrow();
  });
});

describe('parse helpers', () => {
  describe('ModeSettingRequest helpers', () => {
    const validRequest = { mode: 'research' };

    it('parseModeSettingRequest returns parsed data', () => {
      expect(parseModeSettingRequest(validRequest)).toEqual(validRequest);
    });

    it('parseModeSettingRequest throws for invalid data', () => {
      expect(() => parseModeSettingRequest({ mode: '' })).toThrow();
    });

    it('safeParseModeSettingRequest returns success for valid data', () => {
      const result = safeParseModeSettingRequest(validRequest);
      expect(result.success).toBe(true);
    });

    it('safeParseModeSettingRequest returns error for invalid data', () => {
      const result = safeParseModeSettingRequest({ mode: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('ModeSettingResponse helpers', () => {
    const validResponse = {
      success: true,
      activeMode: 'research',
      availableTools: ['tool1'],
    };

    it('parseModeSettingResponse returns parsed data', () => {
      expect(parseModeSettingResponse(validResponse)).toEqual(validResponse);
    });

    it('parseModeSettingResponse throws for invalid data', () => {
      expect(() => parseModeSettingResponse({ success: false })).toThrow();
    });

    it('safeParseModeSettingResponse returns success for valid data', () => {
      const result = safeParseModeSettingResponse(validResponse);
      expect(result.success).toBe(true);
    });

    it('safeParseModeSettingResponse returns error for invalid data', () => {
      const result = safeParseModeSettingResponse({});
      expect(result.success).toBe(false);
    });
  });
});
