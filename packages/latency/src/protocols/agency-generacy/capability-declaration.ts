import { z } from 'zod';
import { SemVerStringSchema } from '../common/version.js';

// Feature flags schema
export const FeaturesSchema = z.object({
  modes: z.boolean(),
  urgency: z.boolean(),
  batchQuestions: z.boolean(),
  channels: z.boolean(),
  telemetry: z.boolean(),
});

export type Features = z.infer<typeof FeaturesSchema>;

// Capability Declaration schema
export const CapabilityDeclarationSchema = z.object({
  features: FeaturesSchema,
  tools: z.array(z.string()),
  protocolVersion: SemVerStringSchema,
});

export type CapabilityDeclaration = z.infer<typeof CapabilityDeclarationSchema>;

// Parse helpers
export const parseCapabilityDeclaration = (data: unknown): CapabilityDeclaration =>
  CapabilityDeclarationSchema.parse(data);

export const safeParseCapabilityDeclaration = (data: unknown) =>
  CapabilityDeclarationSchema.safeParse(data);
