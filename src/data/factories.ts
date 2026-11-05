import { randomUUID } from 'node:crypto';

/** Unique marker for one test's data, so parallel runs never collide and cleanup can find it. */
export const uniqueTag = () => `AQA${randomUUID().replace(/-/g, '').slice(0, 10)}`;

/** A string of exactly `length` characters, starting with `prefix` (handy for boundary values). */
export const textOfLength = (length: number, prefix = ''): string => {
  if (length <= 0) return '';
  const base = (prefix + ' Lorem ipsum dolor sit amet consectetur adipiscing elit ').repeat(
    Math.ceil((length + 1) / (prefix.length + 50)) + 1,
  );
  return base.slice(0, length);
};

/** A phone-like string of exactly `length` characters (digits only). */
export const phoneOfLength = (length: number): string =>
  length <= 0 ? '' : ('0' + '7'.repeat(length)).slice(0, length);

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}

/** A valid contact message; the unique tag goes into the name so cleanup can find it. */
export const validContactMessage = (overrides: Partial<ContactMessage> = {}): ContactMessage => {
  const tag = uniqueTag();
  return {
    name: `Test Guest ${tag}`,
    email: `guest.${tag.toLowerCase()}@example.com`,
    phone: phoneOfLength(12),
    subject: textOfLength(30, `Booking question ${tag}`),
    description: textOfLength(60, 'I would like to ask about a room for two guests.'),
    ...overrides,
  };
};

/** ISO date (YYYY-MM-DD) `days` from today, in UTC. Time-dependent data is always relative. */
export const isoDateFromToday = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** The same date as the site's date picker shows it (en-GB "P" format: dd/MM/yyyy). */
export const ukDate = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
