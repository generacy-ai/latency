import { z } from 'zod';

// ISO 8601 timestamp branded type
export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };

// ISO 8601 date-time regex (simplified but covers common formats)
// Matches: 2024-01-15T10:30:00Z, 2024-01-15T10:30:00.000Z, 2024-01-15T10:30:00+00:00
const ISO_TIMESTAMP_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export const ISOTimestampSchema = z
  .string()
  .regex(ISO_TIMESTAMP_REGEX, 'Invalid ISO 8601 timestamp format')
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date value' }
  )
  .transform((val) => val as ISOTimestamp);

// Utility to create a current timestamp
export function createTimestamp(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}
