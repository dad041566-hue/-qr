import { vi } from 'vitest'

/**
 * Chainable Supabase query builder mock.
 * Usage:
 *   const mock = createQueryMock({ data: [...], error: null })
 *   vi.mocked(supabase.from).mockReturnValue(mock as any)
 */
export function createQueryMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  const proxy = new Proxy(chain, {
    get(_target, prop: string) {
      // Terminal methods — return the result
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result)
      }
      // All other methods return the proxy for chaining
      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(proxy)
      }
      return chain[prop]
    },
  })

  return proxy
}

/**
 * Mock supabase.rpc() — returns { data, error }
 */
export function createRpcMock(result: { data: unknown; error: unknown }) {
  return vi.fn().mockResolvedValue(result)
}

/**
 * Setup: vi.mock('@/lib/supabase') in each test file,
 * then import { supabase } from '@/lib/supabase' and mock .from() / .rpc()
 */
