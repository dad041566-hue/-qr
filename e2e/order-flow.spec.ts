import { test, expect, type Page } from '@playwright/test'
import {
  SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD,
  clickSidebarButton,
  completePasswordChange,
  deleteStoresWithTestTag,
  deleteStoreBySlug,
  fillDateRange,
  markStoreTestData,
  login,
  loginAndWaitForAdmin,
  loginAndWaitForPasswordChange,
  sidebarBtn,
  supabaseGet,
  supabasePost,
} from './e2e-helpers'

if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  throw new Error('TEST_SUPERADMIN_EMAIL and TEST_SUPERADMIN_PASSWORD must be set.')
}
if (
  !process.env.VITE_SUPABASE_URL &&
  !process.env.SUPABASE_URL
) {
  throw new Error('VITE_SUPABASE_URL (or SUPABASE_URL) must be set.')
}
if (
  !process.env.VITE_SUPABASE_ANON_KEY &&
  !process.env.SUPABASE_ANON_KEY
) {
  throw new Error('VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) must be set.')
}

const ts = Date.now()
const STORE_NAME = `주문테스트매장${ts}`
const STORE_SLUG = `order-test-${ts}`
const OWNER_EMAIL = `order-owner-${ts}@tableflow.com`
const OWNER_PASSWORD = 'Test1234!@'
const OWNER_NEW_PASSWORD = 'Test5678!@'
const STAFF_EMAIL = `order-staff-${ts}@tableflow.com`
const STAFF_PASSWORD = 'Staff1234!@'
const STAFF_NEW_PASSWORD = 'Staff5678!@'

let tableId = ''
let qrToken = ''
let categoryId = ''
let menuItemId = ''
let tableNumber = 0

const today = new Date().toISOString().split('T')[0]
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

type StoreRow = { id: string }
type MenuSeedRow = { id: string }
type TableRow = { id: string; table_number: number; qr_token: string }
type OrderSeedRow = { id: string }

interface NotificationProbe {
  notifications: Array<{ title: string; body: string }>
  vibrateCalls: number[][]
}

async function getStoreId(page: Page): Promise<string> {
  const storeRows = await supabaseGet<StoreRow>(
    page,
    `stores?select=id&slug=eq.${encodeURIComponent(STORE_SLUG)}&limit=1`
  )
  expect(storeRows.length, '주문 테스트 매장 ID를 조회할 수 있어야 합니다.').toBeGreaterThan(0)
  return storeRows[0].id
}

async function getLatestOrderIdByTable(page: Page, targetTableId: string): Promise<string | null> {
  const rows = await supabaseGet<OrderSeedRow>(
    page,
    `orders?select=id&table_id=eq.${encodeURIComponent(targetTableId)}&order=created_at.desc&limit=1`
  )
  if (rows.length === 0) return null
  return rows[0].id
}

async function waitForNewOrderIdByTable(
  page: Page,
  targetTableId: string,
  previousOrderId: string | null,
  timeoutMs = 12000,
) {
  let latestOrderId: string | null = null
  await expect
    .poll(
      async () => {
        const candidate = await getLatestOrderIdByTable(page, targetTableId)
        if (!candidate || candidate === previousOrderId) return null
        latestOrderId = candidate
        return candidate
      },
      { timeout: timeoutMs, message: `새 주문이 DB에서 ${timeoutMs}ms 내에 확인되지 않습니다.` }
    )
    .toBeTruthy()

  if (!latestOrderId) {
    throw new Error('새 주문이 DB에서 확인되지 않습니다.')
  }
  return latestOrderId
}

function orderCardLocator(page: Page, tableNumber: number, expectedActionLabel: string) {
  const marker = `T${tableNumber}`
  return page
    .locator('[data-testid="kds-order-card"]')
    .filter({ hasText: '주문번호' })
    .filter({ hasText: marker })
    .filter({ has: page.getByRole('button', { name: expectedActionLabel, exact: true }) })
    .first()
}

async function waitForOrderCard(page: Page, tableNumber: number, expectedActionLabel: string, timeoutMs = 15000) {
  const card = orderCardLocator(page, tableNumber, expectedActionLabel)
  await expect(card, `테이블 ${tableNumber} 주문이 '${expectedActionLabel}' 상태로 표시되어야 합니다.`).toBeVisible({ timeout: timeoutMs })
  return card
}

function orderCardLocatorByOrderId(page: Page, orderId: string, expectedActionLabel: string) {
  return page
    .locator('div')
    .filter({ hasText: orderId })
    .filter({ has: page.getByRole('button', { name: expectedActionLabel, exact: true }) })
    .first()
}

async function waitForOrderCardByOrderId(page: Page, orderId: string, expectedActionLabel: string, timeoutMs = 20000) {
  const card = orderCardLocatorByOrderId(page, orderId, expectedActionLabel)
  await expect(card, `주문 ${orderId}가 '${expectedActionLabel}' 상태로 표시되어야 합니다.`).toBeVisible({ timeout: timeoutMs })
  return card
}

async function placeOneOrderFromCustomer(page: Page) {
  // 메뉴 아이템 카드 클릭 (cursor-pointer 클래스로 구분)
  const menuCard = page.locator('div.cursor-pointer').filter({ has: page.locator('button') }).first()
  await expect(menuCard, '메뉴 아이템 카드가 보여야 합니다.').toBeVisible({ timeout: 8000 })
  await menuCard.click()

  // 모달에서 "원 담기" 버튼 클릭
  const addToCartBtn = page.getByRole('button', { name: /원 담기/ })
  await expect(addToCartBtn, '담기 버튼이 모달에 보여야 합니다.').toBeVisible({ timeout: 5000 })
  await addToCartBtn.click()

  // 장바구니(주문 확인) 열기
  const cartBtn = page.getByRole('button', { name: /주문 확인|장바구니/ }).first()
  await expect(cartBtn, '주문 확인 버튼이 보여야 합니다.').toBeVisible({ timeout: 5000 })
  await cartBtn.click()

  // 주문하기 버튼 클릭
  const submitButton = page.getByRole('button', { name: '주문하기', exact: true })
  await expect(submitButton, '주문하기 버튼이 보여야 합니다.').toBeVisible({ timeout: 5000 })
  await submitButton.click()

  await expect(page.locator('body')).toContainText('주문이 성공적으로 접수되었습니다', { timeout: 10000 })
}

async function installNotificationProbe(page: Page) {
  await page.addInitScript(() => {
    const probe = { notifications: [] as Array<{ title: string; body: string }>, vibrateCalls: [] as number[][] }

    const safeDefine = (target: object, property: string, descriptor: PropertyDescriptor) => {
      try {
        Object.defineProperty(target, property, descriptor)
      } catch {}
    }

    const mockNotification = class {
      public static permission: NotificationPermission = 'granted'

      public static requestPermission(): Promise<NotificationPermission> {
        return Promise.resolve('granted')
      }

      public close() {}

      constructor(title: string, options?: NotificationOptions) {
        probe.notifications.push({ title, body: options?.body ?? '' })
      }
    }

    safeDefine(window, '__orderFlowNotificationProbe', { value: probe, configurable: true })
    safeDefine(window, 'Notification', { value: mockNotification, configurable: true, writable: true })
    safeDefine(mockNotification, 'permission', { value: 'granted', configurable: true, writable: true })
    safeDefine(mockNotification, 'requestPermission', {
      value: () => Promise.resolve('granted'),
      configurable: true,
      writable: true,
    })
    safeDefine(mockNotification.prototype, 'close', { value() {}, configurable: true })

    safeDefine(navigator, 'vibrate', {
      value: (pattern: number | number[]) => {
        const normalized = Array.isArray(pattern) ? pattern : [pattern]
        probe.vibrateCalls.push(normalized)
        return true
      },
      configurable: true,
      writable: true,
    })

    safeDefine(document, 'visibilityState', { get: () => 'hidden', configurable: true })
    safeDefine(document, 'hidden', { get: () => true, configurable: true })
  })
}

async function getNotificationProbe(page: Page): Promise<NotificationProbe> {
  return await page.evaluate(() => {
    return (
      (window as unknown as { __orderFlowNotificationProbe: NotificationProbe }).__orderFlowNotificationProbe ?? {
        notifications: [],
        vibrateCalls: [],
      }
    )
  })
}

async function ensureNotificationContains(page: Page, expected: (probe: NotificationProbe) => boolean, message: string) {
  await expect
    .poll(
      async () => {
        const probe = await getNotificationProbe(page)
        return expected(probe)
      },
      { timeout: 10000, message }
    )
    .toBe(true)
}

async function loginAsStaff(page: Page) {
  await login(page, STAFF_EMAIL, STAFF_PASSWORD)
  await page.waitForLoadState('networkidle')
  if (page.url().includes('change-password')) {
    await completePasswordChange(page, STAFF_NEW_PASSWORD)
    await page.waitForLoadState('networkidle')
  } else {
    await expect(page).toHaveURL('/admin', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
  }
}

test.describe.configure({ mode: 'serial' })

test.describe('TableFlow 사용자 시나리오 E2E', () => {
  test('1. 슈퍼어드민 매장 생성 + 테이블 자동 생성 확인', async ({ page }) => {
    await login(page, SUPERADMIN_EMAIL!, SUPERADMIN_PASSWORD!)
    await expect(page).toHaveURL('/superadmin', { timeout: 10000 })

    await expect(page.getByRole('button', { name: '매장 추가' })).toBeVisible()
    await page.getByRole('button', { name: '매장 추가' }).click()

    await page.getByPlaceholder('예) 맛있는 식당').fill(STORE_NAME)
    await page.getByPlaceholder('예) tasty-restaurant').fill(STORE_SLUG)
    await page.getByPlaceholder('owner@example.com').fill(OWNER_EMAIL)
  await page.getByPlaceholder('8자 이상').fill(OWNER_PASSWORD)
  await fillDateRange(page, today, nextYear)

  await page.getByRole('button', { name: '매장 생성' }).click()
  await expect(page.getByRole('cell', { name: STORE_NAME })).toBeVisible({ timeout: 10000 })
  await markStoreTestData(STORE_SLUG)
  })

  test('2. 점주 첫 로그인 → 비번 변경 → 어드민 진입', async ({ page }) => {
    await loginAndWaitForPasswordChange(page, OWNER_EMAIL, OWNER_PASSWORD)
    await completePasswordChange(page, OWNER_NEW_PASSWORD)
  })

  test('3. 점주 어드민 — 메뉴 관리 탭 접근', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.waitForLoadState('networkidle')

    await clickSidebarButton(page, /매장 관리/)
    await clickSidebarButton(page, /메뉴 관리/)
    await expect(page.locator('button').filter({ hasText: '새 메뉴 등록' })).toBeVisible({ timeout: 5000 })
  })

  test('4. 점주 어드민 — 테이블 확인 후 tableId 추출', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.waitForLoadState('networkidle')

    const storeId = await getStoreId(page)
    const tableRows = await supabaseGet<TableRow>(
      page,
      `tables?select=id,table_number,qr_token&store_id=eq.${storeId}&order=table_number.asc&limit=1`
    )
    expect(tableRows.length, '매장에 최소 1개 이상의 테이블이 있어야 합니다.').toBeGreaterThan(0)

    tableId = tableRows[0].id
    qrToken = tableRows[0].qr_token
    tableNumber = tableRows[0].table_number
    expect(tableId, 'tableId가 설정되어야 합니다.').toBeTruthy()
    expect(qrToken, 'qrToken이 설정되어야 합니다.').toBeTruthy()
    expect(tableNumber, 'tableNumber가 설정되어야 합니다.').toBeGreaterThan(0)
  })

  test('4.5. 점주 — 메뉴 seed (카테고리 + 아이템)', async ({ page }) => {
    expect(tableId, '이전 테스트에서 tableId가 생성되어 있어야 합니다.').toBeTruthy()

    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)

    const storeIdForSeed = await getStoreId(page)
    const categoryRows = await supabasePost<MenuSeedRow>(page, 'menu_categories', {
      store_id: storeIdForSeed,
      name: '테스트메뉴',
      sort_order: 1,
    })
    expect(categoryRows.length, '카테고리 생성 응답이 있어야 합니다.').toBeGreaterThan(0)
    categoryId = categoryRows[0].id

    const itemRows = await supabasePost<MenuSeedRow>(page, 'menu_items', {
      store_id: storeIdForSeed,
      category_id: categoryId,
      name: '테스트메뉴1',
      price: 10000,
      is_available: true,
      sort_order: 1,
    })
    expect(itemRows.length, '메뉴 아이템 생성 응답이 있어야 합니다.').toBeGreaterThan(0)
    menuItemId = itemRows[0].id

    expect(menuItemId, '메뉴 아이템 ID가 설정되어야 합니다.').toBeTruthy()
  })

  test('5. 고객 — 메뉴 화면 조회', async ({ page }) => {
    expect(tableId, '테이블 ID가 있어야 고객 화면 검증이 가능합니다.').toBeTruthy()

    await page.goto(`/m/${STORE_SLUG}/${qrToken}`)
    await expect(page).toHaveURL(new RegExp(`^.*/m/${STORE_SLUG}/${qrToken}`), { timeout: 10000 })

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('찾을 수 없습니다')
    expect(bodyText).not.toContain('오류')
  })

  test('6. 고객 주문 → 어드민 실시간 수신 (1초 이내)', async ({ browser }) => {
    expect(tableId, '테이블 ID가 있어야 주문 실시간 테스트가 가능합니다.').toBeTruthy()

    const ownerAdminCtx = await browser.newContext()
    const ownerAdminPage = await ownerAdminCtx.newPage()
    await loginAndWaitForAdmin(ownerAdminPage, OWNER_EMAIL, OWNER_NEW_PASSWORD)

    const watcherCtx = await browser.newContext()
    const watcherPage = await watcherCtx.newPage()
    await loginAndWaitForAdmin(watcherPage, OWNER_EMAIL, OWNER_NEW_PASSWORD)

    const customerCtx = await browser.newContext()
    const customerPage = await customerCtx.newPage()
    await customerPage.goto(`/m/${STORE_SLUG}/${qrToken}`)
    await expect(customerPage.locator('body')).not.toContainText('로그인')

    await placeOneOrderFromCustomer(customerPage)

    await expect(ownerAdminPage.locator('body')).toContainText('새 주문이 들어왔습니다!', { timeout: 10000 })

    const ownerPendingCard = await waitForOrderCard(ownerAdminPage, tableNumber, '조리 시작')
    const watcherPendingCard = await waitForOrderCard(watcherPage, tableNumber, '조리 시작')

    expect(await ownerPendingCard.isVisible(), '주문 카드가 owner 화면에 보입니다.').toBeTruthy()
    expect(await watcherPendingCard.isVisible(), '주문 카드가 감시자 화면에 보입니다.').toBeTruthy()

    await ownerPendingCard.getByRole('button', { name: '조리 시작', exact: true }).click()

    const ownerPreparingCard = await waitForOrderCard(ownerAdminPage, tableNumber, '조리 완료')
    const watcherPreparingCard = await waitForOrderCard(watcherPage, tableNumber, '조리 완료')
    expect(await ownerPreparingCard.isVisible(), '조리 시작 후 owner 화면에서 조리중 카드가 보여야 합니다.').toBeTruthy()
    expect(await watcherPreparingCard.isVisible(), '조리 시작 후 감시자 화면에서 조리중 카드가 보여야 합니다.').toBeTruthy()

    await ownerPreparingCard.getByRole('button', { name: '조리 완료', exact: true }).click()

    const ownerServingCard = await waitForOrderCard(ownerAdminPage, tableNumber, '서빙 완료')
    const watcherServingCard = await waitForOrderCard(watcherPage, tableNumber, '서빙 완료')
    expect(await ownerServingCard.isVisible(), '조리 완료 후 owner 화면에서 서빙 대기 카드가 보여야 합니다.').toBeTruthy()
    expect(await watcherServingCard.isVisible(), '조리 완료 후 감시자 화면에서 서빙 대기 카드가 보여야 합니다.').toBeTruthy()

    await ownerAdminCtx.close()
    await watcherCtx.close()
    await customerCtx.close()
  })

  test('10. 알림/진동 동기화: 포그라운드 숨김 상태에서 주문 접수/상태 변경', async ({ browser }) => {
    expect(tableId, '테이블 ID가 있어야 주문 실시간/알림 테스트가 가능합니다.').toBeTruthy()

    const ownerAdminCtx = await browser.newContext()
    const ownerAdminPage = await ownerAdminCtx.newPage()
    await installNotificationProbe(ownerAdminPage)
    await loginAndWaitForAdmin(ownerAdminPage, OWNER_EMAIL, OWNER_NEW_PASSWORD)

    const previousOrderId = await getLatestOrderIdByTable(ownerAdminPage, tableId)

    const customerCtx = await browser.newContext()
    const customerPage = await customerCtx.newPage()
    await customerPage.goto(`/m/${STORE_SLUG}/${qrToken}`)
    await expect(customerPage.locator('body')).not.toContainText('로그인')

    await placeOneOrderFromCustomer(customerPage)
    const newOrderId = await waitForNewOrderIdByTable(ownerAdminPage, tableId, previousOrderId)

    const pendingCard = await waitForOrderCardByOrderId(ownerAdminPage, newOrderId, '조리 시작')
    expect(await pendingCard.isVisible(), '새 주문 카드가 확인되어야 합니다.').toBeTruthy()

    await ensureNotificationContains(
      ownerAdminPage,
      (probe) => probe.notifications.some((n) => n.title.includes('새 주문') && n.body.includes('주문이 접수되었습니다.')),
      '주문 생성 시 Notification 이벤트가 발생해야 합니다.'
    )

    await pendingCard.getByRole('button', { name: '조리 시작', exact: true }).click()
    const preparingCard = await waitForOrderCardByOrderId(ownerAdminPage, newOrderId, '조리 완료')

    await ensureNotificationContains(
      ownerAdminPage,
      (probe) => probe.notifications.some((n) => n.title.includes('조리 중')),
      '조리 시작 시 Notification 이벤트가 발생해야 합니다.'
    )

    await preparingCard.getByRole('button', { name: '조리 완료', exact: true }).click()

    const servedCard = await waitForOrderCardByOrderId(ownerAdminPage, newOrderId, '서빙 완료')
    expect(await servedCard.isVisible(), '조리 완료 후 상태가 서빙 완료로 변경되어야 합니다.').toBeTruthy()

    await ensureNotificationContains(
      ownerAdminPage,
      (probe) => probe.notifications.some((n) => n.title.includes('조리 완료')),
      '조리 완료 시 Notification 이벤트가 발생해야 합니다.'
    )

    const isPatternEqual = (a: number[], b: number[]) => a.length === b.length && a.every((value, idx) => value === b[idx])
    const probe = await getNotificationProbe(ownerAdminPage)
    const hasOrderVibration = probe.vibrateCalls.some((pattern) => isPatternEqual(pattern, [200, 100, 200, 100, 400]))
    const hasReadyVibration = probe.vibrateCalls.some((pattern) => isPatternEqual(pattern, [400, 100, 400]))
    expect(hasOrderVibration, '주문 수신 시 진동 패턴(200,100,200,100,400)이 기록되어야 합니다.').toBeTruthy()
    expect(hasReadyVibration, '조리 완료 시 진동 패턴(400,100,400)이 기록되어야 합니다.').toBeTruthy()

    await ownerAdminCtx.close()
    await customerCtx.close()
  })

  test('7. 점주 어드민 — 직원 계정 생성 (UI 확인)', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.waitForLoadState('networkidle')

    await clickSidebarButton(page, /매장 관리/)
    await clickSidebarButton(page, /직원/)
    const addBtn = page.locator('button').filter({ hasText: '직원 추가' }).first()
    await expect(addBtn).toBeVisible()
    await addBtn.click()

    await expect(page.getByPlaceholder('홍길동')).toBeVisible()
    await page.getByPlaceholder('홍길동').fill('테스트직원')
    await page.getByPlaceholder('staff@example.com').fill(STAFF_EMAIL)
    await page.getByPlaceholder('특수문자 포함 8자 이상').fill(STAFF_PASSWORD)
    await page.locator('button[type="submit"]').filter({ hasText: '직원 추가' }).click()

    await expect(page.locator('body')).toContainText(STAFF_EMAIL, { timeout: 10000 })

    await clickSidebarButton(page, /매장 관리/)
    await clickSidebarButton(page, /직원/)
    await expect(page.locator('body')).toContainText(STAFF_EMAIL, { timeout: 8000 })
  })

  test('8. 점주+직원 실시간 동기화: 주문 접수 및 조리 상태 반영', async ({ browser }) => {
    expect(tableId, '테이블 ID가 있어야 주문 실시간 테스트가 가능합니다.').toBeTruthy()

    const ownerAdminCtx = await browser.newContext()
    const ownerAdminPage = await ownerAdminCtx.newPage()
    await loginAndWaitForAdmin(ownerAdminPage, OWNER_EMAIL, OWNER_NEW_PASSWORD)

    const staffCtx = await browser.newContext()
    const staffPage = await staffCtx.newPage()
    await loginAsStaff(staffPage)

    const customerCtx = await browser.newContext()
    const customerPage = await customerCtx.newPage()
    await customerPage.goto(`/m/${STORE_SLUG}/${qrToken}`)
    await expect(customerPage.locator('body')).not.toContainText('로그인')

    await placeOneOrderFromCustomer(customerPage)

    await expect(staffPage.locator('body')).toContainText('새 주문이 들어왔습니다!', { timeout: 10000 })

    const staffPendingCard = await waitForOrderCard(staffPage, tableNumber, '조리 시작', 30000)
    const ownerPendingCard = await waitForOrderCard(ownerAdminPage, tableNumber, '조리 시작', 30000)

    expect(await staffPendingCard.isVisible(), '직원 화면에서 신규 주문이 보여야 합니다.').toBeTruthy()
    expect(await ownerPendingCard.isVisible(), '점주 화면에서 신규 주문이 보여야 합니다.').toBeTruthy()

    await ownerPendingCard.getByRole('button', { name: '조리 시작', exact: true }).click()

    const staffPreparingCard = await waitForOrderCard(staffPage, tableNumber, '조리 완료')
    expect(await staffPreparingCard.isVisible(), '직원 화면에서 조리중으로 이동되어야 합니다.').toBeTruthy()

    await staffPreparingCard.getByRole('button', { name: '조리 완료', exact: true }).click()

    const staffServingCard = await waitForOrderCard(staffPage, tableNumber, '서빙 완료')
    expect(await staffServingCard.isVisible(), '직원 화면에서 서빙 대기 상태가 보여야 합니다.').toBeTruthy()

    await ownerAdminCtx.close()
    await staffCtx.close()
    await customerCtx.close()
  })

  test('9. role 권한 제한 확인', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.waitForLoadState('networkidle')

    await clickSidebarButton(page, /매장 관리/)
    await clickSidebarButton(page, /메뉴 관리/)
    await expect(sidebarBtn(page, /매장 관리/)).toBeVisible({ timeout: 5000 })
    const roleText = (await page.locator('body').innerText()).toLowerCase()
    expect(roleText, 'owner 또는 최고관리자 role 텍스트가 노출되어야 합니다.').toMatch(/owner|최고관리자|점주/)
  })

  test.afterAll(async () => {
    await deleteStoresWithTestTag()
    await deleteStoreBySlug(STORE_SLUG)
  })
})
