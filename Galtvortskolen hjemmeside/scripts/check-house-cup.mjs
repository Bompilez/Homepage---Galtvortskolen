import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let result = {
    title: 'Testsesong',
    _updatedAt: '2026-09-11T12:00:00Z',
    scores: { griffing: 1483, smygard: 2305, ravnklo: 2805, hasblas: 1848 },
  };
  let fail = false;
  await page.route('https://*.api.sanity.io/**', (route) =>
    route.fulfill({
      status: fail ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify({ result }),
    }),
  );
  await page.clock.install();
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  const board = page.locator('.house-cup');
  await board.scrollIntoViewIfNeeded();
  await expect(board.locator('[data-cup-leader]')).toHaveText('Ravnklo leder huscupen');
  await expect(board.locator('[data-house]').first()).toHaveAttribute('data-house', 'ravnklo');
  await board.screenshot({ path: '/tmp/galtvort-house-cup-demo.png', animations: 'disabled' });
  result.scores.griffing = 3000;
  await page.clock.runFor(15000);
  await expect(board.locator('[data-cup-leader]')).toHaveText('Griffing leder huscupen');
  result.scores.smygard = 3000;
  await page.clock.runFor(15000);
  await expect(board.locator('[data-cup-leader]')).toHaveText('Delt ledelse: Griffing, Smygard');
  fail = true;
  await page.clock.runFor(15000);
  await expect(board).toHaveAttribute('data-connection', 'error');
  await expect(board.locator('[data-house]').first()).toHaveAttribute('data-house', 'griffing');
  fail = false;
  result.entries = [
    {
      _key: 'award',
      recipient: 'Ada',
      awardedBy: 'Professor McSnurp',
      house: 'ravnklo',
      points: 200,
      reason: 'Godt samarbeid på oppdraget.',
      occurredAt: '2026-09-11T12:10:00Z',
    },
    {
      _key: 'deduction',
      recipient: 'Testlaget',
      awardedBy: 'Professor Slur',
      house: 'griffing',
      points: -3500,
      reason: 'Test av poengtrekk.',
      occurredAt: '2026-09-11T12:20:00Z',
    },
  ];
  await page.clock.runFor(15000);
  await expect(board).toHaveAttribute('data-connection', 'ok');
  await expect(board.locator('[data-house="ravnklo"] [data-cup-points]')).toHaveText(
    /3\s005 poeng/,
  );
  await expect(board.locator('[data-house="griffing"] [data-cup-points]')).toHaveText('−500 poeng');
  await expect(board.locator('[data-cup-leader]')).toHaveText('Ravnklo leder huscupen');
  await expect(board.locator('.cup-event').first()).toContainText('Testlaget');
  await expect(board.locator('.cup-event').first()).toContainText('−3');
  await expect(board.locator('.cup-event').last()).toContainText('Godt samarbeid på oppdraget.');
  await expect(board.locator('.cup-event').last()).toContainText('+200');
  await expect(board.locator('.cup-event').last()).toContainText('Gitt av Professor McSnurp');
  await expect(board.locator('.cup-event').first()).toContainText('Gitt av Professor Slur');
  await board.screenshot({ path: '/tmp/galtvort-house-cup-log.png', animations: 'disabled' });
  // Every event affects the total, including entries beyond the eight shown.
  result.entries = Array.from({ length: 10 }, (_, index) => ({
    _key: String(index),
    recipient: `Lag ${index}`,
    house: 'hasblas',
    points: 10,
    reason: 'Testpoeng',
    occurredAt: `2026-09-11T12:${String(index).padStart(2, '0')}:00Z`,
  }));
  await page.clock.runFor(15000);
  await expect(board.locator('.cup-event')).toHaveCount(8);
  await expect(board.locator('[data-event-by]:visible')).toHaveCount(0);
  await expect(board.locator('[data-house="hasblas"] [data-cup-points]')).toHaveText(
    /1\s948 poeng/,
  );
  await expect(board.locator('.cup-event').first()).toContainText('Lag 9');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw Error(`Log overflow at ${width}`);
  }
  await board.scrollIntoViewIfNeeded();
  result = {
    title: 'Ny sesong etter vinterleiren',
    _updatedAt: '2026-09-11T12:30:00Z',
    scores: { griffing: 0, smygard: 0, ravnklo: 0, hasblas: 0 },
  };
  await page.clock.runFor(15000);
  await expect(board).toHaveAttribute('data-connection', 'ok');
  await expect(board.locator('[data-cup-season]')).toHaveText(result.title);
  await expect(board.locator('[data-cup-leader]')).toHaveText('Alle hus står på 0 poeng');
  await expect(board.locator('.cup-event')).toHaveCount(0);
  await expect(board.locator('[data-cup-empty]')).toBeVisible();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw Error(`Overflow at ${width}`);
  }
  result = null;
  await board.scrollIntoViewIfNeeded();
  await page.clock.runFor(15000);
  await expect(board.locator('[data-cup-status]')).toHaveText('Ingen poeng er publisert ennå.');
  console.log(
    'OK: automatic score changes, sorting, ties, network recovery, season reset, empty state and mobile widths.',
  );
  if (!process.env.CUP_CHECK_LIVE) {
    console.log('Live Sanity check: run with CUP_CHECK_LIVE=1 after configuring CORS.');
  } else {
    await page.unrouteAll();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await board.scrollIntoViewIfNeeded();
    await expect(board).toHaveAttribute('data-connection', 'ok', { timeout: 15000 });
    console.log('OK: live Sanity query from browser.');
    await board.screenshot({ path: '/tmp/galtvort-house-cup.png' });
  }
} finally {
  await browser.close();
}
