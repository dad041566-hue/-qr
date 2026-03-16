import { test, expect } from '@playwright/test'
import {
  SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD,
  completePasswordChange,
  deleteStoresWithTestTag,
  deleteStoreBySlug,
  fillDateRange,
  markStoreTestData,
  login,
  loginAndWaitForAdmin,
  loginAndWaitForPasswordChange,
  requireEnv,
  supabaseGet,
  supabasePost,
} from './e2e-helpers'

requireEnv('TEST_SUPERADMIN_EMAIL')
requireEnv('TEST_SUPERADMIN_PASSWORD')

const ts = Date.now()
const STORE_NAME = `장바구니테스트매장${ts}`
const STORE_SLUG = `cart-test-${ts}`
const OWNER_EMAIL = `cart-owner-${ts}@tableflow.com`
const OWNER_PASSWORD = 'Test1234!@'
const OWNER_NEW_PASSWORD = 'Test5678!@'

const today = new Date().toISOString().split('T')[0]
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

let qrToken = ''
let storeId = ''

type StoreRow = { id: string }
type TableRow = { id: string; qr_token: string }
type SeedRow = { id: string }

test.describe.configure({ mode: 'serial' })

test.describe('고객 장바구니 E2E (SC-022, SC-023)', () => {
  test('1. 슈퍼어드민 — 매장 생성', async ({ page }) => {
    await login(page, SUPERADMIN_EMAIL!, SUPERADMIN_PASSWORD!)
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

  test('2. 점주 첫 로그인 → 비번 변경', async ({ page }) => {
    await loginAndWaitForPasswordChange(page, OWNER_EMAIL, OWNER_PASSWORD)
    await completePasswordChange(page, OWNER_NEW_PASSWORD)
  })

  test('3. 매장/테이블 정보 추출 + 메뉴 데이터 seed', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.waitForLoadState('networkidle')

    const storeRows = await supabaseGet<StoreRow>(
      page,
      `stores?select=id&slug=eq.${encodeURIComponent(STORE_SLUG)}&limit=1`
    )
    expect(storeRows.length).toBeGreaterThan(0)
    storeId = storeRows[0].id

    const tableRows = await supabaseGet<TableRow>(
      page,
      `tables?select=id,qr_token&store_id=eq.${storeId}&order=table_number.asc&limit=1`
    )
    expect(tableRows.length).toBeGreaterThan(0)
    qrToken = tableRows[0].qr_token

    const catRows = await supabasePost<SeedRow>(page, 'menu_categories', {
      store_id: storeId,
      name: '테스트카테고리',
      sort_order: 1,
    })
    expect(catRows.length).toBeGreaterThan(0)
    const categoryId = catRows[0].id

    const itemRows = await supabasePost<SeedRow>(page, 'menu_items', {
      store_id: storeId,
      category_id: categoryId,
      name: '테스트메뉴아이템',
      price: 10000,
      is_available: true,
      sort_order: 1,
    })
    expect(itemRows.length).toBeGreaterThan(0)
  })

  test('SC-022: 장바구니 수량 변경 — +/- 버튼으로 수량 업데이트', async ({ page }) => {
    expect(qrToken, 'qrToken이 설정되어야 합니다.').toBeTruthy()

    await page.goto(`/m/${STORE_SLUG}/${qrToken}`)
    await page.waitForLoadState('networkidle')
    // Wait for splash screen to dismiss (2.5s animation in CustomerMenu.tsx)
    await page.waitForTimeout(3000)

    // 메뉴 아이템 카드 클릭 → 모달 열기
    const menuCard = page.locator('div.cursor-pointer').first()
    await expect(menuCard, '메뉴 카드가 보여야 합니다.').toBeVisible({ timeout: 10000 })
    await menuCard.click()

    // 모달에서 "원 담기" 버튼으로 장바구니에 추가
    const addToCartBtn = page.getByRole('button', { name: /원 담기/ })
    await expect(addToCartBtn, '담기 버튼이 보여야 합니다.').toBeVisible({ timeout: 5000 })
    await addToCartBtn.click()

    // 장바구니(주문 확인) 열기
    const cartBtn = page.getByRole('button', { name: /주문 확인|장바구니/ }).first()
    await expect(cartBtn, '주문 확인 버튼이 보여야 합니다.').toBeVisible({ timeout: 5000 })
    await cartBtn.click()

    // 장바구니 시트에서 아이템이 수량 1로 표시되는지 확인
    await expect(page.locator('body')).toContainText('테스트메뉴아이템', { timeout: 5000 })

    // 장바구니 +/- 버튼은 SVG 아이콘만 있어 accessible name이 없음
    // bg-zinc-900 (검은 배경) = 증가 버튼, bg-white (흰 배경) = 감소 버튼
    const qtyControls = page.locator('div.rounded-full').filter({ has: page.locator('button') })
    const increaseBtn = page.locator('button.bg-zinc-900.rounded-full').last()
    await expect(increaseBtn, '수량 증가 버튼이 보여야 합니다.').toBeVisible({ timeout: 5000 })
    await increaseBtn.click()

    // 수량이 2로 증가 후 합계 금액이 20,000원으로 표시되는지 확인
    await expect(page.locator('body')).toContainText('20,000', { timeout: 5000 })

    // 수량 감소 (-) 버튼 클릭 — bg-white rounded-full 스타일
    const decreaseBtn = page.locator('button.bg-white.rounded-full').filter({ has: page.locator('svg') }).last()
    await expect(decreaseBtn, '수량 감소 버튼이 보여야 합니다.').toBeVisible({ timeout: 5000 })
    await decreaseBtn.click()

    // 수량이 1로 감소 후 합계 금액이 10,000원으로 표시되는지 확인
    await expect(page.locator('body')).toContainText('10,000', { timeout: 5000 })
  })

  test('SC-023: 빈 장바구니 주문 시도 — 주문 버튼 비활성 또는 미노출', async ({ page }) => {
    expect(qrToken, 'qrToken이 설정되어야 합니다.').toBeTruthy()

    await page.goto(`/m/${STORE_SLUG}/${qrToken}`)
    await page.waitForLoadState('networkidle')
    // Wait for splash screen to dismiss (2.5s animation in CustomerMenu.tsx)
    await page.waitForTimeout(3000)

    // 아무것도 담지 않은 상태에서 "주문하기" 버튼은 보이지 않아야 함
    // (장바구니 버튼 자체가 없어야 하거나, 주문하기 버튼이 disabled여야 함)
    const cartBtn = page.getByRole('button', { name: /주문 확인|장바구니/ })
    const cartBtnCount = await cartBtn.count()

    if (cartBtnCount > 0) {
      // 장바구니 버튼이 있다면 클릭 후 주문하기 버튼이 disabled인지 확인
      await cartBtn.first().click()
      const submitBtn = page.getByRole('button', { name: '주문하기', exact: true })
      if (await submitBtn.isVisible()) {
        await expect(submitBtn).toBeDisabled()
      }
    } else {
      // 장바구니 버튼 자체가 없으면 통과 — 빈 장바구니에서 주문 경로 없음
      expect(cartBtnCount, '빈 장바구니 상태에서 주문 경로가 없어야 합니다.').toBe(0)
    }
  })

  test.afterAll(async () => {
    await deleteStoresWithTestTag()
    await deleteStoreBySlug(STORE_SLUG)
  })
})
