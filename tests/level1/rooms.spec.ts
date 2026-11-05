import { test, expect } from '../../src/fixtures';
import { isoDateFromToday, ukDate } from '../../src/data/factories';

/**
 * Level 1 — "Menu" analogue: the list of rooms.
 *   dishes          -> rooms (cards on the front page)
 *   open a dish     -> open a room's details page
 *   filter / search -> "Check Availability" by check-in / check-out dates
 *   missing dish    -> a room id that does not exist
 * The site has no categories, sorting or text search, so those menu rules have no
 * counterpart here (see README).
 */

const TAGS = ['@level1', '@ui', '@rooms'];

test.describe('Rooms (menu analogue)', () => {
  test('the front page lists rooms, each with a type, a nightly price and a booking link', { tag: [...TAGS, '@smoke'] }, async ({ homePage, api }) => {
    const apiRooms = await api.listRooms();
    test.skip(apiRooms.length === 0, 'the site currently has no rooms');

    await homePage.open();
    await homePage.waitForRooms();

    const shown = await homePage.roomCount();
    // The front page shows at most three rooms.
    expect(shown).toBe(Math.min(apiRooms.length, 3));

    for (let i = 0; i < shown; i++) {
      const card = homePage.roomCard(i);
      await expect(card.title).not.toBeEmpty();
      await expect(card.price).toHaveText(/^£\d+(\.\d+)?\s*per night$/);
      await expect(card.bookNowLink).toHaveAttribute('href', /^\/reservation\/\d+/);
    }

    // What the user sees matches the data behind it.
    const shownTypes = await Promise.all([...Array(shown).keys()].map((i) => homePage.roomCard(i).roomType()));
    const apiTypes = apiRooms.slice(0, shown).map((r) => r.type);
    expect(shownTypes).toEqual(apiTypes);
  });

  test('opening a room shows that room’s details', { tag: [...TAGS, '@smoke'] }, async ({ page, homePage, roomPage }) => {
    await homePage.open();
    await homePage.waitForRooms();
    const card = homePage.roomCard(0);
    const roomType = await card.roomType();
    const href = await card.bookNowHref();
    const roomId = href.match(/\/reservation\/(\d+)/)?.[1];

    await card.bookNowLink.click();

    await expect(page).toHaveURL(new RegExp(`/reservation/${roomId}`));
    await roomPage.expectRoomShown(roomType);
  });

  test('every room on the front page opens its own details page', { tag: TAGS }, async ({ homePage, roomPage }) => {
    await homePage.open();
    await homePage.waitForRooms();
    const count = await homePage.roomCount();
    const rooms: { type: string; id: string }[] = [];
    for (let i = 0; i < count; i++) {
      const card = homePage.roomCard(i);
      rooms.push({ type: await card.roomType(), id: (await card.bookNowHref()).match(/\/reservation\/(\d+)/)![1] });
    }

    for (const room of rooms) {
      await roomPage.open(room.id);
      await roomPage.expectRoomShown(room.type);
    }
  });

  test('a room that does not exist shows no room details', { tag: [...TAGS, '@negative'] }, async ({ roomPage, api }) => {
    const missingId = 987654;
    const response = await api.getRoomResponse(missingId);
    expect(response.ok(), 'the API reports the room as missing').toBeFalsy();

    await roomPage.open(missingId);

    await roomPage.expectNoRoomShown();
  });

  test('a non-numeric room id shows no room details', { tag: [...TAGS, '@negative'] }, async ({ roomPage }) => {
    await roomPage.open('not-a-room');

    await roomPage.expectNoRoomShown();
  });

  test('searching by dates shows only rooms available for those dates and carries the dates to booking', { tag: [...TAGS, '@filter'] }, async ({ homePage, api }) => {
    // Far enough in the future to be stable, relative to "now" so it never goes stale.
    const checkIn = isoDateFromToday(120);
    const checkOut = isoDateFromToday(122);
    const available = await api.listRooms(checkIn, checkOut);

    await homePage.open();
    await homePage.searchAvailability(ukDate(checkIn), ukDate(checkOut));

    await expect(homePage.roomCards).toHaveCount(Math.min(available.length, 3));
    const count = await homePage.roomCount();
    const availableIds = available.map((r) => String(r.roomid));
    for (let i = 0; i < count; i++) {
      const href = await homePage.roomCard(i).bookNowHref();
      expect(href).toContain(`checkin=${checkIn}`);
      expect(href).toContain(`checkout=${checkOut}`);
      const id = href.match(/\/reservation\/(\d+)/)![1];
      expect(availableIds, `room ${id} is available for the chosen dates`).toContain(id);
    }
  });
});

test.describe('Rooms — API', () => {
  test('the room list is not empty and every room has a type and a positive price', { tag: ['@level1', '@api', '@rooms'] }, async ({ api }) => {
    const rooms = await api.listRooms();
    expect(rooms.length).toBeGreaterThan(0);
    for (const room of rooms) {
      expect(room.type).toBeTruthy();
      expect(room.roomPrice).toBeGreaterThan(0);
    }
  });

  test('a missing room is reported as an error, not as a room', { tag: ['@level1', '@api', '@rooms', '@negative'] }, async ({ api }) => {
    const response = await api.getRoomResponse(987654);
    // The room service answers 404 with an empty body; the site's proxy then fails to parse
    // it and answers 500 (documented in README as an observed defect). Either way it must
    // not be a success.
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
