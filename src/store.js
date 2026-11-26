/**
 * Creates a fresh in-memory store for users, venues, and bookings.
 * Returns new objects and arrays on every call so state is isolated across instances and tests.
 */
export function createStore() {
  return {
    users: {
      'user-1': {
        id: 'user-1',
        name: 'John',
        visitCredits: 3,
      },
      'user-2': {
        id: 'user-2',
        name: 'Sam',
        visitCredits: 0,
      },
    },
    venues: {
      'venue-1': {
        id: 'venue-1',
        name: 'ABC Gym',
        pricePerVisit: 25,
        dailyCapacity: 2,
      },
      'venue-2': {
        id: 'venue-2',
        name: 'XYZ Studio',
        pricePerVisit: 45,
        dailyCapacity: 10,
      },
    },
    bookings: [],
  };
}
