import { describe, expect, it, vi } from 'vitest';
import { createRepository } from './repository';

const driver = vi.hoisted(() => ({
  unsafe: vi.fn(),
  end: vi.fn(async () => {}),
}));

vi.mock('postgres', () => ({
  default: () => ({ ...driver, options: { parsers: {}, serializers: {} } }),
}));

describe('Postgres rate-limit parameter serialization', () => {
  it('passes serialized timestamps through Drizzle to the postgres driver', async () => {
    const now = Date.parse('2026-10-28T12:00:00Z');
    const expiry = new Date(now + 60000).toISOString();
    driver.unsafe.mockImplementation((_query: string, params: unknown[]) => {
      // postgres-js expects Drizzle to encode Date values before driver binding.
      expect(params.some(value => value instanceof Date)).toBe(false);
      expect(params).toContain(new Date(now).toISOString());
      expect(params).toContain(expiry);
      return { values: async () => [['test-limit', 1, expiry]] };
    });
    const repository = createRepository({
      FIREBASE_PROJECT_ID: 'sentinel-test',
      HYPERDRIVE: { connectionString: 'postgres://localhost/test' },
    });
    try {
      await expect(repository.consumeRateLimit('test-limit', 2, 60000, now)).resolves.toEqual({
        allowed: true, remaining: 1, retryAfter: 60,
      });
      expect(driver.unsafe).toHaveBeenCalledOnce();
    } finally {
      await repository.close();
    }
  });
});
