import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('.magic-toggle');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAccessibleName('Nox – slukk magien');
  await page.mouse.move(700, 450);
  const pixels = () =>
    page.locator('.magic-canvas').evaluate((canvas) =>
      canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.some((value, index) => index % 4 === 3 && value > 0),
    );
  await expect.poll(pixels).toBe(true);
  await page.screenshot({ path: '/tmp/galtvort-lumos.png' });
  await page.getByRole('link', { name: 'Oppdag Galtvortskolen', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.site-magic')).not.toHaveClass(/show-message/);
  await page.mouse.move(650, 400);
  await expect.poll(pixels).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect.poll(pixels).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toggle.click();
  await expect(page.locator('.magic-canvas')).toBeHidden();
  await expect(page.locator('.magic-message')).toHaveText('Lumos! Et lite lys i mørket.');
  await toggle.click();
  await page.getByRole('link', { name: 'Oppdag Galtvortskolen', exact: true }).click();
  await expect(page).toHaveURL(/opplevelsen/);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  await mobile.locator('.magic-toggle').tap();
  await expect(mobile.locator('.magic-toggle')).toHaveAttribute('aria-pressed', 'true');
  await mobile.touchscreen.tap(180, 450);
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 });
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw Error('Mobile overflow');
  }
  await mobile.locator('.magic-toggle').tap();
  await expect(mobile.locator('.magic-toggle')).toHaveAttribute('aria-pressed', 'false');
  if (errors.length) throw Error(errors.join('\n'));
  console.log(
    'OK: keyboard toggle, rendered particles, Nox cleanup, reduced motion, ordinary navigation, touch and mobile widths.',
  );
} finally {
  await browser.close();
}
