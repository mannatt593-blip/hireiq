# Authentication and session checks

Login stores the JWT in `localStorage.hireiq_token` and the user profile in
`localStorage.hireiq_user`. All protected requests use `src/services/api.js`.
Set `VITE_API_URL` to the backend API base URL when needed; it defaults to
`http://localhost:5000/api`.

The browser checks the token shape, expiration, and activation time, then calls
`GET /auth/me` before rendering the protected application. Local decoding does
not establish authenticity: the server verifies the HS256 signature using
`JWT_SECRET`, requires a finite expiration and a UUID user ID, and `/auth/me`
checks that the user still exists.

A protected request returning 401 clears credentials and returns the user to
`/login`. The same happens when the token expires or another tab logs out.
A delayed 401 from an older token cannot clear a newer login. Login failures
remain on the form, and network errors, 403s, and server errors do not erase
the session. If the initial session check cannot complete, protected content
stays hidden and the user can retry or sign out.

Login and logout remove the legacy `hireiqToken` and `token` keys, as well as
session-storage copies of the token and profile. Legacy-only sessions require
signing in again. Existing canonical, valid sessions are verified by the server.
Other stored settings are preserved.

## Verification

Use Node.js 22. Install both packages and run:

```sh
npm ci
npm ci --prefix server
npm test
npm run lint
npm run build
```

`npm run test:client` runs the browser-component and request-helper tests.
`npm test --prefix server` runs the Express/JWT tests against a temporary local
HTTP server. Database queries are stubbed at the PostgreSQL boundary, so no
database or production credentials are needed. These tests do not replace a
deployment smoke test against the configured database.

Existing unrelated lint warnings are reported without failing the lint command.
