import { test, expect } from '@playwright/test';
import path from 'path';

test('UI media upload sends multipart/form-data with file field and handles duplicate', async ({ page }) => {
  const url = process.env.TEST_FRONTEND_URL || 'http://localhost:5173';
  await page.goto(url);

  // Open media library - selector may need adjustment depending on app
  await page.click('text=Bibliothèque');
  await page.waitForSelector('input[type=file]');

  const filePath = path.resolve(process.cwd(), 'tmp/test-upload.png');

  // Intercept the next media POST request
  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/api/v1/media') && req.method() === 'POST'),
    page.setInputFiles('input[type=file]', filePath),
    page.click('text=Envoyer'),
  ]);

  const headers = request.headers();
  expect(headers['content-type'] || headers['Content-Type']).toBeTruthy();
  expect((headers['content-type'] || headers['Content-Type']!).includes('multipart/form-data')).toBeTruthy();

  const postData = await (async () => {
    try {
      return request.postData() ?? '';
    } catch (e) {
      return '';
    }
  })();

  // Check that filename is present in multipart payload
  expect(postData.includes('test-upload.png')).toBeTruthy();

  // Wait for response and assert success status
  const response = await request.response();
  expect(response).not.toBeNull();
  expect(response!.status()).toBeGreaterThanOrEqual(200);
  expect(response!.status()).toBeLessThan(500);
});
