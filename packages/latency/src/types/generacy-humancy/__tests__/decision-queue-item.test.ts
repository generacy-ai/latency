import { describe, it, expect } from 'vitest';
import {
  DecisionQueueItemSchema,
  parseDecisionQueueItem,
  safeParseDecisionQueueItem,
} from '../decision-queue-item.js';

describe('DecisionQueueItemSchema', () => {
  const validTimestamp = '2024-01-15T10:30:00Z';
  const validExpiresAt = '2024-01-16T10:30:00Z';

  describe('Valid data parsing', () => {
    it('accepts full object with all fields', () => {
      const fullItem = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Should we proceed with deployment?',
        context: 'Production deployment for v2.0',
        options: [
          {
            id: 'opt-1',
            label: 'Yes',
            value: 'yes',
            description: 'Proceed with deployment',
            recommended: true,
          },
          {
            id: 'opt-2',
            label: 'No',
            value: 'no',
            description: 'Cancel deployment',
          },
        ],
        workflowId: 'workflow-456',
        issueNumber: 42,
        agentId: 'agent-789',
        createdAt: validTimestamp,
        expiresAt: validExpiresAt,
      };

      const result = DecisionQueueItemSchema.safeParse(fullItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('queue-item-123');
        expect(result.data.urgency).toBe('blocking_now');
        expect(result.data.type).toBe('decision');
        expect(result.data.content).toBe('Should we proceed with deployment?');
        expect(result.data.context).toBe('Production deployment for v2.0');
        expect(result.data.options).toHaveLength(2);
        expect(result.data.workflowId).toBe('workflow-456');
        expect(result.data.issueNumber).toBe(42);
        expect(result.data.agentId).toBe('agent-789');
        expect(result.data.createdAt).toBe(validTimestamp);
        expect(result.data.expiresAt).toBe(validExpiresAt);
      }
    });

    it('accepts minimal object with only required fields', () => {
      const minimalItem = {
        id: 'queue-item-minimal',
        urgency: 'when_available',
        type: 'question',
        content: 'What is the preferred approach?',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(minimalItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('queue-item-minimal');
        expect(result.data.urgency).toBe('when_available');
        expect(result.data.type).toBe('question');
        expect(result.data.content).toBe('What is the preferred approach?');
        expect(result.data.createdAt).toBe(validTimestamp);
        expect(result.data.context).toBeUndefined();
        expect(result.data.options).toBeUndefined();
        expect(result.data.workflowId).toBeUndefined();
        expect(result.data.issueNumber).toBeUndefined();
        expect(result.data.agentId).toBeUndefined();
        expect(result.data.expiresAt).toBeUndefined();
      }
    });

    it('accepts review type', () => {
      const reviewItem = {
        id: 'review-item',
        urgency: 'blocking_soon',
        type: 'review',
        content: 'Please review the pull request',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(reviewItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('review');
      }
    });
  });

  describe('Invalid data rejection - missing required fields', () => {
    it('rejects missing id', () => {
      const item = {
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects empty id', () => {
      const item = {
        id: '',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects missing urgency', () => {
      const item = {
        id: 'queue-item-123',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects missing type', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects missing content', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects empty content', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: '',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects missing createdAt', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid data rejection - wrong enum values', () => {
    it('rejects invalid urgency value', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'critical', // Invalid - not in enum
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects invalid type value', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'approval', // Invalid - not in enum
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects case-sensitive urgency mismatch', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'BLOCKING_NOW', // Wrong case
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects case-sensitive type mismatch', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'DECISION', // Wrong case
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Strip behavior', () => {
    it('removes extra unknown properties', () => {
      const itemWithExtra = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
        unknownField: 'should be stripped',
        anotherUnknown: 42,
      };

      const result = DecisionQueueItemSchema.safeParse(itemWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
        expect(result.data).not.toHaveProperty('anotherUnknown');
        expect(Object.keys(result.data)).toEqual([
          'id',
          'urgency',
          'type',
          'content',
          'createdAt',
        ]);
      }
    });
  });

  describe('Options array validation', () => {
    it('accepts valid DecisionOption objects', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Choose an option',
        createdAt: validTimestamp,
        options: [
          { id: 'opt-1', label: 'Option A', value: 'a' },
          { id: 'opt-2', label: 'Option B', value: 'b', description: 'Second choice' },
          { id: 'opt-3', label: 'Option C', value: 'c', recommended: true },
        ],
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toHaveLength(3);
        expect(result.data.options![0]).toEqual({ id: 'opt-1', label: 'Option A', value: 'a' });
        expect(result.data.options![1]).toEqual({
          id: 'opt-2',
          label: 'Option B',
          value: 'b',
          description: 'Second choice',
        });
        expect(result.data.options![2]).toEqual({
          id: 'opt-3',
          label: 'Option C',
          value: 'c',
          recommended: true,
        });
      }
    });

    it('accepts empty options array', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Choose an option',
        createdAt: validTimestamp,
        options: [],
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([]);
      }
    });

    it('rejects invalid DecisionOption - missing id', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Choose an option',
        createdAt: validTimestamp,
        options: [{ label: 'Option A', value: 'a' }],
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects invalid DecisionOption - missing label', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Choose an option',
        createdAt: validTimestamp,
        options: [{ id: 'opt-1', value: 'a' }],
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects invalid DecisionOption - missing value', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Choose an option',
        createdAt: validTimestamp,
        options: [{ id: 'opt-1', label: 'Option A' }],
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects invalid DecisionOption - empty id', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Choose an option',
        createdAt: validTimestamp,
        options: [{ id: '', label: 'Option A', value: 'a' }],
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects non-array options', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Choose an option',
        createdAt: validTimestamp,
        options: { id: 'opt-1', label: 'Option A', value: 'a' },
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Timestamp validation', () => {
    it('requires createdAt timestamp', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('accepts valid createdAt ISO timestamp', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: '2024-01-15T10:30:00.123Z',
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('accepts expiresAt as optional', () => {
      const itemWithExpires = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
        expiresAt: validExpiresAt,
      };

      const result = DecisionQueueItemSchema.safeParse(itemWithExpires);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresAt).toBe(validExpiresAt);
      }
    });

    it('allows missing expiresAt', () => {
      const itemWithoutExpires = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
      };

      const result = DecisionQueueItemSchema.safeParse(itemWithoutExpires);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresAt).toBeUndefined();
      }
    });

    it('rejects invalid createdAt format', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: '2024-01-15', // Missing time component
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects invalid expiresAt format', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
        expiresAt: 'tomorrow', // Invalid format
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('accepts timestamp with timezone offset', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: '2024-01-15T10:30:00+05:30',
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('accepts timestamp with milliseconds', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: '2024-01-15T10:30:00.999Z',
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });

  describe('issueNumber validation', () => {
    it('accepts positive integer', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
        issueNumber: 1,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('rejects zero issueNumber', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
        issueNumber: 0,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects negative issueNumber', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
        issueNumber: -5,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer issueNumber', () => {
      const item = {
        id: 'queue-item-123',
        urgency: 'blocking_now',
        type: 'decision',
        content: 'Some content',
        createdAt: validTimestamp,
        issueNumber: 3.14,
      };

      const result = DecisionQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation functions', () => {
  const validItem = {
    id: 'queue-item-123',
    urgency: 'blocking_now',
    type: 'decision',
    content: 'Some content',
    createdAt: '2024-01-15T10:30:00Z',
  };

  describe('parseDecisionQueueItem', () => {
    it('returns parsed data for valid input', () => {
      const result = parseDecisionQueueItem(validItem);
      expect(result.id).toBe('queue-item-123');
    });

    it('throws error for invalid input', () => {
      expect(() => parseDecisionQueueItem({})).toThrow();
    });
  });

  describe('safeParseDecisionQueueItem', () => {
    it('returns success result for valid input', () => {
      const result = safeParseDecisionQueueItem(validItem);
      expect(result.success).toBe(true);
    });

    it('returns failure result for invalid input', () => {
      const result = safeParseDecisionQueueItem({});
      expect(result.success).toBe(false);
    });
  });
});
