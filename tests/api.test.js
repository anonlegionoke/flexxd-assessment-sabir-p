import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { createApp } from '../src/app.js';

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

describe('Booking API', () => {
  it('POST /bookings succeeds with 201 and deducts 1 credit', async () => {
    const store = createStore();
    const currentTime = new Date('2026-11-26T10:00:00.000Z');
    const app = createApp({ store, now: () => currentTime });

    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1', venueId: 'venue-1' }),
      });

      assert.equal(response.status, 201);
      const booking = await response.json();
      assert.equal(booking.userId, 'user-1');
      assert.equal(booking.venueId, 'venue-1');
      assert.equal(booking.venueName, 'ABC Gym');
      assert.equal(booking.pricePerVisit, 25);
      assert.equal(booking.status, 'active');
      assert.match(booking.redemptionCode, /^[0-9A-F]{8}$/);
      assert.equal(booking.createdAt, '2026-11-26T10:00:00.000Z');
      assert.equal(booking.expiresAt, '2026-11-26T10:10:00.000Z');
      assert.equal(booking.redeemedAt, null);
      assert.equal(store.users['user-1'].visitCredits, 2);
    });
  });

  it('POST /booking/redeem rejects a code after 11 minutes with 410 and GET /users/:id shows status expired', async () => {
    const store = createStore();
    let currentTime = new Date('2026-11-26T10:00:00.000Z');
    const app = createApp({ store, now: () => currentTime });

    await withServer(app, async (baseUrl) => {
      const createRes = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1', venueId: 'venue-1' }),
      });
      assert.equal(createRes.status, 201);
      const booking = await createRes.json();

      currentTime = new Date(currentTime.getTime() + 11 * 60 * 1000);

      const redeemRes = await fetch(`${baseUrl}/booking/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionCode: booking.redemptionCode }),
      });
      assert.equal(redeemRes.status, 410);
      const redeemBody = await redeemRes.json();
      assert.match(redeemBody.error, /expired/i);

      const userRes = await fetch(`${baseUrl}/users/user-1`);
      assert.equal(userRes.status, 200);
      const userBody = await userRes.json();
      assert.equal(userBody.bookings.length, 1);
      assert.equal(userBody.bookings[0].id, booking.id);
      assert.equal(userBody.bookings[0].status, 'expired');
    });
  });
});
