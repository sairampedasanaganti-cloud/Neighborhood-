# Backend Tests

Run with: `npm test` (from /server)

- `priorityEngine.test.js` — verifies priority scoring behaves as documented.
- `matchingEngine.test.js` — verifies volunteer ranking behaves as documented.
- `requestAccept.test.js` — integration test proving only one volunteer can
  claim a request even under a simulated race condition (uses
  `mongodb-memory-server`, no real Atlas connection needed).

## Manual Testing Checklist (full user journey)

1. Register a new account -> verify email link works.
2. Log in -> confirm redirected to Dashboard, verification badge shows "Pending".
3. Log in as admin -> approve the new user from Admin Dashboard.
4. As the approved user, create a "Medicine Pickup" request marked HIGH urgency.
5. Confirm the computed priority badge shows HIGH and matches priorityExplanation.
6. Log in as a matching volunteer -> confirm request appears in Recommended.
7. Accept the request -> confirm requester receives a notification.
8. Open the same request in a second volunteer session -> confirm "already accepted" error.
9. As volunteer, update status Accepted -> On the Way -> confirm requester sees updated timeline.
10. Start location sharing -> confirm requester can view volunteer's live position.
11. Mark status Completed -> confirm location sharing auto-stops.
12. Both requester and volunteer submit ratings -> confirm duplicate review attempt is rejected.
13. Attempt to update a request you're not assigned to -> confirm 403 error.
14. Deny browser location permission -> confirm app still functions without crashing.
15. Stop MongoDB/unset MONGODB_URI -> confirm server logs a clear error instead of crashing silently.
