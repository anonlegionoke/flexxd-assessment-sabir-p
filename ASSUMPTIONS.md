1. POST /bookings cost 1 credit per visit. pricePerVisit is stored for reports and partner payouts. Credits are already paid in advance by the user.
2. I assume a venue can not accept any new bookings if the number bookings for the current UTC day reach dailyCapacity.
3. No authentication for the endpoints. I assume, any caller can pass userId, venueId or redemption code for this prototype.
4. In memory store. Resets data on server restart. Because nodejs is single threaded, synchronus capacity and redeem checks run without race conditions.
5. No cancellations or refund is possible in the prototype for now.
