import { test, expect } from '@playwright/test'

const EMAIL = 'dksk0359@gmail.com'
const PASSWORD = process.env.TEST_SUPERADMIN_PASSWORD ?? ''

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/superadmin', { timeout: 10000 })
})

test('슈퍼어드민 페이지 로드', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'test-results/superadmin-page.png', fullPage: true })

  console.log('CONSOLE ERRORS:', errors)
  console.log('URL:', page.url())

  // 페이지에 있는 텍스트 확인
  const body = await page.locator('body').textContent()
  console.log('BODY TEXT (first 500):', body?.slice(0, 500))
})
