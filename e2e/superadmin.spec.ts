import { test, expect } from '@playwright/test'

const SUPERADMIN_EMAIL = 'dksk0359@gmail.com'
const SUPERADMIN_PASSWORD = process.env.TEST_SUPERADMIN_PASSWORD ?? ''

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

  await page.getByRole('button', { name: '매장 추가' }).click()
  await page.waitForTimeout(500)

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
  await page.waitForTimeout(5000)

  const body = await page.locator('body').textContent()
  console.log('생성 후:', body?.slice(0, 400))

  await expect(page.getByRole('cell', { name: STORE_NAME })).toBeVisible({ timeout: 10000 })
  console.log('✅ 매장 생성 성공:', STORE_NAME)
})

test('2. 점주 첫 로그인 → 비번 변경 → 어드민', async ({ page }) => {
  const consoleLogs: string[] = []
  const networkRequests: string[] = []

  page.on('console', msg => {
    if (['error', 'warn'].includes(msg.type())) consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('request', req => {
    if (req.url().includes('supabase')) networkRequests.push(`→ ${req.method()} ${req.url().replace(/.*supabase\.co/, '')}`)
  })
  page.on('response', async res => {
    if (res.url().includes('supabase') && res.url().includes('auth')) {
      networkRequests.push(`← ${res.status()} ${res.url().replace(/.*supabase\.co/, '')}`)
    }
  })

  await page.goto('/login')
  await page.fill('#email', OWNER_EMAIL)
  await page.fill('#password', OWNER_PASSWORD)
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/change-password', { timeout: 10000 })
  console.log('✅ 첫 로그인 → 비번 변경 화면')

  await page.getByPlaceholder('8자 이상, 특수문자 포함').fill(OWNER_NEW_PASSWORD)
  await page.getByPlaceholder('비밀번호 재입력').fill(OWNER_NEW_PASSWORD)

  // 버튼 클릭 전 상태 확인
  await page.screenshot({ path: 'test-results/before-submit.png' })
  await page.getByRole('button', { name: '비밀번호 변경' }).click()

  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'test-results/after-submit.png' })
  console.log('변경 후 URL:', page.url())
  if (consoleLogs.length) console.log('LOGS:', consoleLogs.join('\n'))
  console.log('NETWORK:', networkRequests.join('\n'))

  // 페이지 전체 텍스트로 에러 파악
  const bodyText = await page.locator('body').textContent()
  console.log('BODY:', bodyText?.slice(0, 500))

  await expect(page).toHaveURL('/admin', { timeout: 10000 })
  await page.screenshot({ path: 'test-results/owner-admin.png', fullPage: true })
  console.log('✅ 비번 변경 → 어드민 진입 성공')
})
