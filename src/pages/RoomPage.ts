import { expect, Locator, Page } from '@playwright/test';

/** Room details / reservation page: /reservation/{roomId}. */
export class RoomPage {
  readonly title: Locator;
  readonly descriptionHeading: Locator;
  readonly featuresHeading: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('heading', { level: 1 });
    this.descriptionHeading = page.getByRole('heading', { name: 'Room Description' });
    this.featuresHeading = page.getByRole('heading', { name: 'Room Features' });
  }

  async open(roomId: number | string): Promise<void> {
    await this.page.goto(`/reservation/${roomId}`);
  }

  /**
   * The page renders only after two client-side requests (room + branding), and the site's
   * proxy retries slow backends with back-off, so the room details get a longer timeout.
   * The breadcrumb ("Home / Rooms / <Type> Room") is the anchor: it is a nav landmark with
   * aria-current, rendered together with the details.
   */
  async expectRoomShown(roomType: string): Promise<void> {
    const current = this.page.getByRole('navigation', { name: 'breadcrumb' }).locator('[aria-current="page"]');
    await expect(current).toHaveText(new RegExp(`^\\s*${escapeRegExp(roomType)} Room\\s*$`), { timeout: 20_000 });
    await expect(this.title).toContainText(roomType);
    await expect(this.descriptionHeading).toBeVisible();
    await expect(this.featuresHeading).toBeVisible();
  }

  async expectNoRoomShown(): Promise<void> {
    // Give the client a chance to fetch and render, then make sure no room details appeared.
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(this.descriptionHeading).toHaveCount(0);
    await expect(this.featuresHeading).toHaveCount(0);
  }
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
