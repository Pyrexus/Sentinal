import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['apps/**/*.test.{ts,tsx}', 'shared/**/*.test.ts'], restoreMocks: true },
});
