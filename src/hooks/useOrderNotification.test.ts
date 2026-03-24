import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  requestNotificationPermission,
  notifyNewOrder,
  notifyOrderStatusChanged,
} from './useOrderNotification'

describe('requestNotificationPermission', () => {
  const originalNotification = globalThis.Notification

  afterEach(() => {
    Object.defineProperty(globalThis, 'Notification', {
      value: originalNotification,
      writable: true,
      configurable: true,
    })
  })

  it('should return undefined if Notification API not available', async () => {
    const saved = globalThis.Notification
    // @ts-expect-error — intentionally removing Notification for test
    delete (globalThis as Record<string, unknown>).Notification
    // Also remove from window (jsdom aliases globalThis → window)
    // @ts-expect-error
    delete (window as Record<string, unknown>).Notification
    const result = await requestNotificationPermission()
    expect(result).toBeUndefined()
    // restore
    Object.defineProperty(globalThis, 'Notification', {
      value: saved,
      writable: true,
      configurable: true,
    })
  })

  it('should request permission when status is default', async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue('granted')
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'default', requestPermission: mockRequestPermission },
      writable: true,
      configurable: true,
    })
    const result = await requestNotificationPermission()
    expect(mockRequestPermission).toHaveBeenCalledOnce()
    expect(result).toBe('granted')
  })

  it('should return current permission if already granted', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    })
    const result = await requestNotificationPermission()
    expect(result).toBe('granted')
  })

  it('should return current permission if denied', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'denied', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    })
    const result = await requestNotificationPermission()
    expect(result).toBe('denied')
  })
})

describe('notifyNewOrder', () => {
  let notificationSpy: ReturnType<typeof vi.fn>
  let vibrateSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    notificationSpy = vi.fn()
    Object.defineProperty(globalThis, 'Notification', {
      value: Object.assign(notificationSpy, { permission: 'granted' }),
      writable: true,
      configurable: true,
    })
    vibrateSpy = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should vibrate on new order regardless of visibility', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })

    notifyNewOrder('T1', 'order-123')
    expect(vibrateSpy).toHaveBeenCalledWith([200, 100, 200, 100, 400])
  })

  it('should show browser notification when tab is hidden', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })

    notifyNewOrder('T1', 'order-123')
    expect(notificationSpy).toHaveBeenCalledWith(
      '새 주문 — T1',
      expect.objectContaining({ body: '주문이 접수되었습니다. 확인해주세요.' }),
    )
  })

  it('should NOT show browser notification when tab is visible', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })

    notifyNewOrder('T1')
    expect(notificationSpy).not.toHaveBeenCalled()
  })
})

describe('notifyOrderStatusChanged', () => {
  let notificationSpy: ReturnType<typeof vi.fn>
  let vibrateSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    notificationSpy = vi.fn()
    Object.defineProperty(globalThis, 'Notification', {
      value: Object.assign(notificationSpy, { permission: 'granted' }),
      writable: true,
      configurable: true,
    })
    vibrateSpy = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should map status to Korean label', () => {
    notifyOrderStatusChanged('T1', 'order-1', 'confirmed')
    expect(notificationSpy).toHaveBeenCalledWith(
      '주문 확인됨 — T1',
      expect.objectContaining({ body: '주문 상태가 변경되었습니다.' }),
    )
  })

  it('should vibrate only for ready status', () => {
    notifyOrderStatusChanged('T1', 'order-1', 'ready')
    expect(vibrateSpy).toHaveBeenCalledWith([400, 100, 400])
  })

  it('should NOT vibrate for non-ready status', () => {
    notifyOrderStatusChanged('T1', 'order-1', 'confirmed')
    expect(vibrateSpy).not.toHaveBeenCalled()
  })

  it('should use raw status string for unknown statuses', () => {
    notifyOrderStatusChanged('T1', 'order-1', 'custom-status')
    expect(notificationSpy).toHaveBeenCalledWith(
      'custom-status — T1',
      expect.any(Object),
    )
  })
})
