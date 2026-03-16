import { test, expect } from '@playwright/test'
import {
  SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD,
  deleteStoresWithTestTag,
  fillDateRange,
  clickSidebarButton,
  completePasswordChange,
  deleteStoreBySlug,
  markStoreTestData,
  login,
  loginAndWaitForAdmin,
  loginAndWaitForPasswordChange,
  requireEnv,
  sidebarBtn,
} from './e2e-helpers'

requireEnv('TEST_SUPERADMIN_EMAIL')
requireEnv('TEST_SUPERADMIN_PASSWORD')

const ts = Date.now()
const STORE_NAME = `직원테스트매장${ts}`
const STORE_SLUG = `staff-test-${ts}`
const OWNER_EMAIL = `staff-owner-${ts}@tableflow.com`
const OWNER_PASSWORD = 'Test1234!@'
const OWNER_NEW_PASSWORD = 'Test5678!@'
const STAFF_EMAIL = `staff-member-${ts}@tableflow.com`
const STAFF_PASSWORD = 'Staff1234!@'
const STAFF_NEW_PASSWORD = 'Staff5678!@'

const today = new Date().toISOString().split('T')[0]
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

test.describe.configure({ mode: 'serial' })

test.describe('직원 관리 E2E (SC-011~SC-013, SC-020)', () => {
  test('1. 슈퍼어드민 — 매장 생성', async ({ page }) => {
    await login(page, SUPERADMIN_EMAIL!, SUPERADMIN_PASSWORD!)
    await expect(page).toHaveURL('/superadmin', { timeout: 10000 })

    await expect(page.getByRole('button', { name: '매장 추가' })).toBeVisible()
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
    await expect(page.getByRole('button', { name: '매장 관리' })).toBeVisible()
  })

  test('SC-011: 직원 계정 생성', async ({ page }) => {
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

    // 성공 토스트 또는 이메일 노출 확인
    await expect(page.locator('body')).toContainText(/직원 계정이 생성됐습니다|생성됐습니다/, { timeout: 15000 })
  })

  test('SC-012: 직원 — 메뉴 관리 탭 접근 불가', async ({ page }) => {
    await login(page, STAFF_EMAIL, STAFF_PASSWORD)
    await page.waitForURL(/\/(admin|change-password)/, { timeout: 10000 })

    if (page.url().includes('change-password')) {
      await completePasswordChange(page, STAFF_NEW_PASSWORD)
    }

    await expect(sidebarBtn(page, /매장 관리/)).toHaveCount(0, { timeout: 5000 })
    await expect(sidebarBtn(page, /메뉴 관리/)).toHaveCount(0, { timeout: 5000 })
  })

  test('SC-013: 직원 — 매장 설정 접근 불가', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', STAFF_EMAIL)

    const passwords = [STAFF_PASSWORD, STAFF_NEW_PASSWORD]
    let loggedIn = false
    for (const pw of passwords) {
      await page.fill('#password', pw)
      await page.getByRole('button', { name: '로그인' }).click()
      // Wait for navigation to a success URL; timeout means wrong password
      try {
        await page.waitForURL(/\/(admin|change-password)/, { timeout: 8000 })
        if (page.url().includes('/change-password')) {
          await completePasswordChange(page, STAFF_NEW_PASSWORD)
        }
        loggedIn = true
        break
      } catch {
        // Still on /login — wrong password, try next
      }
    }

    expect(loggedIn, '직원 계정으로 로그인해야 SC-013을 진행할 수 있습니다.').toBeTruthy()
    await expect(sidebarBtn(page, /설정|직원 관리/)).toHaveCount(0, { timeout: 5000 })
    await expect(page.locator('body')).toContainText('직원', { ignoreCase: true })
  })

  test('SC-002: 점주 — /superadmin 접근 차단', async ({ page }) => {
    await loginAndWaitForAdmin(page, OWNER_EMAIL, OWNER_NEW_PASSWORD)
    await page.goto('/superadmin')
    await page.waitForLoadState('networkidle')
    // SuperAdminRoute must never render superadmin UI for a store owner.
    // Check both the action button and the store table — two independent superadmin indicators.
    await expect(page.locator('button').filter({ hasText: '매장 추가' })).toHaveCount(0, { timeout: 5000 })
    await expect(page.getByRole('table')).toHaveCount(0)
  })

  test('SC-005/006: 비로그인 — 보호 경로 접근 차단', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login', { timeout: 5000 })

    await page.goto('/change-password')
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  test.afterAll(async () => {
    await deleteStoresWithTestTag()
    await deleteStoreBySlug(STORE_SLUG)
  })
})
