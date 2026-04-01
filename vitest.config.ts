import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './test-reports/unit-coverage',
      include: [
        'src/lib/api/admin.ts',
        'src/lib/api/order.ts',
        'src/lib/api/menu.ts',
        'src/lib/api/menuAdmin.ts',
        'src/lib/api/waiting.ts',
        'src/lib/api/subscription.ts',
        'src/lib/utils/subscription.ts',
        'src/hooks/useOrderNotification.ts',
      ],
      exclude: ['src/test/**', '**/*.test.{ts,tsx}', '**/*.d.ts'],
    },
  },
})
