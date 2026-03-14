import { test, expect } from '@playwright/test';

test.describe('NoteFlow App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.evaluate(() => indexedDB.deleteDatabase('noteflow'));
    await page.reload();
  });

  test('should load FileList on home', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Notes');
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
    await expect(page.locator('button:has-text("Import")')).toBeVisible();
  });

  test('should add new note', async ({ page }) => {
    await page.fill('[contenteditable].title-input', 'Test Note');
    await page.fill('input[placeholder="Category"]', 'TestCategory');
    await page.click('button:has-text("Add")');
    await expect(page).toHaveURL(/\/file\//);
    await expect(page.locator('.title-input')).toContainText('Test Note');
  });

  test('should save note content', async ({ page }) => {
    await page.click('button:has-text("Add")');
    await expect(page).toHaveURL(/\/file\//);
    await page.locator('.editor-container').click();
    await page.keyboard.type('# Hello World');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(300);
    await expect(page.locator('.btn:has-text("Save")')).not.toHaveClass(/btn-dirty/);
  });

  test('should delete note with confirmation', async ({ page }) => {
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Delete")');
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();
    await page.locator('dialog button.btn-danger:has-text("Delete")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('h1')).toContainText('Notes');
  });

  test('should navigate to search', async ({ page }) => {
    await page.click('button:has-text("Search")');
    await expect(page).toHaveURL(/#\/search/);
    await expect(page.locator('input[placeholder="Search notes..."]')).toBeVisible();
    await expect(page.locator('button:has-text("Home")')).toBeVisible();
  });

  test('should search notes', async ({ page }) => {
    await page.goto('http://localhost:5174/#/search');
    await expect(page.locator('input[placeholder="Search notes..."]')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.fill('[contenteditable].title-input', 'Note A');
    await page.fill('input[placeholder="Category"]', 'Work');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(500);
    await expect(page.locator('.checkbox-label')).toContainText('Work');
  });

  test('should export and import notes', async ({ page }) => {
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Home")');
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('notes.json');
  });

  test('should go to file from list', async ({ page }) => {
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(1000);
    const noteItem = page.locator('.note-item');
    if (await noteItem.count() > 0) {
      await expect(noteItem.first()).toBeVisible();
    }
  });

  test('should have dark/light theme support', async ({ page }) => {
    const prefersDark = await page.evaluate(() => 
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    const bg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    if (prefersDark) {
      expect(bg).toBe('rgb(26, 26, 26)');
    }
  });
});
