import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
const paths = [
  '/',
  '/opplevelsen/',
  '/arrangementer/',
  '/arrangementer/nyttarsball-2027/',
  '/foresatte/',
  '/praktisk-info/',
  '/om-oss/',
  '/admin/',
];
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of paths) {
    const response = await page.goto('http://localhost:4321' + route);
    assert.equal(response.status(), 200, route);
    await page.evaluate(() =>
      document.querySelectorAll('img').forEach((img) => (img.loading = 'eager')),
    );
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.images].every((img) => img.complete));
    assert.equal(await page.locator('main h1').count(), 1, `${route}: one h1`);
    const invalid = await page.evaluate(() =>
      [...document.images].filter((img) => !img.naturalWidth || !img.alt).map((img) => img.src),
    );
    assert.deepEqual(invalid, [], `${route}: images and alt text`);
    const links = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href').split('#')[0]))]);
    for (const link of links)
      assert.equal(
        (await page.request.get('http://localhost:4321' + link)).status(),
        200,
        `Broken link ${link}`,
      );
  }
  await page.goto('http://localhost:4321/');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '/tmp/galtvort-desktop.png', fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of paths) {
      await page.goto('http://localhost:4321' + route);
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .map((el) => el.tagName + '.' + el.className),
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        `${route}: overflow at ${width}: ${overflow.join(', ')}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:4321/');
  const toggle = page.getByRole('button', { name: 'Meny' });
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await toggle.evaluate((el) => el === document.activeElement), true);
  await toggle.click();
  await page.locator('#mobile-menu').getByRole('link', { name: 'For foresatte' }).click();
  await page.waitForURL('**/foresatte/');
  await page.goto('http://localhost:4321/');
  await page.screenshot({ path: '/tmp/galtvort-mobile.png', fullPage: true });
  assert.deepEqual(errors, [], 'No browser errors');
  console.log(
    'OK: 8 sider, interne lenker, bilder, mobilmeny, tastatur og mobilbredder 320/390 px.',
  );
} finally {
  await browser.close();
}
