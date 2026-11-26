# FlexxD Booking API

In-memory Node.js (ES modules) and Express API for venue bookings and redemption codes.

## Setup & Commands

```bash
npm install
npm start   # Starts the server on port 3000 (or process.env.PORT)
npm test    # Runs the test suite via node --test
```

## Seeded Data

- **Users**:
  - `user-1`: `John` (`visitCredits: 3`)
  - `user-2`: `Sam` (`visitCredits: 0`)
- **Venues**:
  - `venue-1`: `ABC Gym` (`pricePerVisit: 25`, `dailyCapacity: 2`)
  - `venue-2`: `XYZ Studio` (`pricePerVisit: 45`, `dailyCapacity: 10`)

## Endpoints

### 1. Create Booking
`POST /bookings`

```json
{
  "userId": "user-1",
  "venueId": "venue-1"
}
```

### 2. Redeem Booking
`POST /booking/redeem`

```json
{
  "redemptionCode": "A1B2C3D4"
}
```

### 3. Get User & Bookings
`GET /users/:id` (no request body; e.g. `GET /users/user-1`)
