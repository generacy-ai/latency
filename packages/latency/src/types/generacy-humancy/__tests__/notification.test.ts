import { describe, it, expect } from 'vitest';
import {
  NotificationSchema,
  NotificationTypeSchema,
  NotificationUrgencySchema,
  parseNotification,
  safeParseNotification,
} from '../notification.js';

describe('NotificationSchema', () => {
  const validTimestamp = '2024-01-15T10:30:00Z';
  const validFullNotification = {
    id: 'notif-123',
    type: 'info',
    urgency: 'medium',
    title: 'Test Notification',
    message: 'This is a test notification message',
    actionUrl: 'https://example.com/action',
    actionLabel: 'Take Action',
    createdAt: validTimestamp,
    expiresAt: '2024-01-16T10:30:00Z',
    dismissible: true,
  };

  const validMinimalNotification = {
    id: 'notif-456',
    type: 'warning',
    urgency: 'low',
    title: 'Minimal Notification',
    message: 'A minimal notification',
    createdAt: validTimestamp,
    dismissible: false,
  };

  describe('Valid data parsing', () => {
    it('accepts full object with all fields', () => {
      const result = NotificationSchema.safeParse(validFullNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validFullNotification);
      }
    });

    it('accepts minimal object with only required fields', () => {
      const result = NotificationSchema.safeParse(validMinimalNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('notif-456');
        expect(result.data.type).toBe('warning');
        expect(result.data.urgency).toBe('low');
        expect(result.data.actionUrl).toBeUndefined();
        expect(result.data.actionLabel).toBeUndefined();
        expect(result.data.expiresAt).toBeUndefined();
      }
    });
  });

  describe('Invalid data rejection', () => {
    it('rejects missing required field: id', () => {
      const { id, ...withoutId } = validMinimalNotification;
      const result = NotificationSchema.safeParse(withoutId);
      expect(result.success).toBe(false);
    });

    it('rejects missing required field: type', () => {
      const { type, ...withoutType } = validMinimalNotification;
      const result = NotificationSchema.safeParse(withoutType);
      expect(result.success).toBe(false);
    });

    it('rejects missing required field: urgency', () => {
      const { urgency, ...withoutUrgency } = validMinimalNotification;
      const result = NotificationSchema.safeParse(withoutUrgency);
      expect(result.success).toBe(false);
    });

    it('rejects missing required field: title', () => {
      const { title, ...withoutTitle } = validMinimalNotification;
      const result = NotificationSchema.safeParse(withoutTitle);
      expect(result.success).toBe(false);
    });

    it('rejects missing required field: message', () => {
      const { message, ...withoutMessage } = validMinimalNotification;
      const result = NotificationSchema.safeParse(withoutMessage);
      expect(result.success).toBe(false);
    });

    it('rejects missing required field: createdAt', () => {
      const { createdAt, ...withoutCreatedAt } = validMinimalNotification;
      const result = NotificationSchema.safeParse(withoutCreatedAt);
      expect(result.success).toBe(false);
    });

    it('rejects missing required field: dismissible', () => {
      const { dismissible, ...withoutDismissible } = validMinimalNotification;
      const result = NotificationSchema.safeParse(withoutDismissible);
      expect(result.success).toBe(false);
    });

    it('rejects empty string for id', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        id: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty string for title', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        title: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty string for message', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        message: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects wrong enum value for type', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        type: 'critical',
      });
      expect(result.success).toBe(false);
    });

    it('rejects wrong enum value for urgency', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        urgency: 'urgent',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('NotificationTypeSchema enum validation', () => {
    it('accepts "info"', () => {
      const result = NotificationTypeSchema.safeParse('info');
      expect(result.success).toBe(true);
    });

    it('accepts "warning"', () => {
      const result = NotificationTypeSchema.safeParse('warning');
      expect(result.success).toBe(true);
    });

    it('accepts "error"', () => {
      const result = NotificationTypeSchema.safeParse('error');
      expect(result.success).toBe(true);
    });

    it('accepts "success"', () => {
      const result = NotificationTypeSchema.safeParse('success');
      expect(result.success).toBe(true);
    });

    it('rejects invalid type value', () => {
      const result = NotificationTypeSchema.safeParse('alert');
      expect(result.success).toBe(false);
    });
  });

  describe('NotificationUrgencySchema enum validation', () => {
    it('accepts "low"', () => {
      const result = NotificationUrgencySchema.safeParse('low');
      expect(result.success).toBe(true);
    });

    it('accepts "medium"', () => {
      const result = NotificationUrgencySchema.safeParse('medium');
      expect(result.success).toBe(true);
    });

    it('accepts "high"', () => {
      const result = NotificationUrgencySchema.safeParse('high');
      expect(result.success).toBe(true);
    });

    it('rejects invalid urgency value', () => {
      const result = NotificationUrgencySchema.safeParse('critical');
      expect(result.success).toBe(false);
    });
  });

  describe('Strip behavior', () => {
    it('removes extra unknown properties', () => {
      const dataWithExtra = {
        ...validMinimalNotification,
        unknownField: 'should be removed',
        anotherExtra: 123,
      };
      const result = NotificationSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
        expect(result.data).not.toHaveProperty('anotherExtra');
        expect(Object.keys(result.data)).toEqual([
          'id',
          'type',
          'urgency',
          'title',
          'message',
          'createdAt',
          'dismissible',
        ]);
      }
    });
  });

  describe('URL validation', () => {
    it('accepts valid URL for actionUrl', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        actionUrl: 'https://example.com/path?query=value',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid URL with different protocols', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        actionUrl: 'http://localhost:3000/action',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL for actionUrl', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        actionUrl: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects URL missing protocol', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        actionUrl: 'example.com/path',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Dismissible boolean validation', () => {
    it('accepts true for dismissible', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        dismissible: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dismissible).toBe(true);
      }
    });

    it('accepts false for dismissible', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        dismissible: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dismissible).toBe(false);
      }
    });

    it('rejects non-boolean for dismissible', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        dismissible: 'true',
      });
      expect(result.success).toBe(false);
    });

    it('rejects number for dismissible', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        dismissible: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Optional field handling', () => {
    it('accepts undefined actionUrl', () => {
      const result = NotificationSchema.safeParse(validMinimalNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionUrl).toBeUndefined();
      }
    });

    it('accepts undefined actionLabel', () => {
      const result = NotificationSchema.safeParse(validMinimalNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actionLabel).toBeUndefined();
      }
    });

    it('accepts undefined expiresAt', () => {
      const result = NotificationSchema.safeParse(validMinimalNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresAt).toBeUndefined();
      }
    });

    it('accepts valid expiresAt timestamp', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid expiresAt timestamp format', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        expiresAt: '2024-12-31',
      });
      expect(result.success).toBe(false);
    });

    it('accepts actionLabel without actionUrl', () => {
      const result = NotificationSchema.safeParse({
        ...validMinimalNotification,
        actionLabel: 'Click here',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Helper functions', () => {
    it('parseNotification returns parsed data for valid input', () => {
      const result = parseNotification(validFullNotification);
      expect(result.id).toBe('notif-123');
      expect(result.type).toBe('info');
    });

    it('parseNotification throws for invalid input', () => {
      expect(() => parseNotification({ invalid: 'data' })).toThrow();
    });

    it('safeParseNotification returns success object for valid input', () => {
      const result = safeParseNotification(validMinimalNotification);
      expect(result.success).toBe(true);
    });

    it('safeParseNotification returns error object for invalid input', () => {
      const result = safeParseNotification({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
