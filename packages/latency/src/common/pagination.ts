import { z } from 'zod';

// Pagination parameters for requests
export const PaginationParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  cursor: z.string().optional(),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

// Generic paginated response wrapper
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    hasMore: z.boolean(),
    nextCursor: z.string().optional(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
};
