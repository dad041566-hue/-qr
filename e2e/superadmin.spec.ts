import { test, expect } from '@playwright/test'
import { deleteStoreBySlug, deleteStoresWithTestTag, markStoreTestData } from './e2e-helpers'

const SUPERADMIN_EMAIL = process.env.TEST_SUPERADMIN_EMAIL
const SUPERADMIN_PASSWORD = process.env.TEST_SUPERADMIN_PASSWORD

if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  throw new Error('TEST_SUPERADMIN_EMAIL, TEST_SUPERADMIN_PASSWORD must be set.')
}

const ts = Date.now()
const STORE_NAME = `테스트매장${ts}`
const STORE_SLUG = `test-${ts}`
const OWNER_EMAIL = `owner-${ts}@tableflow.com`
const OWNER_PASSWORD = 'Test1234!@'
const OWNER_NEW_PASSWORD = 'Test5678!@'

test('1. 슈퍼어드민 매장 생성', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', SUPERADMIN_EMAIL)
  await page.fill('#password', SUPERADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/superadmin', { timeout: 10000 })
  await expect(page.getByRole('button', { name: '매장 추가' })).toBeVisible()

  await page.getByRole('button', { name: '매장 추가' }).click()
  await expect(page.getByPlaceholder('예) 맛있는 식당')).toBeVisible()

  await page.getByPlaceholder('예) 맛있는 식당').fill(STORE_NAME)
  await page.getByPlaceholder('예) tasty-restaurant').fill(STORE_SLUG)
  await page.getByPlaceholder('owner@example.com').fill(OWNER_EMAIL)
  await page.getByPlaceholder('8자 이상').fill(OWNER_PASSWORD)

  const today = new Date().toISOString().split('T')[0]
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const dateInputs = page.locator('input[type="date"]')
  await dateInputs.nth(0).fill(today)
  await dateInputs.nth(1).fill(nextYear)

  await page.getByRole('button', { name: '매장 생성' }).click()
  await expect(page.getByRole('cell', { name: STORE_NAME, exact: true })).toBeVisible({ timeout: 10000 })
  await markStoreTestData(STORE_SLUG)
})

test('2. 점주 첫 로그인 → 비번 변경 → 어드민', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', OWNER_EMAIL)
  await page.fill('#password', OWNER_PASSWORD)
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/change-password', { timeout: 10000 })
  await expect(page.getByRole('heading', { name: '비밀번호 변경' })).toBeVisible()

  await page.getByPlaceholder('8자 이상, 특수문자 포함').fill(OWNER_NEW_PASSWORD)
  await page.getByPlaceholder('비밀번호 재입력').fill(OWNER_NEW_PASSWORD)
  await page.getByRole('button', { name: '비밀번호 변경' }).click()

  await expect(page).toHaveURL('/admin', { timeout: 10000 })
  await expect(page.getByRole('button', { name: '매장 관리' })).toBeVisible()
})

test.afterAll(async () => {
  await deleteStoresWithTestTag()
  await deleteStoreBySlug(STORE_SLUG)
})
