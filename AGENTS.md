# AGENTS.md

Guidelines for working in this Node.js (ES modules) and Express API repository.

## Architecture & Entry Points
- **Store**: Use an in-memory store exported from `createStore()` in `src/store.js`.
- **App**: Export `createApp({ store, now })` from `src/app.js`.
- **Server**: Start the HTTP server in `src/server.js`.

## Validation & Business Rules
- Validate all request inputs before processing.
- Check daily capacity before deducting credits.

## Error Handling
- Return clear JSON error responses with appropriate HTTP status codes (e.g., `400`, `404`, `409`, `410`).

## Verification
- Run `npm test` after making code changes.
