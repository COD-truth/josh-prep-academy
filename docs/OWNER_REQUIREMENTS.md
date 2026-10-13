# Josh & Co — owner-requested family experience

Implemented on `feat/tutoring-marketplace` (PR #1):

1. Parent, student and teacher registration; parent home with account-owned bookings and service shortcuts. Teacher registration records name, subjects, school levels, experience, phone and residence. After email activation, a private application adds qualifications, biography, public city, rate and optional photo.
2. Transparent logo, with the original asset preserved. ImageGen removed the background; the selected image is encoded as WebP for web delivery.
3. Homepage presentation of the teaching collective: teachers, teacher-training students, engineers and engineering students, based on the owner's supplied description.
4. Midnight blue, white and orange design tokens; responsive navigation and reduced-motion support.
5. Custom Josh & Co brand illustration replaces the founder portrait on the homepage. It depicts educational objects, not real staff. Replace `src/assets/joshco-hero.webp` when the owner supplies an approved team photo.
6. General exam success rate: 98.67%, displayed as 98,67 % in French and attributed to Josh & Co. Previous per-exam figures are no longer presented by the results component.
7. Public tutor cards include photo, subjects, levels, experience, city, rates and biography. `/directory` allows admins to add/edit/publish profiles; `/admin` reviews teacher applications. Approved applications publish the tutor and grant the tutor role in the same database transaction. Unreviewed applications and residence details stay private. Photo uploads are public by design and explicitly labelled in the form.
8. Schools: bundled Leaflet (no runtime CDN dependency), map-ready marker updates, mobile list/map layout, resize handling, safe text tooltips, valid coordinates including zero, optional user-triggered geolocation, distance/radius, city/district/section/type/public-private/study-field filters, Google Maps links and map failure fallback. The current production directory was observed loading 30 schools and map tiles. Existing schools need their study fields populated by the owner; `/directory` supports this.
9. `/guide` provides a guided family service picker without an external AI API. `/concours` provides orientation steps and published notices with official source URLs, verification dates, required levels and optional deadlines. Admins publish notices in `/directory`. No current concours deadlines are invented or seeded.

## Required rollout order

1. Back up the Supabase database and apply `supabase/migrations/20261013050000_family_teacher_school_concours.sql` to a staging project first. This adds the application table/policies, tutor city, profile account type, photo bucket, school study fields and concours table. Existing school data is preserved. The SQL has been parsed locally but has not been executed against the connected database.
2. Confirm server environment configuration: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the existing server-only `SUPABASE_SERVICE_ROLE_KEY`. Never put service credentials in VITE variables. Existing admin review functions use the server client. The migration restores the read-only `has_role` helper to SECURITY DEFINER to prevent recursive user_roles RLS checks. Verify actual admin and non-admin behavior in staging.
3. Allow email confirmation redirects for `/parent`, `/become-tutor`, `/dashboard` and `/book` on the selected deployment origin in Supabase Auth settings.
4. Deploy the branch to a preview and verify parent/student/teacher signups with email confirmation, interrupted/reloaded application forms, image upload, pending application privacy, admin approval/rejection, published tutor creation, actual availability and bookings, and non-admin rejection for directory writes.
5. Verify school markers after load/filter changes, location denial, mobile layout and external tile failures; validate the institution coordinates and fill in confirmed study fields. Add real tutor photos and official concours notices through the admin screens.
6. Apply the migration to production, then merge/deploy the PR. Do not deploy the frontend before its migration: queries now require `tutors.city`, `schools.study_fields`, applications and concours tables.

Local verification: production build, TypeScript, targeted ESLint, search/registration/coordinate tests and public-page SSR smoke checks. No production account, payment, database schema or school record was changed by this work. The remote browser cannot reach the local preview, so final responsive visual QA is still required on the deployment preview.
