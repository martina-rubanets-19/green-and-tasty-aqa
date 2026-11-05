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

  async expectRoomShown(roomType: string): Promise<void> {
    await expect(this.title).toHaveText(new RegExp(`^\\s*${escapeRegExp(roomType)} Room\\s*$`));
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
