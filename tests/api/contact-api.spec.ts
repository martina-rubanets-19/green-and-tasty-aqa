import { test, expect } from '../../src/fixtures';
import { phoneOfLength, textOfLength, validContactMessage } from '../../src/data/factories';

/**
 * Level 1 — the same contact-form rules checked at the API level: fast feedback on the
 * validation contract, independent of the UI.
 */

const TAGS = ['@level1', '@api', '@contact'];

test.describe('Contact form — API validation', () => {
  test('a valid message is accepted', { tag: TAGS }, async ({ api, messageCleanup }) => {
    const message = validContactMessage();
    messageCleanup.track(message.name);

    const response = await api.sendMessage(message);

    expect(response.status()).toBe(200);
  });

  const invalid = [
    { field: 'phone', value: phoneOfLength(10), error: 'Phone must be between 11 and 21 characters.' },
    { field: 'phone', value: phoneOfLength(22), error: 'Phone must be between 11 and 21 characters.' },
    { field: 'subject', value: textOfLength(4, 'Q'), error: 'Subject must be between 5 and 100 characters.' },
    { field: 'subject', value: textOfLength(101, 'Q'), error: 'Subject must be between 5 and 100 characters.' },
    { field: 'description', value: textOfLength(19, 'Hi'), error: 'Message must be between 20 and 2000 characters.' },
    { field: 'description', value: textOfLength(2001, 'Hi'), error: 'Message must be between 20 and 2000 characters.' },
    { field: 'email', value: 'not-an-email', error: 'must be a well-formed email address' },
    { field: 'name', value: '', error: 'Name may not be blank' },
  ] as const;

  for (const c of invalid) {
    test(`${c.field} of ${c.value.length} chars ("${c.value.slice(0, 12)}…") is rejected with 400`, { tag: [...TAGS, '@negative'] }, async ({ api }) => {
      const response = await api.sendMessage({ ...validContactMessage(), [c.field]: c.value });

      expect(response.status()).toBe(400);
      expect(JSON.stringify(await response.json())).toContain(c.error);
    });
  }
});
