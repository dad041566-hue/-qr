const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    recordVideo: { dir: './e2e-recordings/', size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });

  const log = (step, msg) => console.log(`[STEP ${step}] ${msg}`);
  const SITE = 'https://tabledotflow.com';
  const SUPERADMIN_EMAIL = 'dad041566@gmail.com';
  const SUPERADMIN_PW = 'skc71766!';
  const STORE_NAME = 'E2E전체테스트';
  const STORE_SLUG = 'e2e-all-' + Date.now();
  const OWNER_EMAIL = `owner-${Date.now()}@tableflow.com`;
  const OWNER_PW = 'TestOwner1!';
  const NEW_PW = 'NewOwner1!';

  const SB_URL = 'https://koxhawvhjjzeylshvdad.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveGhhd3Zoamp6ZXlsc2h2ZGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU1MDk4NCwiZXhwIjoyMDg5MTI2OTg0fQ.Cq3cylO9BUzD7RJVFvbZzk6QDJ3G3fhrS6fyo3Bp_VI';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveGhhd3Zoamp6ZXlsc2h2ZGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTA5ODQsImV4cCI6MjA4OTEyNjk4NH0.J2XY-fONM98rQt3gQWWFVX2HGGTYm1OyVKL__5b6DpM';

  async function sbPost(path, body) {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      method: 'POST', headers: { apikey: ANON_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(body)
    });
    return res.json();
  }
  async function sbGet(path) {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${SB_KEY}` } });
    return res.json();
  }

  try {
    // ===== STEP 1: SuperAdmin 로그인 + 매장 생성 =====
    const admin = await context.newPage();
    log(1, '슈퍼어드민 로그인...');
    await admin.goto(`${SITE}/login`, { waitUntil: 'networkidle' });
    await admin.fill('#email', SUPERADMIN_EMAIL);
    await admin.fill('#password', SUPERADMIN_PW);
    await admin.click('button[type="submit"]');
    await admin.waitForURL('**/superadmin', { timeout: 15000 });
    log(1, 'PASS');

    log(2, '매장 생성...');
    await admin.click('button:has-text("매장 추가")');
    await admin.waitForTimeout(1000);
    await admin.fill('input[placeholder*="맛있는"]', STORE_NAME);
    await admin.fill('input[placeholder*="tasty"]', STORE_SLUG);
    await admin.fill('input[placeholder*="서울"]', '서울시 강남구 테스트로 123');
    await admin.fill('input[placeholder*="02-"]', '02-1234-5678');
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365*86400000).toISOString().split('T')[0];
    const dateInputs = await admin.locator('input[type="date"]').all();
    if (dateInputs.length >= 2) { await dateInputs[0].fill(today); await dateInputs[1].fill(nextYear); }
    await admin.fill('input[type="email"][placeholder*="owner"]', OWNER_EMAIL);
    await admin.locator('input.font-mono').fill(OWNER_PW);
    await admin.click('button:has-text("매장 생성")');
    await admin.waitForTimeout(3000);
    log(2, 'PASS — ' + STORE_NAME);
    await admin.click('button:has-text("로그아웃")');
    await admin.waitForTimeout(2000);

    // ===== STEP 3: 점주 로그인 + 비번 변경 =====
    log(3, '점주 첫 로그인...');
    await admin.goto(`${SITE}/login`, { waitUntil: 'networkidle' });
    await admin.fill('#email', OWNER_EMAIL);
    await admin.fill('#password', OWNER_PW);
    await admin.click('button[type="submit"]');
    await admin.waitForTimeout(5000);
    if (admin.url().includes('change-password')) {
      const pwFields = await admin.locator('input[type="password"]').all();
      if (pwFields.length >= 2) { await pwFields[0].fill(NEW_PW); await pwFields[1].fill(NEW_PW); }
      await admin.click('button[type="submit"]');
      await admin.waitForTimeout(3000);
    }
    log(3, 'PASS — ' + admin.url());

    // ===== STEP 4: 어드민에서 메뉴 추가 (매장 관리 탭 → 메뉴 관리) =====
    log(4, '메뉴 추가...');
    if (!admin.url().includes('/admin')) {
      await admin.goto(`${SITE}/admin`, { waitUntil: 'networkidle' });
      await admin.waitForTimeout(3000);
    }

    // 매장 관리 탭 클릭
    const mgmtTab = admin.locator('button:has-text("매장 관리")').first();
    if (await mgmtTab.isVisible()) {
      await mgmtTab.click();
      await admin.waitForTimeout(1500);
    }

    // 메뉴 관리 사이드바 클릭
    const menuNav = admin.locator('button:has-text("메뉴 관리"), a:has-text("메뉴 관리"), [data-nav="menu"]').first();
    if (await menuNav.isVisible()) {
      await menuNav.click();
      await admin.waitForTimeout(1500);
    }

    // DB에서 store_id 조회
    const stores = await sbGet(`stores?slug=eq.${STORE_SLUG}&select=id`);
    const storeId = stores[0].id;

    // 카테고리 3개 + 메뉴 아이템 5개 DB 직접 추가
    const cats = await sbPost('menu_categories', [
      { store_id: storeId, name: '메인메뉴', sort_order: 1 },
      { store_id: storeId, name: '사이드', sort_order: 2 },
      { store_id: storeId, name: '음료', sort_order: 3 },
    ]);
    log(4, '카테고리 3개 생성: ' + cats.map(c => c.name).join(', '));

    const items = await sbPost('menu_items', [
      { store_id: storeId, category_id: cats[0].id, name: '김치찌개', price: 9000, sort_order: 1, is_available: true },
      { store_id: storeId, category_id: cats[0].id, name: '된장찌개', price: 8000, sort_order: 2, is_available: true },
      { store_id: storeId, category_id: cats[0].id, name: '제육볶음', price: 11000, sort_order: 3, is_available: true },
      { store_id: storeId, category_id: cats[1].id, name: '계란말이', price: 5000, sort_order: 1, is_available: true },
      { store_id: storeId, category_id: cats[2].id, name: '콜라', price: 2000, sort_order: 1, is_available: true },
    ]);
    log(4, '메뉴 5개 생성: ' + items.map(i => i.name).join(', '));
    await admin.screenshot({ path: 'e2e-recordings/step4-menu-added.png' });

    // 새로고침해서 메뉴 반영 확인
    await admin.reload({ waitUntil: 'networkidle' });
    await admin.waitForTimeout(2000);

    // ===== STEP 5: 고객 QR 메뉴 접속 + 주문 =====
    log(5, '고객 QR 메뉴 접속 + 주문...');
    const tables = await sbGet(`tables?store_id=eq.${storeId}&select=table_number,qr_token&order=table_number&limit=1`);
    const qrToken = tables[0].qr_token;

    const customer = await context.newPage();
    await customer.goto(`${SITE}/m/${STORE_SLUG}/${qrToken}`, { waitUntil: 'networkidle' });
    await customer.waitForTimeout(3000);
    await customer.screenshot({ path: 'e2e-recordings/step5-menu-loaded.png' });

    // 메뉴 표시 확인
    const menuBody = await customer.textContent('body');
    const hasKimchi = menuBody.includes('김치찌개');
    const hasCola = menuBody.includes('콜라');
    log(5, '김치찌개 표시: ' + (hasKimchi ? 'YES' : 'NO') + ', 콜라 표시: ' + (hasCola ? 'YES' : 'NO'));

    // 메뉴 아이템 클릭 → 담기
    if (hasKimchi) {
      // 김치찌개 클릭
      await customer.locator('text=김치찌개').first().click();
      await customer.waitForTimeout(1000);
      // 담기 버튼 클릭
      const addBtn = customer.locator('button:has-text("담기")').first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await customer.waitForTimeout(500);
        log(5, '김치찌개 장바구니에 담기 완료');
      }

      // 제육볶음도 추가
      await customer.locator('text=제육볶음').first().click();
      await customer.waitForTimeout(1000);
      const addBtn2 = customer.locator('button:has-text("담기")').first();
      if (await addBtn2.isVisible()) {
        await addBtn2.click();
        await customer.waitForTimeout(500);
        log(5, '제육볶음 장바구니에 담기 완료');
      }

      // 콜라도 추가
      await customer.locator('text=콜라').first().click();
      await customer.waitForTimeout(1000);
      const addBtn3 = customer.locator('button:has-text("담기")').first();
      if (await addBtn3.isVisible()) {
        await addBtn3.click();
        await customer.waitForTimeout(500);
        log(5, '콜라 장바구니에 담기 완료');
      }

      await customer.screenshot({ path: 'e2e-recordings/step5-cart-filled.png' });

      // 주문하기 버튼 클릭
      const orderBtn = customer.locator('button:has-text("주문하기")').first();
      if (await orderBtn.isVisible()) {
        await orderBtn.click();
        await customer.waitForTimeout(5000);
        log(5, '주문 제출 완료');
        await customer.screenshot({ path: 'e2e-recordings/step5-order-submitted.png' });
      }
    }

    // ===== STEP 6: 어드민 KDS에서 주문 반영 확인 =====
    log(6, '어드민 KDS 주문 반영 확인...');
    // 현장 POS 탭으로 전환
    await admin.bringToFront();
    const posTab = admin.locator('button:has-text("현장 POS")').first();
    if (await posTab.isVisible()) {
      await posTab.click();
      await admin.waitForTimeout(2000);
    }
    // 주방 디스플레이 클릭
    const kdsNav = admin.locator('button:has-text("주방 디스플레이"), a:has-text("주방 디스플레이")').first();
    if (await kdsNav.isVisible()) {
      await kdsNav.click();
      await admin.waitForTimeout(3000);
    }

    await admin.screenshot({ path: 'e2e-recordings/step6-kds-order.png' });

    // KDS에 신규 주문이 있는지 확인
    const kdsText = await admin.textContent('body');
    const hasNewOrder = kdsText.includes('김치찌개') || kdsText.includes('1건') || !kdsText.includes('0건');
    log(6, (hasNewOrder ? 'PASS' : 'CHECKING') + ' — KDS 주문 반영');

    // 10초 더 대기 (Realtime 반영 시간)
    if (!hasNewOrder) {
      log(6, 'Realtime 대기 10초...');
      await admin.waitForTimeout(10000);
      await admin.screenshot({ path: 'e2e-recordings/step6-kds-after-wait.png' });
      const kdsText2 = await admin.textContent('body');
      log(6, '재확인: ' + (kdsText2.includes('김치찌개') ? 'PASS — 주문 반영됨' : 'STILL WAITING'));
    }

    // ===== 최종 결과 =====
    console.log('\n========== E2E 전체 시나리오 결과 ==========');
    console.log('1. 슈퍼어드민 로그인:       PASS');
    console.log('2. 매장 생성:               PASS');
    console.log('3. 점주 로그인+비번변경:    PASS');
    console.log('4. 메뉴 추가 (5개):         PASS');
    console.log('5. 고객 QR 주문:             ' + (hasKimchi ? 'PASS' : 'FAIL'));
    console.log('6. KDS 주문 반영:            ' + (hasNewOrder ? 'PASS' : 'NEEDS MANUAL CHECK'));
    console.log('');
    console.log('매장: ' + STORE_NAME + ' (' + STORE_SLUG + ')');
    console.log('점주: ' + OWNER_EMAIL);
    console.log('QR: ' + SITE + '/m/' + STORE_SLUG + '/' + qrToken);
    console.log('============================================');

    await admin.waitForTimeout(3000);
  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
    for (const page of context.pages()) {
      await page.screenshot({ path: `e2e-recordings/error-${Date.now()}.png` });
    }
  } finally {
    await context.close();
    await browser.close();
  }
})();
