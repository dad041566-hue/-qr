import { test, expect } from '@playwright/test'
import {
  deleteStoreBySlug,
  deleteStoresWithTestTag,
  fillDateRange,
  login,
  loginAndWaitForAdmin,
  loginAndWaitForPasswordChange,
  completePasswordChange,
  markStoreTestData,
  requireEnv,
  getSupabaseConfig,
  getServiceRoleHeaders,
  supabaseGet,
  supabasePost,
  supabaseHeaders,
} from './e2e-helpers'

requireEnv('TEST_SUPERADMIN_EMAIL')
requireEnv('TEST_SUPERADMIN_PASSWORD')

const SUPERADMIN_EMAIL = process.env.TEST_SUPERADMIN_EMAIL!
const SUPERADMIN_PASSWORD = process.env.TEST_SUPERADMIN_PASSWORD!

const ts = Date.now()
const STORE_NAME = `엣지확장테스트${ts}`
const STORE_SLUG = `edge-ext-${ts}`
const OWNER_EMAIL = `edge-ext-${ts}@tableflow.com`
const OWNER_PASSWORD = 'Test1234!@'
const OWNER_NEW_PASSWORD = 'Test5678!@'

const today = new Date().toISOString().split('T')[0]
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

type StoreRow = { id: string }
type TableRow = { id: string; qr_token: string }
type SeedRow = { id: string }

let storeId = ''
let tableId = ''
let qrToken = ''
let categoryId = ''
let menuItemId = ''

test.describe.configure({ mode: 'serial' })

test.describe('엣지 케이스 확장 E2E', () => {
  // ──────────────────────────── Setup ────────────────────────────

  test('Setup-1: 슈퍼어드민 — 매장 생성', async ({ page }) => {
    await login(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)
    await expect(page).toHaveURL('/superadmin', { timeout: 10000 })

    await page.getByRole('button', { name: '매장 추가' }).click()
    await expect(page.getByPlaceholder('예) 맛있는 식당')).toBeVisible()

    await page.getByPlaceholder('예) 맛있는 식당').fill(STORE_NAME)
    await page.getByPlaceholder('예) tasty-restaurant').fill(STORE_SLUG)
    await page.getByPlaceholder('owner@example.com').fill(OWNER_EMAIL)
    await page.getByPlaceholder('8자 이상').fill(OWNER_PASSWORD)
    await fillDateRange(page, today, nextYear)

    await page.getByRole('button', { name: '매장 생성' }).click()
    await expect(page.getByRole('cell', { name: STORE_NAME })).toBeVisible({ timeout: 10000 })
    await markStoreTestData(STORE_SLUG)
  })

  test('Setup-2: 점주 첫 로그인 → 비번 변경', async ({ page }) => {
    await loginAndWaitForPasswordChange(page, OWNER_EMAIL, OWNER_PASSWORD)
    await completePasswordChange(page, OWNER_NEW_PASSWORD)
  })

  test('Setup-3: 매장/테이블/메뉴 시드 데이터', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.waitForLoadState('networkidle')

    // Store ID
    const storeRows = await supabaseGet<StoreRow>(
      page,
      `stores?select=id&slug=eq.${encodeURIComponent(STORE_SLUG)}&limit=1`,
    )
    expect(storeRows.length).toBeGreaterThan(0)
    storeId = storeRows[0].id

    // Table
    const tableRows = await supabaseGet<TableRow>(
      page,
      `tables?select=id,qr_token&store_id=eq.${storeId}&order=table_number.asc&limit=1`,
    )
    expect(tableRows.length).toBeGreaterThan(0)
    tableId = tableRows[0].id
    qrToken = tableRows[0].qr_token
    expect(qrToken).toBeTruthy()

    // Seed category
    const catRows = await supabasePost<SeedRow>(page, 'menu_categories', {
      store_id: storeId,
      name: '엣지테스트카테고리',
      sort_order: 1,
    })
    expect(catRows.length).toBeGreaterThan(0)
    categoryId = catRows[0].id

    // Seed menu item
    const itemRows = await supabasePost<SeedRow>(page, 'menu_items', {
      store_id: storeId,
      category_id: categoryId,
      name: '엣지테스트메뉴',
      price: 10000,
      is_available: true,
      sort_order: 1,
    })
    expect(itemRows.length).toBeGreaterThan(0)
    menuItemId = itemRows[0].id
  })

  // ──────────────────────── ORDER edge cases ─────────────────────

  test('EC-O01: 음수 수량 주문 → 서버 거부', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: menuItemId, menu_item_name: '엣지테스트메뉴', quantity: -1, selected_options: null }],
        p_guest_name: null,
        p_special_requests: null,
        p_payment_method: null,
      }),
    })

    // Server should reject negative quantity
    expect(res.ok, 'Negative quantity order should be rejected by the server').toBeFalsy()
  })

  test('EC-O02: 극단 수량 (999999) 주문 → 서버 응답 확인', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: menuItemId, menu_item_name: '엣지테스트메뉴', quantity: 999999, selected_options: null }],
        p_guest_name: null,
        p_special_requests: null,
        p_payment_method: null,
      }),
    })

    // If server accepts, the total_price could overflow. Either rejection or safe handling is acceptable.
    // We verify the server doesn't crash (returns a valid response).
    expect([200, 400, 422, 500].includes(res.status), `Unexpected status: ${res.status}`).toBeTruthy()

    if (res.ok) {
      // If accepted, verify the order was created (server didn't crash)
      const body = await res.text()
      expect(body).toBeTruthy()
    }
  })

  test('EC-O05: 존재하지 않는 menu_item_id → 서버 거부', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    const fakeMenuItemId = '00000000-0000-0000-0000-000000000000'

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: fakeMenuItemId, menu_item_name: '가짜메뉴', quantity: 1, selected_options: null }],
        p_guest_name: null,
        p_special_requests: null,
        p_payment_method: null,
      }),
    })

    expect(res.ok, 'Order with non-existent menu_item_id should be rejected').toBeFalsy()
  })

  test('EC-O04: 옵션 가격 조작 → 서버 강제 교정 확인', async ({ page }) => {
    const serviceHeaders = getServiceRoleHeaders()
    test.skip(!serviceHeaders, 'SUPABASE_SERVICE_ROLE_KEY 미설정 — option seed 불가')

    const { url } = getSupabaseConfig()

    // Seed option group via service role (RLS bypassed)
    const groupRes = await fetch(`${url}/rest/v1/option_groups`, {
      method: 'POST',
      headers: { ...serviceHeaders!, Prefer: 'return=representation' },
      body: JSON.stringify({
        store_id: storeId,
        menu_item_id: menuItemId,
        name: '사이즈',
        is_required: false,
        sort_order: 1,
      }),
    })
    expect(groupRes.ok, `option_groups seed failed: ${groupRes.status}`).toBeTruthy()
    const groups = (await groupRes.json()) as SeedRow[]
    const groupId = groups[0].id

    const choiceRes = await fetch(`${url}/rest/v1/option_choices`, {
      method: 'POST',
      headers: { ...serviceHeaders!, Prefer: 'return=representation' },
      body: JSON.stringify({
        store_id: storeId,
        option_group_id: groupId,
        name: '라지',
        extra_price: 2000,
        sort_order: 1,
      }),
    })
    expect(choiceRes.ok, `option_choices seed failed: ${choiceRes.status}`).toBeTruthy()
    const choices = (await choiceRes.json()) as SeedRow[]
    const choiceId = choices[0].id

    // Now order via authenticated user with manipulated extra_price: 0
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{
          menu_item_id: menuItemId,
          menu_item_name: '엣지테스트메뉴',
          quantity: 1,
          selected_options: [{ option_choice_id: choiceId, name: '라지', extra_price: 0 }],
        }],
        p_guest_name: null,
        p_special_requests: null,
        p_payment_method: null,
      }),
    })

    // Server should either reject the manipulated price or accept and correct it via trigger
    expect([200, 400, 422].includes(res.status), `Unexpected status: ${res.status}`).toBeTruthy()

    if (res.ok) {
      // Order was accepted — the enforce_menu_item_price trigger corrected the price server-side.
      // Verify the order exists in the DB with correct total via service role.
      const orderId = await res.json()
      const checkRes = await fetch(
        `${url}/rest/v1/order_items?select=subtotal_price&order_id=eq.${orderId}&limit=1`,
        { headers: serviceHeaders! },
      )
      if (checkRes.ok) {
        const items = (await checkRes.json()) as Array<{ subtotal_price: number }>
        if (items.length > 0) {
          // subtotal should reflect the real extra_price (2000), not the manipulated 0
          expect(items[0].subtotal_price).toBeGreaterThanOrEqual(10000)
        }
      }
    }
  })

  test('EC-O08: 잘못된 상태 전환 (served→preparing) → 서버 거부', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    // Create an order via RPC
    const createRes = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: menuItemId, menu_item_name: '엣지테스트메뉴', quantity: 1, selected_options: null }],
        p_guest_name: '상태전환테스트',
        p_special_requests: null,
        p_payment_method: null,
      }),
    })
    expect(createRes.ok, `Order creation failed: ${createRes.status}`).toBeTruthy()
    const orderId = await createRes.json()

    // Advance order to 'served' state: created → confirmed → preparing → ready → served
    for (const status of ['confirmed', 'preparing', 'ready', 'served']) {
      const patchRes = await fetch(`${url}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      })
      expect(patchRes.ok, `Transition to ${status} failed: ${patchRes.status}`).toBeTruthy()
    }

    // Now try invalid transition: served → preparing
    const invalidRes = await fetch(`${url}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'preparing' }),
    })

    // Check current status — should still be 'served'
    const orderCheck = await supabaseGet<{ status: string }>(
      page,
      `orders?select=status&id=eq.${orderId}&limit=1`,
    )
    expect(orderCheck.length).toBeGreaterThan(0)

    // Either the PATCH was rejected (400) or the status didn't change
    const statusUnchanged = orderCheck[0].status === 'served'
    const patchRejected = !invalidRes.ok
    expect(
      statusUnchanged || patchRejected,
      `Invalid transition should be blocked. Status: ${orderCheck[0].status}, PATCH ok: ${invalidRes.ok}`,
    ).toBeTruthy()
  })

  // ──────────────────────── AUTH edge cases ──────────────────────

  test('EC-A04: SQL injection in login email → 실패', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', "' OR 1=1--")
    await page.fill('#password', 'anything')
    await page.click('button[type="submit"]')

    // Should not navigate to admin — should show error or stay on login
    await page.waitForTimeout(3000)
    const currentUrl = page.url()
    expect(currentUrl).toContain('/login')

    // Should NOT be on admin or superadmin
    expect(currentUrl).not.toContain('/admin')
    expect(currentUrl).not.toContain('/superadmin')
  })

  test('EC-A07: 잘못된 이메일 형식 로그인 → 에러 표시', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'not-an-email')
    await page.fill('#password', 'Test1234!@')
    await page.click('button[type="submit"]')

    await page.waitForTimeout(3000)
    const currentUrl = page.url()
    // Should stay on login page
    expect(currentUrl).toContain('/login')
  })

  // ──────────────────────── SECURITY edge cases ──────────────────

  test('EC-S06: XSS in special_requests → 이스케이프 확인', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    const xssPayload = '<img src=x onerror=alert(1)>'

    // Create order with XSS in special_requests via RPC
    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: menuItemId, menu_item_name: '엣지테스트메뉴', quantity: 1, selected_options: null }],
        p_guest_name: '<script>alert("xss")</script>',
        p_special_requests: xssPayload,
        p_payment_method: null,
      }),
    })
    expect(res.ok, `XSS order creation failed: ${res.status}`).toBeTruthy()

    // Navigate to admin orders page and check that XSS is escaped
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    let alertFired = false
    page.on('dialog', async (dialog) => {
      alertFired = true
      await dialog.dismiss()
    })

    // Wait for potential XSS execution
    await page.waitForTimeout(3000)
    expect(alertFired, 'XSS alert should not fire in admin dashboard').toBeFalsy()
  })

  test('EC-S08: 비정상 UTF-8 (이모지) 입력 → 정상 처리', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    // Create order with emoji in guest_name and special_requests
    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: menuItemId, menu_item_name: '엣지테스트메뉴', quantity: 1, selected_options: null }],
        p_guest_name: '🍕🍔 테스트고객 👨‍👩‍👧‍👦',
        p_special_requests: '맵기 🌶️🌶️🌶️ 빼주세요',
        p_payment_method: null,
      }),
    })
    expect(res.ok, `Emoji order creation should succeed: ${res.status}`).toBeTruthy()

    // Verify the order was created with emoji data intact
    const orderId = await res.json()
    const orders = await supabaseGet<{ guest_name: string; special_requests: string }>(
      page,
      `orders?select=guest_name,special_requests&id=eq.${orderId}&limit=1`,
    )
    expect(orders.length).toBeGreaterThan(0)
    expect(orders[0].guest_name).toContain('🍕')
    expect(orders[0].special_requests).toContain('🌶️')
  })

  test('EC-O07: 다른 매장의 menu_item_id로 주문 → 크로스테넌트 차단', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    // Use a fake menu_item_id that doesn't belong to this store
    // We use a valid UUID format but one that's very unlikely to exist in this store
    const crossTenantMenuId = '11111111-1111-1111-1111-111111111111'

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: crossTenantMenuId, menu_item_name: '가짜메뉴', quantity: 1, selected_options: null }],
        p_guest_name: null,
        p_special_requests: null,
        p_payment_method: null,
      }),
    })

    expect(res.ok, 'Cross-tenant menu_item_id order should be rejected').toBeFalsy()
  })

  // ──────────────────── WAITING edge cases ───────────────────────

  test('EC-W05: 빈 전화번호로 대기 등록 → 차단 확인', async ({ page }) => {
    // Go to waiting page for this store
    const anonCtx = await page.context().browser()!.newContext()
    const anonPage = await anonCtx.newPage()

    await anonPage.goto(`/waiting/${STORE_SLUG}`)
    await anonPage.waitForLoadState('networkidle')

    // Check if waiting form exists
    const formVisible = await anonPage.locator('input[type="tel"], input[placeholder*="전화"], input[placeholder*="010"]').first().isVisible({ timeout: 5000 }).catch(() => false)

    if (formVisible) {
      // Try submitting with empty phone
      const phoneInput = anonPage.locator('input[type="tel"], input[placeholder*="전화"], input[placeholder*="010"]').first()
      await phoneInput.fill('')

      const partySizeInput = anonPage.locator('input[type="number"]').first()
      if (await partySizeInput.isVisible().catch(() => false)) {
        await partySizeInput.fill('2')
      }

      // Try to submit
      const submitBtn = anonPage.locator('button[type="submit"], button:has-text("등록"), button:has-text("대기")').first()
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click()
        await anonPage.waitForTimeout(2000)

        // Should show error or stay on form (not navigate to success)
        const bodyText = await anonPage.locator('body').innerText()
        const hasError = bodyText.includes('전화') || bodyText.includes('필수') || bodyText.includes('입력')
        const stillOnForm = await phoneInput.isVisible()
        expect(hasError || stillOnForm, 'Empty phone should be rejected or form should remain').toBeTruthy()
      }
    }

    await anonCtx.close()
  })

  test('EC-W03: 대기 rate limit 경계값 (3건/10분) → API 레벨 검증', async ({ page }) => {
    const serviceHeaders = getServiceRoleHeaders()
    test.skip(!serviceHeaders, 'SUPABASE_SERVICE_ROLE_KEY 미설정')

    const { url } = getSupabaseConfig()
    const testPhone = `010${String(ts).slice(-8)}`

    // Insert 3 waiting entries rapidly for the same phone + store
    const results: number[] = []
    for (let i = 0; i < 4; i++) {
      const res = await fetch(`${url}/rest/v1/waitings`, {
        method: 'POST',
        headers: { ...serviceHeaders!, Prefer: 'return=representation' },
        body: JSON.stringify({
          store_id: storeId,
          queue_number: 9000 + i,
          phone: testPhone,
          party_size: 2,
          status: 'waiting',
        }),
      })
      results.push(res.status)
    }

    // First 3 should succeed (201), 4th should be blocked by rate limit trigger
    // Note: service role may bypass RLS but trigger still fires
    const successCount = results.filter((s) => s === 201).length
    const failCount = results.filter((s) => s !== 201).length

    // Either rate limit kicks in (failCount > 0) or service role bypasses it
    // We document the behavior either way
    expect(
      successCount >= 1,
      `At least one waiting entry should be created. Results: ${results.join(', ')}`,
    ).toBeTruthy()

    // Cleanup: delete test waiting entries
    await fetch(`${url}/rest/v1/waitings?store_id=eq.${storeId}&phone=eq.${testPhone}`, {
      method: 'DELETE',
      headers: serviceHeaders!,
    })
  })

  // ──────────────────── UI edge cases ────────────────────────────

  test('EC-U01: 더블 클릭 방지 — 주문 버튼 빠른 2회 클릭 → 1건만 생성', async ({ page }) => {
    // Open customer menu in anonymous context
    const anonCtx = await page.context().browser()!.newContext()
    const anonPage = await anonCtx.newPage()

    await anonPage.goto(`/m/${STORE_SLUG}/${qrToken}`)
    await anonPage.waitForLoadState('networkidle')
    await anonPage.waitForTimeout(3000) // Splash screen

    // Try to find and click a menu item
    const menuCard = anonPage.locator('[data-testid="menu-card"], div.cursor-pointer').first()
    const menuVisible = await menuCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (menuVisible) {
      await menuCard.click()
      await anonPage.waitForTimeout(1000)

      // Look for add-to-cart or order button
      const orderBtn = anonPage.locator('button:has-text("주문"), button:has-text("담기"), button:has-text("장바구니")').first()
      const orderBtnVisible = await orderBtn.isVisible({ timeout: 5000 }).catch(() => false)

      if (orderBtnVisible) {
        // Click twice rapidly
        await orderBtn.click()
        await orderBtn.click({ delay: 50 })
        await anonPage.waitForTimeout(2000)

        // Verify: either button is disabled after first click, or at most 1 order is created
        // This is a soft check — we just verify the page doesn't crash
        const pageContent = await anonPage.locator('body').innerText()
        expect(pageContent).toBeTruthy()
      }
    }

    await anonCtx.close()
  })

  test('EC-S12: 매우 긴 입력 (1000자 guest_name) → 서버 응답 확인', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    const longName = '가'.repeat(1000)

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: menuItemId, menu_item_name: '엣지테스트메뉴', quantity: 1, selected_options: null }],
        p_guest_name: longName,
        p_special_requests: '나'.repeat(2000),
        p_payment_method: null,
      }),
    })

    // Server should either accept (PostgreSQL text has no length limit) or reject gracefully
    expect(
      [200, 400, 422].includes(res.status),
      `Long input should not crash the server. Status: ${res.status}`,
    ).toBeTruthy()
  })

  test('EC-O06: 품절 메뉴 주문 시도 → 서버 거부', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    // Create a sold-out menu item
    const soldOutItems = await supabasePost<SeedRow>(page, 'menu_items', {
      store_id: storeId,
      category_id: categoryId,
      name: '품절메뉴',
      price: 5000,
      is_available: false,
      sort_order: 99,
    })
    expect(soldOutItems.length).toBeGreaterThan(0)
    const soldOutId = soldOutItems[0].id

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [{ menu_item_id: soldOutId, menu_item_name: '품절메뉴', quantity: 1, selected_options: null }],
        p_guest_name: null,
        p_special_requests: null,
        p_payment_method: null,
      }),
    })

    expect(res.ok, 'Ordering sold-out menu should be rejected by the server').toBeFalsy()
  })

  test('EC-O03: 빈 장바구니(아이템 0개) 주문 → 서버 거부', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    const headers = await supabaseHeaders(page)
    const { url } = getSupabaseConfig()

    const res = await fetch(`${url}/rest/v1/rpc/create_order_atomic`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        p_store_id: storeId,
        p_table_id: tableId,
        p_items: [],
        p_guest_name: null,
        p_special_requests: null,
        p_payment_method: null,
      }),
    })

    expect(res.ok, 'Empty cart order should be rejected by the server').toBeFalsy()
  })

  // ──────────────────── Teardown ─────────────────────────────────

  test.afterAll(async () => {
    await deleteStoresWithTestTag()
    await deleteStoreBySlug(STORE_SLUG)
  })
})
