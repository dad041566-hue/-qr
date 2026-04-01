import { test } from '@playwright/test'
test.use({ headless: false, viewport: { width: 1280, height: 720 } })
test('table add visual check', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'owner@flow.com')
  await page.fill('input[type="password"]', 'Test1234!!')
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 })
  await page.waitForTimeout(2000)

  await page.locator('aside button:has-text("매장 관리")').click()
  await page.waitForTimeout(500)
  await page.locator('aside button:has-text("QR 코드 관리")').click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'e2e-recordings/table-before-add.png' })

  await page.locator('button:has-text("테이블 추가")').first().click()
  await page.waitForTimeout(4000)
  await page.screenshot({ path: 'e2e-recordings/table-after-add.png' })

  // 현장 POS로 전환해서 테이블 확인
  await page.locator('aside button:has-text("현장 POS")').click()
  await page.waitForTimeout(500)
  await page.locator('aside button:has-text("홀 테이블")').click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'e2e-recordings/table-pos-view.png' })

  // 60초 대기 — 직접 확인
  await page.waitForTimeout(60000)
})
