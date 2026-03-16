import { test, expect } from '@playwright/test'

const SUPERADMIN_EMAIL = process.env.TEST_SUPERADMIN_EMAIL
const SUPERADMIN_PASSWORD = process.env.TEST_SUPERADMIN_PASSWORD

if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  throw new Error('TEST_SUPERADMIN_EMAIL, TEST_SUPERADMIN_PASSWORD must be set.')
}

test('슈퍼어드민 로그인 후 /superadmin 이동', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  await expect(page.getByLabel('이메일')).toBeVisible()

  await page.fill('#email', SUPERADMIN_EMAIL)
  await page.fill('#password', SUPERADMIN_PASSWORD)
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/superadmin', { timeout: 10000 })
})
