// @ts-check
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

// GitHub API is stubbed in every test: no rate-limit flakiness in CI, and the
// malicious description doubles as an XSS regression test for card rendering.
const FAKE_REPOS = [
    {
        name: 'safe-repo',
        html_url: 'https://github.com/ContiHan/safe-repo',
        description: '<img src=x onerror="window.__ghxss=1"> injected description',
        pushed_at: '2026-01-15T10:00:00Z',
        size: 2048,
        language: 'C#',
        stargazers_count: 3,
        forks_count: 1,
    },
    {
        name: 'second-repo',
        html_url: 'https://github.com/ContiHan/second-repo',
        description: null,
        pushed_at: '2026-02-01T10:00:00Z',
        size: 100,
        language: 'Python',
        stargazers_count: 0,
        forks_count: 0,
    },
];

async function stubGithub(page, repos = FAKE_REPOS) {
    await page.route('https://api.github.com/**', (route) => route.fulfill({ json: repos }));
}

test.describe('page health', () => {
    test('loads with correct title and zero console errors', async ({ page }) => {
        const errors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', (err) => errors.push(String(err)));

        await stubGithub(page);
        await page.goto('/');
        await expect(page).toHaveTitle(/Daniel Hanák/);
        await expect(page.locator('#github-repos .github-card')).toHaveCount(2);
        expect(errors).toEqual([]);
    });

    test('no accessibility violations (serious or critical)', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const results = await new AxeBuilder({ page }).analyze();
        const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
        expect(severe.map((v) => `${v.id}: ${v.description}`)).toEqual([]);
    });

    test('skills section shows all six tiles with accessible progress bars', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        await expect(page.locator('.skill-category')).toHaveCount(6);
        await expect(page.locator('.skills-grid [role="progressbar"]')).toHaveCount(6);
    });
});

test.describe('mobile layout (iPhone-sized viewport)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('no horizontal overflow and project cards fit the screen', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            viewport: window.innerWidth,
            cardRight: document.querySelector('.project-card').getBoundingClientRect().right,
        }));
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
        expect(metrics.cardRight).toBeLessThanOrEqual(metrics.viewport);
    });
});

test.describe('interactive terminal', () => {
    test('help lists available commands', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        await page.locator('#terminal-input').fill('help');
        await page.locator('#terminal-input').press('Enter');
        await expect(page.locator('#terminal-body')).toContainText('Available commands');
        await expect(page.locator('#terminal-body')).toContainText('whoami');
    });

    test('echoes malicious input as plain text (no self-XSS)', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const payload = '<img src=x onerror="window.__xss=1">';
        await page.locator('#terminal-input').fill(payload);
        await page.locator('#terminal-input').press('Enter');

        await expect(page.locator('#terminal-body')).toContainText(payload);
        expect(await page.locator('#terminal-body img').count()).toBe(0);
        expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    });

    test('renders GitHub API data as text (no injected markup)', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const card = page.locator('.github-card').first();
        await expect(card).toContainText('injected description');
        expect(await page.locator('#github-repos img').count()).toBe(0);
        expect(await page.evaluate(() => window.__ghxss)).toBeUndefined();
    });

    test('shows a fallback link when the GitHub API fails', async ({ page }) => {
        await page.route('https://api.github.com/**', (route) => route.fulfill({ status: 500, json: {} }));
        await page.goto('/');
        await expect(page.locator('#github-repos a')).toHaveAttribute('href', /github\.com\/ContiHan/);
    });
});

test.describe('terminal v2', () => {
    test('ArrowUp/ArrowDown walk the command history', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const input = page.locator('#terminal-input');
        await input.fill('help');
        await input.press('Enter');
        await input.fill('whoami');
        await input.press('Enter');

        await input.press('ArrowUp');
        await expect(input).toHaveValue('whoami');
        await input.press('ArrowUp');
        await expect(input).toHaveValue('help');
        await input.press('ArrowDown');
        await expect(input).toHaveValue('whoami');
    });

    test('Tab completes a unique prefix to the full command', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const input = page.locator('#terminal-input');
        await input.fill('sk');
        await input.press('Tab');
        await expect(input).toHaveValue('skills');
    });

    test('Tab with nothing to complete moves focus on (no keyboard trap)', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const input = page.locator('#terminal-input');

        await input.click();
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).not.toBe('terminal-input');

        await input.click();
        await input.fill('xyz');
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).not.toBe('terminal-input');
    });

    test('Tab on an ambiguous prefix keeps the common prefix and lists candidates', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const input = page.locator('#terminal-input');
        await input.fill('c');
        await input.press('Tab');
        // 'contact', 'cv' and 'clear' share only 'c', so the input keeps it
        await expect(input).toHaveValue('c');
        await expect(page.locator('#terminal-body')).toContainText('contact cv clear');
    });

    test('theme command flips the color scheme', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const before = await page.locator('html').getAttribute('data-theme');
        const input = page.locator('#terminal-input');
        await input.fill('theme');
        await input.press('Enter');
        const after = await page.locator('html').getAttribute('data-theme');
        expect(after).not.toBe(before);
    });

    test('sudo is refused with the permission-denied joke', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const input = page.locator('#terminal-input');
        await input.fill('sudo rm -rf /');
        await input.press('Enter');
        await expect(page.locator('#terminal-body')).toContainText('Permission denied');
        await expect(page.locator('#terminal-body')).not.toContainText('Command not found');
    });

    test('contact prints a mailto link', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const input = page.locator('#terminal-input');
        await input.fill('contact');
        await input.press('Enter');
        await expect(page.locator('#terminal-body a[href^="mailto:"]')).toHaveCount(1);
    });
});

test.describe('projects section', () => {
    test('shows six cards including "This Website" linking to its own repo', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        await expect(page.locator('.project-card')).toHaveCount(6);

        const card = page.locator('.project-card').filter({
            has: page.locator('h3', { hasText: 'This Website' }),
        });
        await expect(card).toHaveCount(1);
        await expect(card.locator('.project-overlay a')).toHaveAttribute(
            'href',
            /github\.com\/ContiHan\/contihan\.github\.io/,
        );
    });

    test('the This Website card image actually loads', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const img = page.locator('.project-card img[src="assets/this_website.webp"]');
        await img.scrollIntoViewIfNeeded();
        // naturalWidth stays 0 for a missing or undecodable image file
        await expect
            .poll(() => img.evaluate((el) => el.naturalWidth))
            .toBeGreaterThan(0);
    });
});

test.describe('theme', () => {
    test('toggle flips the theme and persists across reload', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const before = await page.locator('html').getAttribute('data-theme');
        await page.locator('#theme-toggle').click();
        const after = await page.locator('html').getAttribute('data-theme');
        expect(after).not.toBe(before);

        await page.reload();
        expect(await page.locator('html').getAttribute('data-theme')).toBe(after);
    });
});

test.describe('easter eggs', () => {
    test('Konami code triggers exactly one overlay and cleans up', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        for (const key of seq) await page.keyboard.press(key);
        await expect(page.locator('#konami-overlay')).toHaveCount(1);

        // re-entering the code while active must not stack a second overlay
        for (const key of seq) await page.keyboard.press(key);
        await expect(page.locator('#konami-overlay')).toHaveCount(1);

        await expect(page.locator('#konami-overlay')).toHaveCount(0, { timeout: 10000 });
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    });

    test('typing "hack" starts the Matrix and Escape cancels it', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        await page.keyboard.type('hack');
        await expect(page.locator('#matrix-overlay')).toHaveCount(1);

        await page.keyboard.press('Escape');
        await expect(page.locator('#matrix-overlay')).toHaveCount(0, { timeout: 15000 });
        expect(await page.evaluate(() => document.body.classList.contains('matrix-mode-active'))).toBe(false);
    });

    test('typing "hack" inside the terminal input does NOT trigger the Matrix', async ({ page }) => {
        await stubGithub(page);
        await page.goto('/');
        await page.locator('#terminal-input').pressSequentially('hack');
        await expect(page.locator('#matrix-overlay')).toHaveCount(0);
    });
});

test.describe('404 page', () => {
    test('renders the terminal with OS-matching chrome and a way home', async ({ page }) => {
        await page.goto('/404.html');
        await expect(page.locator('.terminal-window')).toBeVisible();
        await expect(page.locator('.error-code')).toHaveText('404');

        // Expectation derives from the browser's UA (Playwright device descriptors
        // pin their own UA regardless of host OS), mirroring os-chrome.js logic
        const ua = await page.evaluate(() => navigator.userAgent);
        const win = page.locator('.terminal-window');
        if (/Windows/i.test(ua)) {
            await expect(win).toHaveClass(/os-windows/);
        } else if (/Linux|X11|Android|CrOS/i.test(ua) && !/Mac OS X/i.test(ua)) {
            await expect(win).toHaveClass(/os-linux/);
        } else {
            await expect(win).not.toHaveClass(/os-(windows|linux)/);
        }

        await page.locator('.terminal-body a').click();
        await expect(page).toHaveURL(/\/$|index\.html/);
    });
});
