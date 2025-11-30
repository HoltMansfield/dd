import { test, expect } from '@playwright/test';

test('secure page is accessible when logged in', async ({ page }) => {
  // Go directly to secure page
  await page.goto(`${process.env.E2E_URL}/secure-page`);
  
  // Check if we're redirected to login page
  if (page.url().includes('/login')) {
    console.log('Redirected to login page, need to authenticate');
    
    // Generate a unique test user
    const uniqueEmail = `secure-test-${Date.now()}@example.com`;
    const password = 'Password123';
    
    // Register a new user
    await page.goto(`${process.env.E2E_URL}/register`);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Login with the new user
    await page.goto(`${process.env.E2E_URL}/login`);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }
  
  // Now navigate to secure page
  await page.goto(`${process.env.E2E_URL}/secure-page`);
  await page.waitForTimeout(2000);
  
  // Get the page content and check for secure page text
  const content = await page.content();
  expect(content.includes('Secure Page') || content.includes('secure page')).toBeTruthy();
  expect(content.includes('authenticated')).toBeTruthy();
});
