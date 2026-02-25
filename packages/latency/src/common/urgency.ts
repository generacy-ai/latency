import { z } from 'zod';

// Urgency levels for prioritizing requests/notifications
export const Urgency = {
  BLOCKING_NOW: 'blocking_now',
  BLOCKING_SOON: 'blocking_soon',
  WHEN_AVAILABLE: 'when_available',
} as const;

export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const UrgencySchema = z.enum([
  'blocking_now',
  'blocking_soon',
  'when_available',
]);
