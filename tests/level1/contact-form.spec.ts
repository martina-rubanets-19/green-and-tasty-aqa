import { test, expect } from '../../src/fixtures';
import { phoneOfLength, textOfLength, validContactMessage, ContactMessage } from '../../src/data/factories';

/**
 * Level 1 — "Registration" analogue.
 * The site has no customer sign-up, so the closest form with field validation is the
 * "Send Us a Message" contact form. Rules (from the site's API contract):
 *   name     — required (not blank)
 *   email    — required, well-formed address
 *   phone    — required, 11..21 characters
 *   subject  — required, 5..100 characters
 *   message  — required, 20..2000 characters
 * Every rule is checked on its own, boundaries included, through the UI.
 */

const TAGS = ['@level1', '@ui', '@contact'];

test.describe('Contact form (registration analogue)', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('a guest sends a valid message and sees a personal confirmation', { tag: [...TAGS, '@smoke'] }, async ({ homePage, messageCleanup }) => {
    const message = validContactMessage();
    messageCleanup.track(message.name);

    await homePage.contact.submit(message);

    await expect(homePage.contact.thankYouHeading).toHaveText(`Thanks for getting in touch ${message.name}!`);
    await expect(homePage.contact.section).toContainText(message.subject);
    await expect(homePage.contact.errors).toHaveCount(0);
  });

  type Case = {
    title: string;
    override: (tagged: ContactMessage) => Partial<ContactMessage>;
    valid: boolean;
    error?: string;
  };

  const cases: Case[] = [
    // --- name ---
    { title: 'name is blank', override: () => ({ name: '' }), valid: false, error: 'Name may not be blank' },
    { title: 'name is only spaces', override: () => ({ name: '   ' }), valid: false, error: 'Name may not be blank' },

    // --- email ---
    { title: 'email is blank', override: () => ({ email: '' }), valid: false, error: 'Email may not be blank' },
    { title: 'email has no @', override: () => ({ email: 'guest.example.com' }), valid: false, error: 'must be a well-formed email address' },
    { title: 'email has no local part', override: () => ({ email: '@example.com' }), valid: false, error: 'must be a well-formed email address' },

    // --- phone: 11..21 ---
    { title: 'phone has 10 characters (min - 1)', override: () => ({ phone: phoneOfLength(10) }), valid: false, error: 'Phone must be between 11 and 21 characters.' },
    { title: 'phone has 11 characters (min)', override: () => ({ phone: phoneOfLength(11) }), valid: true },
    { title: 'phone has 21 characters (max)', override: () => ({ phone: phoneOfLength(21) }), valid: true },
    { title: 'phone has 22 characters (max + 1)', override: () => ({ phone: phoneOfLength(22) }), valid: false, error: 'Phone must be between 11 and 21 characters.' },
    { title: 'phone is blank', override: () => ({ phone: '' }), valid: false, error: 'Phone may not be blank' },

    // --- subject: 5..100 ---
    { title: 'subject has 4 characters (min - 1)', override: () => ({ subject: textOfLength(4, 'Q') }), valid: false, error: 'Subject must be between 5 and 100 characters.' },
    { title: 'subject has 5 characters (min)', override: () => ({ subject: textOfLength(5, 'Q') }), valid: true },
    { title: 'subject has 100 characters (max)', override: () => ({ subject: textOfLength(100, 'Question') }), valid: true },
    { title: 'subject has 101 characters (max + 1)', override: () => ({ subject: textOfLength(101, 'Question') }), valid: false, error: 'Subject must be between 5 and 100 characters.' },

    // --- message: 20..2000 ---
    { title: 'message has 19 characters (min - 1)', override: () => ({ description: textOfLength(19, 'Hi') }), valid: false, error: 'Message must be between 20 and 2000 characters.' },
    { title: 'message has 20 characters (min)', override: () => ({ description: textOfLength(20, 'Hi') }), valid: true },
    { title: 'message has 2000 characters (max)', override: () => ({ description: textOfLength(2000, 'Hello') }), valid: true },
    { title: 'message has 2001 characters (max + 1)', override: () => ({ description: textOfLength(2001, 'Hello') }), valid: false, error: 'Message must be between 20 and 2000 characters.' },
  ];

  for (const c of cases) {
    const outcome = c.valid ? 'is accepted' : 'is rejected with an explanation';
    test(`${c.title} — ${outcome}`, { tag: [...TAGS, c.valid ? '@boundary-valid' : '@negative'] }, async ({ homePage, messageCleanup }) => {
      const base = validContactMessage();
      const message = { ...base, ...c.override(base) };
      messageCleanup.track(base.name);

      await homePage.contact.submit(message);

      if (c.valid) {
        await expect(homePage.contact.thankYouHeading).toBeVisible();
        await expect(homePage.contact.errors).toHaveCount(0);
      } else {
        await expect(homePage.contact.errors).toBeVisible();
        await expect(homePage.contact.errors).toContainText(c.error!);
        await expect(homePage.contact.thankYouHeading).toHaveCount(0);
      }
    });
  }

  test('all fields empty — every required field is reported and nothing is sent', { tag: [...TAGS, '@negative'] }, async ({ homePage }) => {
    await homePage.contact.submitButton.click();

    await expect(homePage.contact.errors).toBeVisible();
    for (const text of ['Name may not be blank', 'Email may not be blank', 'Phone may not be blank', 'Subject may not be blank', 'Message may not be blank']) {
      await expect(homePage.contact.errors).toContainText(text);
    }
    await expect(homePage.contact.thankYouHeading).toHaveCount(0);
  });
});
