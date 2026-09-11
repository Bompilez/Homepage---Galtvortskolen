import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const expected = JSON.parse(
  await readFile(new URL('../src/lib/team.json', import.meta.url), 'utf8'),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:4321/om-oss/');
  assert.equal(await page.getByText('På denne siden', { exact: true }).count(), 0);
  assert.equal(await page.locator('.team-card').count(), expected.members.length);
  await page.evaluate(() =>
    document.querySelectorAll('.team-portrait').forEach((img) => (img.loading = 'eager')),
  );
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.team-portrait')].every(
      (img) => img.complete && img.naturalWidth > 0,
    ),
  );
  for (const member of expected.members) {
    const trigger = page.getByRole('button', { name: `Les mer om ${member.name}`, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.getByRole('heading', { name: member.name, exact: true }).count(), 1);
    assert.equal(
      await dialog
        .locator('.team-biography')
        .textContent()
        .then((t) => t.includes(member.bio[0])),
      true,
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll('dialog img')].every(
        (img) => img.complete && img.naturalWidth > 0,
      ),
    );
    if (member.photos.length > 1) {
      const second = dialog.locator('.team-thumbnail').nth(1);
      await second.click();
      assert.equal(await second.getAttribute('aria-pressed'), 'true');
      assert.equal(
        await dialog.locator('.team-dialog-portrait').getAttribute('src'),
        await second.getAttribute('data-photo-src'),
      );
    }
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
    assert.equal(await trigger.evaluate((el) => document.activeElement === el), true);
  }
  await page.locator('#team-heading').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/galtvort-team-desktop.png' });
  const first = page.locator('.team-read-more').first();
  await first.click();
  await page.screenshot({ path: '/tmp/galtvort-team-dialog.png' });
  await page.getByRole('button', { name: 'Lukk', exact: true }).click();
  await first.click();
  await page.mouse.click(2, 2);
  assert.equal(await page.getByRole('dialog').isVisible(), false);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await first.click();
    const close = page.getByRole('button', { name: 'Lukk', exact: true });
    await close.focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)),
      true,
    );
    assert.equal(
      await page.locator('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth),
      true,
    );
    if (width === 390) await page.screenshot({ path: '/tmp/galtvort-team-mobile.png' });
    await close.click();
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains('team-dialog-open')),
      false,
    );
  }
  await page.goto('http://localhost:4321/foresatte/');
  assert.equal(await page.getByText('På denne siden', { exact: true }).count(), 1);
  assert.deepEqual(errors, []);
  console.log(
    `OK: ${expected.members.length} profiler, bilder, bildebytte, Escape, lukkeknapp, bakgrunnsklikk, fokus og mobil.`,
  );
} finally {
  await browser.close();
}
