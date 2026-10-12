import { test, expect } from '@playwright/test';

test('read articles, follow links and search by Vietnamese text or alias', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Một thư viện');
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Linh An', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Linh An');
  await page.locator('#section-1').getByRole('link', { name: 'Đêm Pha Lê Vỡ' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đêm Pha Lê Vỡ');
  await page.getByRole('searchbox').fill('Cong huong ky uc');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page.locator('#search-results')).toHaveText('');
  await page.getByRole('searchbox').fill('Nguoi giu anh sang');
  await expect(page.locator('#search-results')).toContainText('Linh An');
  await page.getByLabel('Loại bài viết').selectOption('character');
  await expect(page.locator('#search-results article')).toHaveCount(1);
  await page.locator('#search-results').getByRole('link', { name: 'Linh An' }).click();
  await expect(page).toHaveURL(/fandomwiki-generator\/characters\/linh-an.html$/);
});

test('mobile layout is readable and article navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('characters/linh-an.html');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/article-mobile.png', fullPage: true });
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Sự kiện' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sự kiện');
});

test('search has no results state and recovers from index load failure', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('search.html?q=linh');
  await expect(page.getByRole('status')).toContainText('Không thể tải');
  await page.unroute('**/search-index.json');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page.locator('#search-results')).toContainText('Linh An');
  await page.getByRole('searchbox').fill('zzzz-no-article');
  await expect(page.getByRole('status')).toContainText('0 bài viết');
});
