# Pinkaroo Real Estate Portal

## Run locally for UI testing (no external integrations)

To test the UI without Redis, Google Maps, MLS, or other external services:

1. **Start the dev server (Next.js only, no custom server/Redis):**
   ```bash
   npm run dev:ui
   ```
   Open **http://localhost:3000**.

2. **What works without any config:**
   - All pages and navigation (layout, styling, routing).
   - Home: hero, “recently viewed” (from `localStorage`), map shows a placeholder if no Google key.
   - Listings, Favorites, Profile, MLS Search, Dashboard, Admin: layout and forms render; list/detail pages may show loading or empty data if the database is not set up.

3. **Optional env (no external sign-up required):**
   - **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** – If unset, maps show a placeholder message instead of loading Google Maps.
   - **`DATABASE_URL`** – If unset, API routes that use the DB (listings, favorites, auth, etc.) will fail when you click through; you’ll still see the UI. To get real data, use a local MySQL (or Docker) and run `npx prisma migrate dev` and `npx prisma db seed`.

4. **Not needed for UI-only testing:**
   - `REDIS_URL` (only used by `npm run dev` with the custom server).
   - CREA/MLS keys, Cloudinary, Sentry, etc.

**Summary:** Run `npm run dev:ui` and open http://localhost:3000. No `.env` is required to browse the UI; add `DATABASE_URL` (and optionally the Maps key) when you want live data.
