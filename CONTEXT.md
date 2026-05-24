# MyHours – Domain Glossary

## MyHours (product)

A tool for teams with varied working hours. Team members publish their Schedule at a public Profile URL so colleagues can check when someone is available without having to ask. Applicable to any team — not limited to remote or freelance contexts.

## User

A registered account identified by a unique UUID. Created via email + password registration. Has a unique `username` chosen at sign-up that appears in their public Profile URL.

## Profile

The public page at `/profile/:username` that displays a User's working hours. Readable by anyone without authentication.

## Schedule

A User's standard weekly working pattern. Stored as up to 7 rows (one per day-of-week, 0 = Sunday through 6 = Saturday), each specifying `startTime`, `endTime`, and whether the day `isWorking`.

## Schedule Exception

A specific calendar date that overrides the User's standard Schedule. Stores a date (YYYY-MM-DD), optional start/end times, and an `isWorking` flag. Used for holidays, irregular hours, etc.

## Settings

The private page at `/settings` where an authenticated User manages their Profile and Schedule. Requires authentication; unauthenticated visitors are redirected to `/login`.
