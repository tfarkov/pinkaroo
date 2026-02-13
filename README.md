# Pinkaroo Real Estate Portal

## Features

### Public / Guest
- **Home** – Hero with tagline “find a house. make it a home”, Find a Home CTA, nearby listings map (Google Maps), browse listings with infinite scroll, recently viewed section (from localStorage) with listing images and links.
- **Find a Home (Listings)** – Public listing search with map, filters (province, price, bedrooms, bathrooms, property type), paginated/infinite list, listing cards with image, price, beds/baths, size (m² or sq ft), link to detail.
- **Listing detail** – Full listing view: gallery, price, location, description, details (beds, baths, size, type, postal code), agent profile card, mortgage calculator, map, favourite button.
- **Favourites** – Saved listings (per user when signed in; mock/IndexedDB fallback), grid of favourite cards with image and link to listing.
- **MLS Search** – Canadian MLS search by province, city, postal code, status, price/size/beds/baths, property type; results grid with image and “Import to My Listings”; mock results when API unavailable.
- **Profile** – User name, role, and recently viewed listings (from localStorage).
- **Unit toggle** – Header toggle for area units: **sq ft** (default) or **m²**; applies to listing cards, listing detail, listing form, and MLS search labels; preference stored in localStorage.

### Authentication
- **Sign in / Sign out** – NextAuth session; Sign In and Sign Out in header and mobile menu.
- **Credentials** – Email/password login with bcrypt; optional registration API.
- **OAuth** (when env configured) – Google, GitHub, Facebook, Apple.
- **Roles** – USER, REALTOR, BROKER, ADMIN; nav and features vary by role.

### Realtor
- **Dashboard** – Client list, client status distribution chart, interactions chart (when REALTOR).
- **Add Listing** – Form: title, description, price, location, province, postal code, size (m² or sq ft), beds, baths, property type, photos (Cloudinary upload), map with geocode; creates listing (PENDING for REALTOR).
- **CRM** – Clients and interactions; add client (name, email, phone, notes), add interaction (type, details); client status pipeline.

### Broker
- **Broker dashboard** – Team stats: listings per realtor (bar chart), approval status (approved/pending/rejected pie chart), revenue over time (line chart).
- **Pending listings** – List of realtor submissions awaiting approval.
- **Approve / Reject** – Approve or reject pending listings (with optional rejection reason); real-time-style updates.

### Admin
- **Admin dashboard** – Assign realtors to brokers (dropdown form); list of realtors and brokers.
- **Realtor / Broker management** – View and manage realtor–broker assignments.

### Infrastructure & UX
- **Layout** – Fixed header (logo, nav, unit toggle, notifications, sign in/out), footer, bottom nav on mobile (Home, Listings, Dashboard, Favourites, Profile).
- **Notifications** – Notifications dropdown in header (e.g. listing status, system).
- **Responsive** – Content width and mobile-first layout; bottom nav only on small screens.
- **Images** – Safe listing images with fallback on error; hero image with gradient fallback; logo with transparent background and SVG fallback.
- **API** – Listings (CRUD, public, nearby), favorites, notifications, clients & interactions, users, MLS search, admin (realtors, brokers, assign-broker), broker (stats, pending, approve).
- **Mock data** – Listings, favorites, clients, interactions, MLS results, realtors, brokers, broker stats when API/DB unavailable.

---

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
