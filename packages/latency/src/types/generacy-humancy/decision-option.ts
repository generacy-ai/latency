import { z } from 'zod';

/**
 * Extended decision option schema for generacy-humancy communication.
 * This extends the base DecisionOption from agency-humancy with additional fields:
 * - `value`: The actual value to use when this option is selected
 * - `recommended`: Indicates if this is the recommended option
 */
export const ExtendedDecisionOptionSchema = z.object({
  id: z.string().min(1, 'Option ID is required'),
  label: z.string().min(1, 'Option label is required'),
  value: z.string().min(1, 'Option value is required'),
  description: z.string().optional(),
  recommended: z.boolean().optional(),
}).strip();

export type ExtendedDecisionOption = z.infer<typeof ExtendedDecisionOptionSchema>;

export const parseExtendedDecisionOption = (data: unknown): ExtendedDecisionOption =>
  ExtendedDecisionOptionSchema.parse(data);

export const safeParseExtendedDecisionOption = (data: unknown) =>
  ExtendedDecisionOptionSchema.safeParse(data);
