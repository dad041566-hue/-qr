import { test } from '@playwright/test'

const OWNER_EMAIL = process.env.TEST_OWNER_EMAIL ?? ''
const OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD ?? ''

test('debug admin page', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', OWNER_EMAIL)
  await page.fill('#password', OWNER_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'test-results/debug-admin.png', fullPage: true })

  const btns = await page.locator('button').allTextContents()
  console.log('ALL BUTTONS:', JSON.stringify(btns, null, 2))
  console.log('URL:', page.url())
})
