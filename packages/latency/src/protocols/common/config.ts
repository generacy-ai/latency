import { z } from 'zod';

// Base configuration schema - extensible with version tracking
export const BaseConfigSchema = z
  .object({
    version: z.string(),
  })
  .passthrough(); // Allow additional properties

export type BaseConfig = z.infer<typeof BaseConfigSchema>;
