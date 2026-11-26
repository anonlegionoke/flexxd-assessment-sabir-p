import crypto from 'node:crypto';
import express from 'express';
import { createStore } from './store.js';

const REDEMPTION_TTL_MS = 10 * 60 * 1000;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getUtcDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function generateRedemptionCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function isExpired(booking, currentDate) {
  return booking.status !== 'redeemed' && currentDate.getTime() > Date.parse(booking.expiresAt);
}

/**
 * Creates and configures the Express application.
 *
 * @param {object} [options]
 * @param {ReturnType<typeof createStore>} [options.store] - In-memory data store.
 * @param {() => Date} [options.now] - Clock function returning the current Date.
 * @returns {import('express').Express}
 */
export function createApp({ store = createStore(), now = () => new Date() } = {}) {
  const app = express();

  app.use(express.json());

  app.post('/bookings', (req, res) => {
    const { userId, venueId } = req.body ?? {};

    if (!isNonEmptyString(userId) || !isNonEmptyString(venueId)) {
      return res.status(400).json({ error: 'userId and venueId must be non-empty strings' });
    }

    const user = store.users[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const venue = store.venues[venueId];
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const currentDate = now();
    const todayUtc = getUtcDateKey(currentDate);
    const todaysVenueBookings = store.bookings.filter(
      (booking) =>
        booking.venueId === venue.id &&
        booking.createdAt.slice(0, 10) === todayUtc &&
        !isExpired(booking, currentDate),
    ).length;

    if (todaysVenueBookings >= venue.dailyCapacity) {
      return res.status(409).json({ error: 'Venue daily capacity reached' });
    }

    if (user.visitCredits < 1) {
      return res.status(409).json({ error: 'Insufficient visit credits' });
    }

    user.visitCredits -= 1;

    const booking = {
      id: `booking-${crypto.randomUUID()}`,
      userId: user.id,
      venueId: venue.id,
      venueName: venue.name,
      pricePerVisit: venue.pricePerVisit,
      redemptionCode: generateRedemptionCode(),
      status: 'active',
      createdAt: currentDate.toISOString(),
      expiresAt: new Date(currentDate.getTime() + REDEMPTION_TTL_MS).toISOString(),
      redeemedAt: null,
    };

    store.bookings.push(booking);
    return res.status(201).json(booking);
  });

  app.post('/booking/redeem', (req, res) => {
    const { redemptionCode } = req.body ?? {};

    if (!isNonEmptyString(redemptionCode)) {
      return res.status(400).json({ error: 'redemptionCode must be a non-empty string' });
    }

    const normalizedCode = redemptionCode.trim().toUpperCase();
    const booking = store.bookings.find((item) => item.redemptionCode === normalizedCode);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'redeemed') {
      return res.status(410).json({ error: 'Booking has already been redeemed' });
    }

    const currentDate = now();
    if (isExpired(booking, currentDate)) {
      return res.status(410).json({ error: 'Redemption code has expired' });
    }

    booking.status = 'redeemed';
    booking.redeemedAt = currentDate.toISOString();

    return res.status(200).json(booking);
  });

  app.get('/users/:id', (req, res) => {
    const user = store.users[req.params.id];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentDate = now();
    const bookings = store.bookings
      .filter((booking) => booking.userId === user.id)
      .map((booking) => (isExpired(booking, currentDate) ? { ...booking, status: 'expired' } : booking));

    return res.status(200).json({ ...user, bookings });
  });

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    return next(err);
  });

  return app;
}
