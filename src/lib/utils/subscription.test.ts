import { describe, it, expect, vi, afterEach } from 'vitest'
import { getKstDateString, isStoreSubscriptionActive } from './subscription'

describe('getKstDateString', () => {
  it('should return YYYY-MM-DD format', () => {
    const result = getKstDateString(new Date('2026-03-22T00:00:00Z'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should convert UTC to KST (UTC+9)', () => {
    // 2026-03-21 23:00 UTC = 2026-03-22 08:00 KST
    const result = getKstDateString(new Date('2026-03-21T23:00:00Z'))
    expect(result).toBe('2026-03-22')
  })

  it('should handle midnight UTC (next day in KST)', () => {
    // 2026-01-01 00:00 UTC = 2026-01-01 09:00 KST
    const result = getKstDateString(new Date('2026-01-01T00:00:00Z'))
    expect(result).toBe('2026-01-01')
  })

  it('should use current date when no argument', () => {
    const result = getKstDateString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('isStoreSubscriptionActive', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false for null state', () => {
    expect(isStoreSubscriptionActive(null)).toBe(false)
  })

  it('should return false for undefined state', () => {
    expect(isStoreSubscriptionActive(undefined)).toBe(false)
  })

  it('should return false when is_active is false', () => {
    expect(isStoreSubscriptionActive({
      is_active: false,
      subscription_end: '2099-12-31',
    })).toBe(false)
  })

  it('should return true when active with null subscription_end (unlimited)', () => {
    expect(isStoreSubscriptionActive({
      is_active: true,
      subscription_end: null,
    })).toBe(true)
  })

  it('should return true when active with future subscription_end', () => {
    expect(isStoreSubscriptionActive({
      is_active: true,
      subscription_end: '2099-12-31',
    })).toBe(true)
  })

  it('should return false when active but subscription_end is in the past', () => {
    expect(isStoreSubscriptionActive({
      is_active: true,
      subscription_end: '2020-01-01',
    })).toBe(false)
  })
})
