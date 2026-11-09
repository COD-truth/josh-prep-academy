# Learning platform delivery — 17 October 2026

The owner's assessment identifies useful trust and learning gaps. Cameroon focus and bilingual support remain deliberate strengths. Native applications, international expansion, AI tutoring and an embedded video provider are later projects, not features claimed by this delivery.

## Added

- Public tutor detail pages: declared qualifications, experience, subjects, languages, location, hourly price and real completed-lesson reviews. No fabricated reviews or certification claims.
- Schools: bounded requests, separate loading/error/empty states and a retry action. School results still require genuine records and matching filters.
- Pricing: live tutor rates and active resource subscriptions, with manual Mobile Money verification explained.
- Private `/learning` list and `/lessons/:bookingId`: teacher reports, homework, tutor-assessed progress, a shared whiteboard and discussion. Only the booking account, assigned tutor and administrator can access records. Board history loads the latest 300 events; this is an initial lesson workspace, not an unlimited archive.
- One teacher-authored quiz per lesson, graded in PostgreSQL; one attempt per booking account. Answers are hidden before submission. Children using the parent's account share that account's attempt.
- One public review per completed booking, after a tutor report, with an optional initial/name supplied by the booking account. “Verified” means linked to a completed booking; it is not an independent identity or diploma audit.
- Private approved-provider meeting links supplied by tutors. Video runs on Google Meet, Zoom, Teams or Jitsi; this is not built-in video infrastructure.
- Installable web app and `/mobile` instructions. Offline mode is a static fallback; account pages and learning data are never cached by the service worker. Browser installation varies. No native iOS/Android app is claimed.
- Atomic slot reservation and payment receipt capture, authoritative price calculation, and admin approval of course payments. This records a manual receipt, not an automatic Mobile Money gateway.

## Required before production

1. Apply `20261013050000_family_teacher_school_concours.sql` first if still pending, then `20261017080000_learning_workspace.sql` in the intended Supabase project after a backup. This work did **not** apply either migration to the live database.
2. Configure existing Supabase server/client environment variables on the chosen hosting project. Confirm auth redirect URLs for the preview and production domains.
3. Realtime uses `lesson_events` in `supabase_realtime` if that publication exists; otherwise clients refresh every 30 seconds. Confirm Realtime is enabled in Supabase before promising live synchronization.
4. Use separate parent, assigned tutor, unrelated account and admin test accounts in staging. Reserve a future available slot, verify the real receipt, confirm the session, test private links/board/chat and quiz. After a past lesson, save the report and submit exactly one public review. Check unrelated accounts are denied.
5. Populate genuine tutor biographies/photos, school records, tariffs, payment instructions and verified concours sources. The 98.67% success claim supplied by the owner needs its exam period, cohort and evidence before use as an independently verified statistic.
6. Test Android and iOS installation on actual devices; test the network failure screen and auth redirects. Add a privacy/retention policy and an administrative review-removal process before collecting public feedback at scale.
7. Merge PR #1 only after staging checks and migrations, then verify the production build. Netlify preview and the original Vercel project are different deployments.

## Validation

- TypeScript check and production build.
- Existing search/family/school tests.
- PGlite PostgreSQL regression test runs the new migration against a minimal existing-schema fixture with real roles/RLS: prevents forged completion, private-data access, answer-key disclosure, duplicate attempts/reviews, invalid strokes, self-approved payments and overlapping bookings; exercises report completion, quiz grading, receipt capture/idempotency and administrator confirmation.
- Local database tests are not proof that the production migration or hosting configuration has been applied.
