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
  getSupabaseConfig,
  supabaseHeaders,
  supabaseGet,
  supabasePost,
} from './e2e-helpers'

if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  throw new Error('TEST_SUPERADMIN_EMAIL and TEST_SUPERADMIN_PASSWORD must be set.')
}

const ts = Date.now()
const STORE_NAME = `대기테스트매장${ts}`
const STORE_SLUG = `waiting-test-${ts}`
const OWNER_EMAIL = `waiting-owner-${ts}@tableflow.com`
const OWNER_PASSWORD = 'Test1234!@'
const OWNER_NEW_PASSWORD = 'Test5678!@'

const today = new Date().toISOString().split('T')[0]
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

type StoreRow = { id: string }
type WaitingRow = { id: string; phone: string; party_size: number; queue_number: number; status: string }

let storeId = ''

test.describe.configure({ mode: 'serial' })

test.describe('SC-026/SC-027 대기 키오스크 E2E', () => {
  test('1. 슈퍼어드민 — 매장 생성', async ({ page }) => {
    await login(page, SUPERADMIN_EMAIL!, SUPERADMIN_PASSWORD!)
    await expect(page).toHaveURL('/superadmin', { timeout: 10000 })

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

  test('2. 점주 첫 로그인 → 비밀번호 변경', async ({ page }) => {
    await loginAndWaitForPasswordChange(page, OWNER_EMAIL, OWNER_PASSWORD)
    await completePasswordChange(page, OWNER_NEW_PASSWORD)
  })

  test('3. storeId 추출', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)

    const rows = await supabaseGet<StoreRow>(
      page,
      `stores?select=id&slug=eq.${encodeURIComponent(STORE_SLUG)}&limit=1`
    )
    expect(rows.length).toBeGreaterThan(0)
    storeId = rows[0].id
  })

  test('SC-026: 대기 키오스크 UI — 전화번호 키패드 + 인원 선택 화면 검증', async ({ page }) => {
    // 점주로 로그인 후 /waiting 접근
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.goto('/waiting')
    await page.waitForLoadState('networkidle')

    // Step 1: 전화번호 키패드 화면 확인
    await expect(page.getByRole('heading', { name: /연락처를 입력/ })).toBeVisible({ timeout: 8000 })

    // 숫자 키패드 입력 (010-1234-5678)
    for (const digit of ['1', '2', '3', '4', '5', '6', '7', '8']) {
      await page.getByRole('button', { name: digit, exact: true }).click()
    }

    // 전화번호 포맷 확인
    await expect(page.locator('body')).toContainText('010-1234-5678', { timeout: 3000 })

    // "다음" 버튼 클릭
    await page.getByRole('button', { name: '다음', exact: true }).click()

    // Step 2: 인원 선택 화면 확인
    await expect(page.getByRole('heading', { name: /방문 인원/ })).toBeVisible({ timeout: 5000 })

    // +1 → 3명
    await page.getByRole('button', { name: '+', exact: true }).click()
    await expect(page.locator('body')).toContainText('3', { timeout: 3000 })

    // "대기 등록 완료하기" 버튼 존재 확인
    await expect(page.getByRole('button', { name: '대기 등록 완료하기' })).toBeVisible()
  })

  test('SC-026/027: 대기 등록 API 검증 — RPC + INSERT + 조회', async ({ page }) => {
    expect(storeId).toBeTruthy()

    // 점주 권한으로 RPC 호출 + waitings INSERT를 API로 직접 수행
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)

    // next_queue_number RPC 호출
    const { url: supabaseUrl } = getSupabaseConfig()
    const headers = await supabaseHeaders(page)

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/next_queue_number`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_store_id: storeId }),
    })

    if (!rpcRes.ok) {
      const errText = await rpcRes.text()
      throw new Error(`next_queue_number RPC 실패 (${rpcRes.status}): ${errText}`)
    }

    const queueNumber = await rpcRes.json()
    expect(queueNumber, '대기 번호가 양수여야 합니다.').toBeGreaterThan(0)

    // waitings INSERT
    const insertRows = await supabasePost<WaitingRow>(page, 'waitings', {
      store_id: storeId,
      queue_number: queueNumber,
      phone: '01012345678',
      party_size: 3,
      status: 'waiting',
    })
    expect(insertRows.length, 'waitings INSERT가 성공해야 합니다.').toBeGreaterThan(0)

    const entry = insertRows[0]
    expect(entry.phone).toBe('01012345678')
    expect(entry.party_size).toBe(3)
    expect(entry.queue_number).toBe(queueNumber)
    expect(entry.status).toBe('waiting')

    // SC-027: 조회 확인
    const readRows = await supabaseGet<WaitingRow>(
      page,
      `waitings?select=id,phone,party_size,queue_number,status&store_id=eq.${storeId}&order=created_at.desc&limit=1`
    )
    expect(readRows.length).toBeGreaterThan(0)
    expect(readRows[0].phone).toBe('01012345678')
    expect(readRows[0].queue_number).toBeGreaterThan(0)
  })

  test.afterAll(async () => {
    await deleteStoresWithTestTag()
    await deleteStoreBySlug(STORE_SLUG)
  })
})
