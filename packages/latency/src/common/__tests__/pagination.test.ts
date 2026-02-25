import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  PaginationParamsSchema,
  PaginatedResponseSchema,
} from '../pagination.js';

describe('PaginationParamsSchema', () => {
  it('accepts valid pagination params', () => {
    const result = PaginationParamsSchema.safeParse({
      limit: 50,
      offset: 10,
      cursor: 'abc123',
    });
    expect(result.success).toBe(true);
  });

  it('applies default values', () => {
    const result = PaginationParamsSchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.cursor).toBeUndefined();
  });

  it('rejects limit > 100', () => {
    const result = PaginationParamsSchema.safeParse({
      limit: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects limit < 1', () => {
    const result = PaginationParamsSchema.safeParse({
      limit: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative offset', () => {
    const result = PaginationParamsSchema.safeParse({
      offset: -1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts boundary values', () => {
    const result = PaginationParamsSchema.safeParse({
      limit: 100,
      offset: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe('PaginatedResponseSchema', () => {
  const stringItemSchema = PaginatedResponseSchema(z.string());

  it('accepts valid paginated response', () => {
    const result = stringItemSchema.safeParse({
      items: ['a', 'b', 'c'],
      total: 100,
      hasMore: true,
      nextCursor: 'cursor123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts response without nextCursor', () => {
    const result = stringItemSchema.safeParse({
      items: ['a'],
      total: 1,
      hasMore: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty items array', () => {
    const result = stringItemSchema.safeParse({
      items: [],
      total: 0,
      hasMore: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = stringItemSchema.safeParse({
      items: ['a'],
      // missing total and hasMore
    });
    expect(result.success).toBe(false);
  });

  it('validates item types', () => {
    const result = stringItemSchema.safeParse({
      items: [1, 2, 3], // should be strings
      total: 3,
      hasMore: false,
    });
    expect(result.success).toBe(false);
  });
});
