import { describe, it, expect } from 'vitest';
import {
  ToolCatalogEntrySchema,
  ModeRestrictionsSchema,
  ModeCatalogEntrySchema,
  ToolCatalogSchema,
  parseToolCatalogEntry,
  safeParseToolCatalogEntry,
  parseModeCatalogEntry,
  safeParseModeCatalogEntry,
  parseToolCatalog,
  safeParseToolCatalog,
} from '../tool-catalog.js';

describe('ToolCatalogEntrySchema', () => {
  it('validates minimal tool entry', () => {
    const data = {
      name: 'search',
      version: '1.0.0',
      description: 'Search tool',
      inputSchema: { type: 'object' },
    };
    expect(ToolCatalogEntrySchema.parse(data)).toEqual(data);
  });

  it('validates full tool entry with all optional fields', () => {
    const data = {
      name: 'search',
      version: '2.1.0',
      description: 'Advanced search tool',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
      outputSchema: { type: 'array' },
      modes: ['research', 'general'],
    };
    expect(ToolCatalogEntrySchema.parse(data)).toEqual(data);
  });

  it('rejects empty name', () => {
    const data = {
      name: '',
      version: '1.0.0',
      description: 'Tool',
      inputSchema: {},
    };
    expect(() => ToolCatalogEntrySchema.parse(data)).toThrow();
  });

  it('rejects invalid version', () => {
    const data = {
      name: 'tool',
      version: 'invalid',
      description: 'Tool',
      inputSchema: {},
    };
    expect(() => ToolCatalogEntrySchema.parse(data)).toThrow();
  });
});

describe('ModeRestrictionsSchema', () => {
  it('validates empty restrictions', () => {
    const data = {};
    expect(ModeRestrictionsSchema.parse(data)).toEqual(data);
  });

  it('validates full restrictions', () => {
    const data = {
      maxConcurrentTools: 5,
      allowedCategories: ['search', 'analysis'],
    };
    expect(ModeRestrictionsSchema.parse(data)).toEqual(data);
  });

  it('rejects negative maxConcurrentTools', () => {
    const data = { maxConcurrentTools: -1 };
    expect(() => ModeRestrictionsSchema.parse(data)).toThrow();
  });

  it('rejects zero maxConcurrentTools', () => {
    const data = { maxConcurrentTools: 0 };
    expect(() => ModeRestrictionsSchema.parse(data)).toThrow();
  });
});

describe('ModeCatalogEntrySchema', () => {
  it('validates minimal mode entry', () => {
    const data = {
      name: 'research',
      description: 'Research mode',
      defaultTools: ['search'],
    };
    expect(ModeCatalogEntrySchema.parse(data)).toEqual(data);
  });

  it('validates mode entry with restrictions', () => {
    const data = {
      name: 'restricted',
      description: 'Restricted mode',
      defaultTools: [],
      restrictions: {
        maxConcurrentTools: 2,
        allowedCategories: ['basic'],
      },
    };
    expect(ModeCatalogEntrySchema.parse(data)).toEqual(data);
  });

  it('rejects empty name', () => {
    const data = {
      name: '',
      description: 'Mode',
      defaultTools: [],
    };
    expect(() => ModeCatalogEntrySchema.parse(data)).toThrow();
  });
});

describe('ToolCatalogSchema', () => {
  const validTimestamp = '2024-01-15T10:30:00.000Z';

  it('validates minimal catalog', () => {
    const data = {
      tools: [],
      modes: [],
      lastUpdated: validTimestamp,
    };
    expect(ToolCatalogSchema.parse(data)).toEqual(data);
  });

  it('validates full catalog', () => {
    const data = {
      tools: [
        {
          name: 'search',
          version: '1.0.0',
          description: 'Search tool',
          inputSchema: { type: 'object' },
        },
      ],
      modes: [
        {
          name: 'research',
          description: 'Research mode',
          defaultTools: ['search'],
        },
      ],
      lastUpdated: validTimestamp,
    };
    const result = ToolCatalogSchema.parse(data);
    expect(result.tools).toHaveLength(1);
    expect(result.modes).toHaveLength(1);
  });

  it('rejects invalid timestamp', () => {
    const data = {
      tools: [],
      modes: [],
      lastUpdated: 'invalid-date',
    };
    expect(() => ToolCatalogSchema.parse(data)).toThrow();
  });

  it('rejects missing lastUpdated', () => {
    const data = {
      tools: [],
      modes: [],
    };
    expect(() => ToolCatalogSchema.parse(data)).toThrow();
  });
});

describe('parse helpers', () => {
  describe('ToolCatalogEntry helpers', () => {
    const validEntry = {
      name: 'tool',
      version: '1.0.0',
      description: 'A tool',
      inputSchema: {},
    };

    it('parseToolCatalogEntry returns parsed data', () => {
      expect(parseToolCatalogEntry(validEntry)).toEqual(validEntry);
    });

    it('safeParseToolCatalogEntry returns success', () => {
      expect(safeParseToolCatalogEntry(validEntry).success).toBe(true);
    });
  });

  describe('ModeCatalogEntry helpers', () => {
    const validEntry = {
      name: 'mode',
      description: 'A mode',
      defaultTools: [],
    };

    it('parseModeCatalogEntry returns parsed data', () => {
      expect(parseModeCatalogEntry(validEntry)).toEqual(validEntry);
    });

    it('safeParseModeCatalogEntry returns success', () => {
      expect(safeParseModeCatalogEntry(validEntry).success).toBe(true);
    });
  });

  describe('ToolCatalog helpers', () => {
    const validCatalog = {
      tools: [],
      modes: [],
      lastUpdated: '2024-01-15T10:30:00.000Z',
    };

    it('parseToolCatalog returns parsed data', () => {
      expect(parseToolCatalog(validCatalog)).toEqual(validCatalog);
    });

    it('safeParseToolCatalog returns success', () => {
      expect(safeParseToolCatalog(validCatalog).success).toBe(true);
    });

    it('safeParseToolCatalog returns error for invalid data', () => {
      expect(safeParseToolCatalog({}).success).toBe(false);
    });
  });
});
