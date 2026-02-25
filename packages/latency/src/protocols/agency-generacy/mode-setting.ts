import { z } from 'zod';

// Mode Setting Request schema
export const ModeSettingRequestSchema = z.object({
  mode: z.string().min(1),
  context: z.string().optional(),
  duration: z.number().int().positive().optional(),
  timeout: z.number().int().positive().optional(),
});

export type ModeSettingRequest = z.infer<typeof ModeSettingRequestSchema>;

// Mode Setting Success Response schema
export const ModeSettingResponseSchema = z.object({
  success: z.literal(true),
  activeMode: z.string().min(1),
  availableTools: z.array(z.string()),
});

export type ModeSettingResponse = z.infer<typeof ModeSettingResponseSchema>;

// Parse helpers
export const parseModeSettingRequest = (data: unknown): ModeSettingRequest =>
  ModeSettingRequestSchema.parse(data);

export const safeParseModeSettingRequest = (data: unknown) =>
  ModeSettingRequestSchema.safeParse(data);

export const parseModeSettingResponse = (data: unknown): ModeSettingResponse =>
  ModeSettingResponseSchema.parse(data);

export const safeParseModeSettingResponse = (data: unknown) =>
  ModeSettingResponseSchema.safeParse(data);
