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
    await expect(this.logoutButton).toBeVisible();
  }

  async expectRejected(): Promise<void> {
    await expect(this.error).toBeVisible();
    await expect(this.page).not.toHaveURL(/\/admin\/rooms/);
    await expect(this.logoutButton).toHaveCount(0);
  }
}
