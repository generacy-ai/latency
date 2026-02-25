import { z } from 'zod';
import { SemVerStringSchema, VersionRangeSchema } from '../../common/version.js';

// Channel Registration schema
export const ChannelRegistrationSchema = z.object({
  channelId: z.string().min(1),
  version: SemVerStringSchema,
  owner: z.string().min(1),
  messageTypes: z.array(z.string()).min(1),
  description: z.string().optional(),
});

export type ChannelRegistration = z.infer<typeof ChannelRegistrationSchema>;

// Channel Discovery query schema
export const ChannelDiscoverySchema = z.object({
  channelId: z.string().min(1),
  version: VersionRangeSchema.optional(),
});

export type ChannelDiscovery = z.infer<typeof ChannelDiscoverySchema>;

// Parse helpers
export const parseChannelRegistration = (data: unknown): ChannelRegistration =>
  ChannelRegistrationSchema.parse(data);

export const safeParseChannelRegistration = (data: unknown) =>
  ChannelRegistrationSchema.safeParse(data);

export const parseChannelDiscovery = (data: unknown): ChannelDiscovery =>
  ChannelDiscoverySchema.parse(data);

export const safeParseChannelDiscovery = (data: unknown) =>
  ChannelDiscoverySchema.safeParse(data);
