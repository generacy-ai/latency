import { z } from 'zod';
import { ISOTimestampSchema } from '../../common/timestamps.js';

export const NotificationType = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export const NotificationTypeSchema = z.enum(['info', 'warning', 'error', 'success']);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationUrgency = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const NotificationUrgencySchema = z.enum(['low', 'medium', 'high']);
export type NotificationUrgency = z.infer<typeof NotificationUrgencySchema>;

export const NotificationSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
  type: NotificationTypeSchema,
  urgency: NotificationUrgencySchema,
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().optional(),
  createdAt: ISOTimestampSchema,
  expiresAt: ISOTimestampSchema.optional(),
  dismissible: z.boolean(),
}).strip();

export type Notification = z.infer<typeof NotificationSchema>;

export const parseNotification = (data: unknown): Notification =>
  NotificationSchema.parse(data);

export const safeParseNotification = (data: unknown) =>
  NotificationSchema.safeParse(data);
