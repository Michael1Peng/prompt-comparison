import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/setup.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules/', 'dist/', 'tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/models': resolve(__dirname, './src/models'),
      '@/services': resolve(__dirname, './src/services'),
      '@/cli': resolve(__dirname, './src/cli'),
      '@/lib': resolve(__dirname, './src/lib'),
    },
  },
});