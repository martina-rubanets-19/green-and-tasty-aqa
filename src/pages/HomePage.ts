import { expect, Locator, Page } from '@playwright/test';
import type { ContactMessage } from '../data/factories';

/** Front page: availability search, room cards ("menu") and the contact form. */
export class HomePage {
  readonly roomsSection: Locator;
  readonly roomCards: Locator;
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly checkAvailabilityButton: Locator;
  readonly contact: ContactForm;

  constructor(private readonly page: Page) {
    this.roomsSection = page.locator('section#rooms');
    this.roomCards = this.roomsSection.locator('.room-card');
    const booking = page.locator('section#booking');
    // The react-datepicker inputs have no accessible name; they are the only text inputs in the card.
    this.checkInInput = booking.locator('input.form-control').nth(0);
    this.checkOutInput = booking.locator('input.form-control').nth(1);
    this.checkAvailabilityButton = page.getByRole('button', { name: 'Check Availability' });
    this.contact = new ContactForm(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Our Rooms' })).toBeVisible();
  }

  async waitForRooms(): Promise<void> {
    await expect(this.roomCards.first()).toBeVisible();
  }

  roomCard(index: number): RoomCard {
    return new RoomCard(this.roomCards.nth(index));
  }

  async roomCount(): Promise<number> {
    return this.roomCards.count();
  }

  /** Types dates as the date picker shows them (dd/MM/yyyy) and runs the search. */
  async searchAvailability(checkInUk: string, checkOutUk: string): Promise<void> {
    await this.setDate(this.checkInInput, checkInUk);
    await this.setDate(this.checkOutInput, checkOutUk);
    await this.checkAvailabilityButton.click();
  }

  private async setDate(input: Locator, value: string): Promise<void> {
    await input.click();
    await input.fill(value);
    await input.press('Enter');
    await expect(input).toHaveValue(value);
    // Make sure the calendar popup is closed so it does not cover the next control.
    const popper = this.page.locator('.react-datepicker-popper');
    if (await popper.count()) await input.press('Escape');
    await popper.waitFor({ state: 'detached', timeout: 3_000 }).catch(() => undefined);
  }
}

/** One room card on the front page. */
export class RoomCard {
  readonly title: Locator;
  readonly price: Locator;
  readonly bookNowLink: Locator;

  constructor(readonly root: Locator) {
    this.title = root.locator('.card-title');
    this.price = root.locator('.card-footer .fw-bold');
    this.bookNowLink = root.getByRole('link', { name: 'Book now' });
  }

  async roomType(): Promise<string> {
    return (await this.title.innerText()).trim();
  }

  async bookNowHref(): Promise<string> {
    return (await this.bookNowLink.getAttribute('href')) ?? '';
  }
}

/** "Send Us a Message" form — the site's analogue of a registration form with validation. */
export class ContactForm {
  readonly section: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly subject: Locator;
  readonly description: Locator;
  readonly submitButton: Locator;
  readonly errors: Locator;
  readonly thankYouHeading: Locator;

  constructor(page: Page) {
    this.section = page.locator('section#contact');
    this.name = page.getByTestId('ContactName');
    this.email = page.getByTestId('ContactEmail');
    this.phone = page.getByTestId('ContactPhone');
    this.subject = page.getByTestId('ContactSubject');
    this.description = page.getByTestId('ContactDescription');
    this.submitButton = this.section.getByRole('button', { name: 'Submit' });
    this.errors = this.section.locator('.alert-danger');
    this.thankYouHeading = this.section.getByRole('heading', { name: /Thanks for getting in touch/ });
  }

  async fill(message: ContactMessage): Promise<void> {
    await this.name.fill(message.name);
    await this.email.fill(message.email);
    await this.phone.fill(message.phone);
    await this.subject.fill(message.subject);
    await this.description.fill(message.description);
  }

  async submit(message: ContactMessage): Promise<void> {
    await this.section.scrollIntoViewIfNeeded();
    await this.fill(message);
    await this.submitButton.click();
  }
}
