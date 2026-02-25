import { describe, it, expect } from 'vitest';
import {
  WebhookEvent,
  WebhookEventSchema,
  WebhookEventIdSchema,
  WebhookEventTypeSchema,
  WebhookSenderSchema,
  generateWebhookEventId,
  parseWebhookEvent,
  safeParseWebhookEvent,
} from '../webhook-event.js';

describe('WebhookEventIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = WebhookEventIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(WebhookEventIdSchema.safeParse('invalid').success).toBe(false);
    expect(WebhookEventIdSchema.safeParse('').success).toBe(false);
  });
});

describe('generateWebhookEventId', () => {
  it('generates valid ULID', () => {
    const id = generateWebhookEventId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);

    const result = WebhookEventIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const id1 = generateWebhookEventId();
    const id2 = generateWebhookEventId();
    expect(id1).not.toBe(id2);
  });
});

describe('WebhookEventTypeSchema', () => {
  describe('repository events', () => {
    it('accepts push event', () => {
      expect(WebhookEventTypeSchema.safeParse('push').success).toBe(true);
    });

    it('accepts repository events', () => {
      expect(WebhookEventTypeSchema.safeParse('create').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('delete').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('fork').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('release').success).toBe(true);
    });
  });

  describe('issue events', () => {
    it('accepts issue-related events', () => {
      expect(WebhookEventTypeSchema.safeParse('issues').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('issue_comment').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('label').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('milestone').success).toBe(true);
    });
  });

  describe('pull request events', () => {
    it('accepts pull request events', () => {
      expect(WebhookEventTypeSchema.safeParse('pull_request').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('pull_request_review').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('pull_request_review_comment').success).toBe(true);
    });
  });

  describe('actions events', () => {
    it('accepts workflow and check events', () => {
      expect(WebhookEventTypeSchema.safeParse('workflow_run').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('workflow_job').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('check_run').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('check_suite').success).toBe(true);
    });
  });

  describe('installation events', () => {
    it('accepts app installation events', () => {
      expect(WebhookEventTypeSchema.safeParse('installation').success).toBe(true);
      expect(WebhookEventTypeSchema.safeParse('installation_repositories').success).toBe(true);
    });
  });

  it('rejects invalid event types', () => {
    expect(WebhookEventTypeSchema.safeParse('invalid').success).toBe(false);
    expect(WebhookEventTypeSchema.safeParse('PUSH').success).toBe(false);
    expect(WebhookEventTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('WebhookSenderSchema', () => {
  const validSender = {
    id: 12345,
    login: 'octocat',
    type: 'User',
  };

  it('accepts valid user sender', () => {
    const result = WebhookSenderSchema.safeParse(validSender);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.login).toBe('octocat');
      expect(result.data.type).toBe('User');
    }
  });

  it('accepts bot sender', () => {
    const botSender = { ...validSender, type: 'Bot', login: 'github-actions[bot]' };
    const result = WebhookSenderSchema.safeParse(botSender);
    expect(result.success).toBe(true);
  });

  it('accepts organization sender', () => {
    const orgSender = { ...validSender, type: 'Organization', login: 'github' };
    const result = WebhookSenderSchema.safeParse(orgSender);
    expect(result.success).toBe(true);
  });

  it('accepts optional URL fields', () => {
    const senderWithUrls = {
      ...validSender,
      avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
      htmlUrl: 'https://github.com/octocat',
    };
    const result = WebhookSenderSchema.safeParse(senderWithUrls);
    expect(result.success).toBe(true);
  });

  it('rejects invalid sender type', () => {
    const sender = { ...validSender, type: 'Invalid' };
    const result = WebhookSenderSchema.safeParse(sender);
    expect(result.success).toBe(false);
  });

  it('rejects empty login', () => {
    const sender = { ...validSender, login: '' };
    const result = WebhookSenderSchema.safeParse(sender);
    expect(result.success).toBe(false);
  });

  it('rejects non-positive ID', () => {
    expect(WebhookSenderSchema.safeParse({ ...validSender, id: 0 }).success).toBe(false);
    expect(WebhookSenderSchema.safeParse({ ...validSender, id: -1 }).success).toBe(false);
  });
});

describe('WebhookEventSchema', () => {
  const validEvent = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    type: 'push',
    action: null,
    payload: { ref: 'refs/heads/main', commits: [] },
    sender: {
      id: 12345,
      login: 'octocat',
      type: 'User',
    },
    receivedAt: '2024-01-15T10:30:00Z',
    deliveryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  };

  describe('valid events', () => {
    it('accepts valid webhook event', () => {
      const result = WebhookEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.type).toBe('push');
        expect(result.data.action).toBeNull();
        expect(result.data.processed).toBe(false);
      }
    });

    it('accepts event with action', () => {
      const issueEvent = {
        ...validEvent,
        type: 'issues',
        action: 'opened',
        payload: { issue: { number: 1, title: 'Test issue' } },
      };
      const result = WebhookEventSchema.safeParse(issueEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.action).toBe('opened');
      }
    });

    it('accepts event with optional fields', () => {
      const eventWithOptionals = {
        ...validEvent,
        hookId: '12345678',
        installationId: '87654321',
        processed: true,
        processedAt: '2024-01-15T10:31:00Z',
      };
      const result = WebhookEventSchema.safeParse(eventWithOptionals);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hookId).toBe('12345678');
        expect(result.data.processed).toBe(true);
      }
    });

    it('accepts event with processing error', () => {
      const failedEvent = {
        ...validEvent,
        processed: true,
        processingError: 'Failed to process webhook',
        processedAt: '2024-01-15T10:31:00Z',
      };
      const result = WebhookEventSchema.safeParse(failedEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingError).toBe('Failed to process webhook');
      }
    });

    it('accepts pull request event', () => {
      const prEvent = {
        ...validEvent,
        type: 'pull_request',
        action: 'opened',
        payload: { pull_request: { number: 42 }, action: 'opened' },
      };
      const result = WebhookEventSchema.safeParse(prEvent);
      expect(result.success).toBe(true);
    });

    it('accepts installation event', () => {
      const installEvent = {
        ...validEvent,
        type: 'installation',
        action: 'created',
        payload: { installation: { id: 12345 }, action: 'created' },
      };
      const result = WebhookEventSchema.safeParse(installEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid events', () => {
    it('rejects invalid event type', () => {
      const event = { ...validEvent, type: 'invalid' };
      const result = WebhookEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects invalid ID format', () => {
      const event = { ...validEvent, id: 'invalid' };
      const result = WebhookEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects invalid delivery ID (not UUID)', () => {
      const event = { ...validEvent, deliveryId: 'not-a-uuid' };
      const result = WebhookEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp', () => {
      const event = { ...validEvent, receivedAt: 'invalid' };
      const result = WebhookEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects invalid sender', () => {
      const event = { ...validEvent, sender: { id: 'not-a-number', login: 'test', type: 'User' } };
      const result = WebhookEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(WebhookEventSchema.safeParse({}).success).toBe(false);
      expect(WebhookEventSchema.safeParse({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }).success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = WebhookEvent.V1.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = WebhookEvent.getVersion('v1');
      const result = schema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(WebhookEvent.Latest).toBe(WebhookEvent.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseWebhookEvent returns valid event', () => {
      const event = parseWebhookEvent(validEvent);
      expect(event.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('parseWebhookEvent throws on invalid data', () => {
      expect(() => parseWebhookEvent({})).toThrow();
    });

    it('safeParseWebhookEvent returns success result', () => {
      const result = safeParseWebhookEvent(validEvent);
      expect(result.success).toBe(true);
    });

    it('safeParseWebhookEvent returns failure result', () => {
      const result = safeParseWebhookEvent({});
      expect(result.success).toBe(false);
    });
  });
});
