import { z } from 'zod';
import { SemVerStringSchema } from '../common/version.js';
import { ISOTimestampSchema } from '../common/timestamps.js';

// JSON Schema placeholder (Record<string, unknown>)
const JsonSchemaSchema = z.record(z.string(), z.unknown());

// Tool Catalog Entry schema
export const ToolCatalogEntrySchema = z.object({
  name: z.string().min(1),
  version: SemVerStringSchema,
  description: z.string(),
  inputSchema: JsonSchemaSchema,
  outputSchema: JsonSchemaSchema.optional(),
  modes: z.array(z.string()).optional(),
});

export type ToolCatalogEntry = z.infer<typeof ToolCatalogEntrySchema>;

// Mode Restrictions schema
export const ModeRestrictionsSchema = z.object({
  maxConcurrentTools: z.number().int().positive().optional(),
  allowedCategories: z.array(z.string()).optional(),
});

export type ModeRestrictions = z.infer<typeof ModeRestrictionsSchema>;

// Mode Catalog Entry schema
export const ModeCatalogEntrySchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  defaultTools: z.array(z.string()),
  restrictions: ModeRestrictionsSchema.optional(),
});

export type ModeCatalogEntry = z.infer<typeof ModeCatalogEntrySchema>;

// Tool Catalog schema
export const ToolCatalogSchema = z.object({
  tools: z.array(ToolCatalogEntrySchema),
  modes: z.array(ModeCatalogEntrySchema),
  lastUpdated: ISOTimestampSchema,
});

export type ToolCatalog = z.infer<typeof ToolCatalogSchema>;

// Parse helpers
export const parseToolCatalogEntry = (data: unknown): ToolCatalogEntry =>
  ToolCatalogEntrySchema.parse(data);

export const safeParseToolCatalogEntry = (data: unknown) =>
  ToolCatalogEntrySchema.safeParse(data);

export const parseModeCatalogEntry = (data: unknown): ModeCatalogEntry =>
  ModeCatalogEntrySchema.parse(data);

export const safeParseModeCatalogEntry = (data: unknown) =>
  ModeCatalogEntrySchema.safeParse(data);

export const parseToolCatalog = (data: unknown): ToolCatalog =>
  ToolCatalogSchema.parse(data);

export const safeParseToolCatalog = (data: unknown) =>
  ToolCatalogSchema.safeParse(data);
