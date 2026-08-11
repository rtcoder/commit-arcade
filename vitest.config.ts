import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: 'jsdom',
          globals: false,
          include: ['extension/**/*.test.ts'],
          name: 'extension',
        },
      },
      {
        test: {
          environment: 'node',
          globals: false,
          include: ['scripts/**/*.test.ts'],
          name: 'scripts',
        },
      },
    ],
  },
});
