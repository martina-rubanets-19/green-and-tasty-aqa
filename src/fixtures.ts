import { test as base, expect } from '@playwright/test';
import { SiteApi } from './api/SiteApi';
import { env, hasAdminCredentials } from './config/env';
import { HomePage } from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

/**
 * Collects the unique markers of contact messages a test created and deletes those
 * messages after the test (through the admin API), so a run leaves no data behind.
 * Without admin credentials cleanup is skipped — the data is still unique per run.
 */
export class MessageCleanup {
  private readonly markers: string[] = [];
  constructor(private readonly api: SiteApi) {}

  track(marker: string): void {
    this.markers.push(marker);
  }

  async run(): Promise<void> {
    if (this.markers.length === 0 || !hasAdminCredentials()) return;
    try {
      const token = await this.api.loginToken(env.adminUsername, env.adminPassword);
      if (!token) return;
      const messages = await this.api.listMessages(token);
      for (const message of messages) {
        if (this.markers.some((m) => message.name.includes(m) || message.subject.includes(m))) {
          await this.api.deleteMessage(token, message.id);
        }
      }
    } catch (error) {
      // Cleanup must never hide the real test result.
      console.warn(`[cleanup] could not delete test messages: ${String(error)}`);
    }
  }
}

type Fixtures = {
  api: SiteApi;
  homePage: HomePage;
  roomPage: RoomPage;
  adminLoginPage: AdminLoginPage;
  messageCleanup: MessageCleanup;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new SiteApi(request));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  roomPage: async ({ page }, use) => {
    await use(new RoomPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  messageCleanup: async ({ api }, use) => {
    const cleanup = new MessageCleanup(api);
    await use(cleanup);
    await cleanup.run();
  },
});

export { expect };
