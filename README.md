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

---

## Run as anonymous vs signed-in user

### 1. Start the app

```bash
npm run dev:ui
```

Open **http://localhost:3000** in your browser.

### 2. Use the app as **anonymous** (not signed in)

- Do **not** click “Sign In”. Use the app as a guest.
- You can: browse the home page, use filters, open listing details, use the map, see “Contact a Realtor”, view MLS Search, Profile (limited), etc.
- You will **not** see: the **Favourites** sidebar on the home page, **heart (favourite) buttons** on listing thumbnails, Dashboard, Add Listing, Admin, or Broker areas. Favourites and those features are only available when signed in.

### 3. Use the app as a **signed-in user**

1. **Database and seed (required for real sign-in)**  
   Ensure the app can talk to the database and the seed has been run:
   - Set **`DATABASE_URL`** in `.env` (e.g. local MySQL or Docker).
   - Run migrations and seed:
     ```bash
     npx prisma migrate dev
     npx prisma db seed
     ```
   - Restart the dev server if it was already running.

2. **Sign in**  
   - Click **Sign In** in the header (or go to **http://localhost:3000/signin**).
   - Use one of the seeded accounts:

   | Role    | Email               | Password  |
   |---------|---------------------|-----------|
   | Admin   | `admin@example.com` | `password` |
   | Broker  | `broker@example.com` | `password` |
   | Realtor | `realtor@example.com` | `password` |

3. **After sign-in**  
   - **Favourites** sidebar appears on the home page; you can add/remove favourites with the heart on listing cards.
   - Header shows **Sign out** and role-specific links (Dashboard, Add Listing, Broker, Admin depending on role).
   - Profile, Favourites page, and role-specific dashboards use your session.

### 4. Emulate signed-in session (local testing, no DB required)

To test the **signed-in UI** (favourites, nav, role-specific links) without setting up the database:

1. Start the app: `npm run dev:ui` and open **http://localhost:3000/signin**.
2. On the sign-in page, in development you’ll see a **“Local testing: emulate signed-in session”** box.
3. Click **“Fill emulate credentials”**, then click **“Sign in with email”**. You are signed in as a fake user (no database used).
4. **Role:** By default the emulated user has role **REALTOR**. To use **ADMIN** or **BROKER**, set in `.env` and restart the dev server:
   - `EMULATE_SESSION_ROLE=ADMIN` or `EMULATE_SESSION_ROLE=BROKER`
   - Optional: `EMULATE_SESSION_EMAIL=emulate@local`, `EMULATE_SESSION_PASSWORD=emulate` (these are the defaults).

**Note:** Emulate only works when `NODE_ENV=development`. API calls that need the database (e.g. saving favourites, creating listings) will fail without a database; use the real seed accounts and a real DB for full API testing.

### 5. Quick comparison

| Feature              | Anonymous | Signed in   |
|----------------------|-----------|------------|
| Browse home & listings | Yes       | Yes        |
| Filters, map, Contact a Realtor | Yes | Yes        |
| Favourites sidebar   | No        | Yes        |
| Heart (favourite) on cards | No   | Yes        |
| Dashboard / Add Listing / Admin / Broker | No | Yes (by role) |
| Profile (with role)  | Limited   | Full       |
