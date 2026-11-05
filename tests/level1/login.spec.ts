import { test, expect } from '../../src/fixtures';
import { env, hasAdminCredentials } from '../../src/config/env';

/**
 * Level 1 — Sign in.
 * The site has one kind of account (hotel admin). Correct credentials let the user in,
 * anything else is rejected with "Invalid credentials".
 * Credentials come from ADMIN_USERNAME / ADMIN_PASSWORD (.env locally, secrets in CI).
 */

const TAGS = ['@level1', '@ui', '@login'];

test.describe('Admin sign in', () => {
  test.beforeEach(async ({ adminLoginPage }) => {
    await adminLoginPage.open();
  });

  test('correct credentials let the user in', { tag: [...TAGS, '@smoke'] }, async ({ adminLoginPage }) => {
    test.skip(!hasAdminCredentials(), 'ADMIN_USERNAME / ADMIN_PASSWORD are not configured');

    await adminLoginPage.signIn(env.adminUsername, env.adminPassword);

    await adminLoginPage.expectSignedIn();
  });

  test('a signed-in user can sign out and is asked to log in again', { tag: TAGS }, async ({ page, adminLoginPage }) => {
    test.skip(!hasAdminCredentials(), 'ADMIN_USERNAME / ADMIN_PASSWORD are not configured');

    await adminLoginPage.signIn(env.adminUsername, env.adminPassword);
    await adminLoginPage.expectSignedIn();

    await adminLoginPage.logoutButton.click();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(adminLoginPage.logoutButton).toHaveCount(0);
  });

  const rejected: { title: string; username: () => string; password: () => string }[] = [
    { title: 'wrong password', username: () => env.adminUsername || 'admin', password: () => 'definitely-wrong-password' },
    { title: 'unknown username', username: () => `nobody-${Date.now()}`, password: () => env.adminPassword || 'password' },
    { title: 'username in a different case', username: () => (env.adminUsername || 'admin').toUpperCase(), password: () => env.adminPassword || 'password' },
    { title: 'password with a trailing space', username: () => env.adminUsername || 'admin', password: () => `${env.adminPassword || 'password'} ` },
    { title: 'empty username and password', username: () => '', password: () => '' },
    { title: 'empty password', username: () => env.adminUsername || 'admin', password: () => '' },
  ];

  for (const r of rejected) {
    test(`${r.title} — is rejected with a message`, { tag: [...TAGS, '@negative'] }, async ({ adminLoginPage }) => {
      await adminLoginPage.signIn(r.username(), r.password());

      await adminLoginPage.expectRejected();
    });
  }
});

test.describe('Sign in — API', () => {
  test('the login endpoint rejects wrong credentials with 401', { tag: ['@level1', '@api', '@login', '@negative'] }, async ({ api }) => {
    const response = await api.login('admin', `wrong-${Date.now()}`);
    expect(response.status()).toBe(401);
  });

  test('the login endpoint accepts correct credentials', { tag: ['@level1', '@api', '@login'] }, async ({ api }) => {
    test.skip(!hasAdminCredentials(), 'ADMIN_USERNAME / ADMIN_PASSWORD are not configured');
    const token = await api.loginToken(env.adminUsername, env.adminPassword);
    expect(token, 'a session token is issued').toBeTruthy();
  });
});
