import { expect, Locator, Page } from '@playwright/test';

/** Admin login (/admin) and the page an admin lands on after signing in. */
export class AdminLoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.error = page.getByRole('alert').filter({ hasText: 'Invalid credentials' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
  }

  async open(): Promise<void> {
    await this.page.goto('/admin');
    await expect(this.page.getByRole('heading', { name: 'Login' })).toBeVisible();
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectSignedIn(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/rooms/);
    await expect(this.loginButton).toHaveCount(0);
    await expect(this.error).toHaveCount(0);
  }

  /**
   * Note: the admin navigation (with its "Logout" button) is rendered on /admin even
   * before signing in, so "no Logout button" is NOT a valid signal of being signed out.
   * The reliable signals are: error shown, still on the login form, not on /admin/rooms.
   */
  async expectRejected(): Promise<void> {
    await expect(this.error).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.username).toBeVisible();
    await expect(this.page).not.toHaveURL(/\/admin\/rooms/);
  }

  async expectLoginFormShown(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(this.username).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}
