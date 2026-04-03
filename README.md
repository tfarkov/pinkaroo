# Pinkaroo Real Estate Portal

## Product Documentation

- Feature reference by role: [`docs/FEATURES-BY-ROLE.md`](docs/FEATURES-BY-ROLE.md)

## Features

### Public / Guest
- **Home** – Hero with tagline “find a house. make it a home”, Find a Home CTA, then in the main column (before the sidebar): **nearby listings map** (Google Maps), **Recently viewed** (from localStorage) with listing images and links, **advanced filters** in a card-style block, then **browse listings** with infinite scroll. (Filters apply to the listings API and map pool as before; only the visual order changed.)
- **Find a Home (Listings)** – Public listing search with map, **advanced filters** (province, city, min/max price, bedrooms, bathrooms, property type) that apply to both API and **mock results** when the API is unavailable; infinite scroll with a styled loading spinner; listing cards with image, price, beds/baths, size (m² or sq ft), link to detail.
- **Listing detail** – Full listing view: gallery, price, location, description, details (beds, baths, size, type, postal code), agent profile card, mortgage calculator, map, favourite button.
- **Favourites** – Saved listings (per user when signed in; mock/IndexedDB fallback), grid of favourite cards with image and link to listing; **heart icon turns red** on listing cards when a listing is in favourites.
- **MLS Search** – Canadian MLS search by province, city, postal code, status, price/size/beds/baths, property type; results use the same listing-card style as the home/listings grid; mock results when API unavailable.
- **Why Pinkaroo** – Public value page at `/why-pinkaroo` with role-based positioning (buyers/realtors/brokers), Simcoe-first channel mix, and ad copy examples.
- **Profile** – User name, role, and recently viewed listings (from localStorage). **Profile link is shown only when signed in** (footer, bottom nav, hamburger menu).
- **Unit toggle** – Footer toggle for area units: **sq ft** (default) or **m²**; applies to listing cards, listing detail, listing form, and MLS search labels; preference stored in localStorage.

### Authentication
- **Sign in / Sign out** – NextAuth session; sign-out now redirects to home with a friendly signed-out confirmation message.
- **Dashboard & notifications for guests** – Dashboard links (header, mobile bottom nav, hamburger) appear only when signed in. Visiting any `/dashboard` route while signed out redirects to sign-in. The notifications hook does not fetch data until the session is authenticated, so anonymous users do not trigger dashboard-style notification loading. Dashboard index data queries (my listings, clients, broker stats, etc.) run only when authenticated.
- **Credentials** – Email/password login with bcrypt; optional registration API.
- **OAuth** (when env configured) – Google, GitHub, Facebook, Apple.
- **Roles** – USER, REALTOR, BROKER, OFFICE_ADMIN, SYSTEM_ADMIN; nav and features vary by role.

### Realtor
- **Dashboard** – Client list, client status distribution chart, interactions chart (when REALTOR).
- **Add Listing** – Form: title, description, price, location, province, postal code, size (m² or sq ft), beds, baths, property type, photos (Cloudinary upload), map with geocode; creates listing (PENDING for REALTOR).
- **CRM** – Clients and interactions; add client (name, email, phone, notes), add interaction (type, details); client status pipeline.

### Broker
- **Broker dashboard** – Team stats: listings per realtor (bar chart), approval status (approved/pending/rejected pie chart), revenue over time (line chart), and a **weekly KPI trend** chart (new listings, interactions, approvals resolved).
- **Pending listings** – List of realtor submissions awaiting approval.
- **Approve / Reject** – Approve or reject pending listings (with optional rejection reason); real-time-style updates.

### Admin
- **Admin dashboard** – Assign realtors to brokers (dropdown form); list of realtors and brokers; **weekly KPI trend** chart (new brokers, new realtors, assignment updates).
- **Realtor / Broker management** – View and manage realtor–broker assignments.

### Infrastructure & UX
- **Layout** – Fixed header (logo, nav, notifications, sign in/out, **Why Pinkaroo**), footer (Find a Home, MLS Search, Favourites, Profile when signed in, **Why Pinkaroo**, **Privacy**, unit toggle), bottom nav on mobile (Home, Find a Home, Dashboard, Favourites, Profile when signed in).
- **Privacy** – **Privacy Statement** page at `/privacy` (how we collect, use, and protect your information); link in footer.
- **Notifications** – Notifications dropdown in header (e.g. listing status, system).
- **Responsive** – Content width and mobile-first layout; bottom nav only on small screens.
- **Images** – Safe listing images with fallback on error; hero image with gradient fallback; logo with transparent background and SVG fallback.
- **API** – Listings (CRUD, public, nearby), favorites, notifications, clients & interactions, users, MLS search, admin (realtors, brokers, assign-broker, **weekly-kpis**), broker (stats, pending, approve, **weekly-kpis**).
- **Mock data** – Listings, favorites, clients, interactions, MLS results, realtors, brokers, broker stats when API/DB unavailable; **advanced filters apply to mock listings** (main grid and nearby map) so filtered results stay consistent when using fallback data.
- **Infinite scroll** – Styled “loading more” state with accent-colour spinner and label when fetching the next page of listings.

---

## External sign-up & setup

These features require you to sign up for an external service and add credentials to `.env`. Full step-by-step instructions are in **[docs/SETUP-CREDENTIALS.md](docs/SETUP-CREDENTIALS.md)**; below is a quick overview and setup for the most common ones.

### Services that require external sign-up

| Service | Used for | Required? |
|--------|----------|-----------|
| **Google Cloud** | Maps + Geocoding, Google Sign-In | Maps: for map/geocode; OAuth: for Google login |
| **Facebook for Developers** | Facebook Sign-In | Only if you want Facebook login |
| **GitHub** | GitHub Sign-In | Only if you want GitHub login |
| **Apple Developer** | Apple Sign-In | Only if you want Apple login |
| **Database (MySQL)** | Auth, listings, favorites, etc. | Yes for real data and sign-in |
| **Cloudinary** | Listing image uploads | Yes for Add Listing uploads |
| **CREA/MLS** | Canadian MLS search | Only for MLS search/sync |
| **Redis** | Real-time notifications | Optional |
| **Nodemailer (SMTP)** | MLS error emails | Optional |
| **Google Analytics** | Analytics | Optional |

---

### 1. Google Maps (map + geocoding on listing pages and Add Listing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **Enable APIs:** **APIs & Services** → **Library** → enable **Maps JavaScript API** and **Geocoding API**.
4. **Create an API key:** **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
5. (Recommended) Restrict the key: **HTTP referrers** for your domains (e.g. `http://localhost:3000/*`, `https://your-domain.com/*`), and limit to **Maps JavaScript API** and **Geocoding API**.
6. Add to `.env` (must be `NEXT_PUBLIC_` so the browser can use it):
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
   ```
   Without this key, the app shows a placeholder instead of the map.
7. **Mock listings / seed:** To use real coordinates for the 111 mock addresses, run once with the API key set: `npm run geocode-mock`. This writes `lib/addressCoords.json`; the app and seed use it when present.

---

### 2. Google Sign-In (OAuth)

1. In [Google Cloud Console](https://console.cloud.google.com/) (same project as Maps or a new one), go to **APIs & Services** → **Credentials**.
2. **Configure OAuth consent screen** (if not done): **OAuth consent screen** → User type **External** → add app name, support email, developer contact → Save.
3. **Create OAuth client:** **Credentials** → **Create credentials** → **OAuth client ID** → Application type **Web application**.
4. Under **Authorized redirect URIs** add:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google` (for production).
5. Copy **Client ID** and **Client secret**.
6. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   ```
   Restart the dev server; the "Sign in with Google" button will appear on the sign-in page.

---

### 3. Facebook Sign-In (OAuth)

1. Go to [Facebook for Developers](https://developers.facebook.com/) and sign in.
2. **My Apps** → **Create App** → choose **Consumer** or **Business** → enter app name → Create.
3. In the app dashboard, add the **Facebook Login** product → **Set up** → choose **Web**.
4. **Facebook Login** → **Settings** (left sidebar). Set **Site URL** to `http://localhost:3000` (or your production URL).
5. Under **Valid OAuth Redirect URIs** add:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://your-domain.com/api/auth/callback/facebook` (for production).
6. **Settings** → **Basic**: copy **App ID** and **App Secret** (click **Show** for the secret).
7. Add to `.env`:
   ```env
   FACEBOOK_CLIENT_ID=your_app_id
   FACEBOOK_CLIENT_SECRET=your_app_secret
   ```
   Restart the dev server; the "Sign in with Facebook" button will appear.

---

### 4. Other services (summary)

- **Database:** Create a MySQL database (e.g. local, PlanetScale, Railway, or [Kamatera MySQL](https://kamatera.com/services/mysql/)). Set `DATABASE_URL` in `.env`, then run `npx prisma migrate dev` and `npm run db:seed`. See [Test users (seed)](#test-users-seed) for the login table. **Kamatera:** see **[docs/KAMATERA-MYSQL-SETUP.md](docs/KAMATERA-MYSQL-SETUP.md)** for step-by-step.
- **NextAuth:** Generate a secret (`openssl rand -base64 32`) and set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` (e.g. `http://localhost:3000`). Required for any sign-in.
- **Cloudinary:** Sign up at [cloudinary.com](https://cloudinary.com/), copy Cloud name / API Key / API Secret from the dashboard, set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Needed for Add Listing image uploads.
- **GitHub / Apple / CREA / Redis / Nodemailer / Cron / Analytics:** See **[docs/SETUP-CREDENTIALS.md](docs/SETUP-CREDENTIALS.md)** for step-by-step and all env variable names.

Keep `.env` out of version control (it should be in `.gitignore`). For production, set these variables in your host's environment (e.g. Vercel, Railway).

**Cron jobs (Vercel):** The MLS sync runs on a schedule via Vercel Cron. Set `CRON_SECRET` in the project’s env and deploy; see **[docs/VERCEL-DEPLOYMENT-GUIDE.md](docs/VERCEL-DEPLOYMENT-GUIDE.md)** for steps.

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

3. **Optional env:** To enable maps and real data, see **[External sign-up & setup](#external-sign-up--setup)** above for Google Maps (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) and Database (`DATABASE_URL`). Without them, maps show a placeholder and API routes that need the DB will fail when you click through.

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
- You will **not** see: the **Favourites** sidebar on the home page, **heart (favourite) buttons** on listing thumbnails, **Profile** link (footer/bottom nav), **Dashboard** in the nav, Add Listing, Admin, or Broker areas. Favourites, Profile, and those features are only available when signed in. Typing a dashboard URL directly sends you to sign-in; notifications are not loaded for anonymous sessions.

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
   - Use one of the seeded test accounts (all use password **`password`**):

   | Email | Password | Name | Role |
   |-------|----------|------|------|
   | `admin@example.com` | `password` | Morgan Blake | System Admin |
   | `broker@example.com` | `password` | Jordan Lee | Broker |
   | `broker2@example.com` | `password` | Riley Scott | Broker |
   | `realtor@example.com` | `password` | Sam Chen | Realtor (team lead) |
   | `realtor2@example.com` | `password` | Alex Rivera | Realtor |
   | `realtor3@example.com` | `password` | Morgan Taylor | Realtor |
   | `realtor4@example.com` | `password` | Casey Wong | Realtor |
   | `user@example.com` | `password` | Jamie Smith | Consumer |

   These users are created by the seed script (`npm run db:seed` or `npx prisma db seed`). Re-running the seed updates names and passwords so they stay in sync with `prisma/seed.ts`.

3. **After sign-in**  
   - **Favourites** sidebar appears on the home page; you can add/remove favourites with the heart on listing cards (heart turns **red** when a listing is favourited).
   - **Profile** link appears in the footer and bottom nav.
   - Header shows **Sign out** and role-specific links (Dashboard, Add Listing, Broker, admin links depending on role).
   - Profile, Favourites page, and role-specific dashboards use your session.

### 4. Emulate signed-in session (local testing, no DB required)

To test the **signed-in UI** (favourites, nav, role-specific links) without setting up the database:

1. Start the app: `npm run dev:ui` and open **http://localhost:3000/signin**.
2. On the sign-in page, in development you’ll see a **“Local testing: emulate signed-in session”** box.
3. Click **“Fill emulate credentials”**, then click **“Sign in with email”**. You are signed in as a fake user (no database used).
4. **Role:** By default the emulated user has role **REALTOR**. To use **SYSTEM_ADMIN** or **BROKER**, set in `.env` and restart the dev server:
   - `EMULATE_SESSION_ROLE=SYSTEM_ADMIN` or `EMULATE_SESSION_ROLE=BROKER`
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
| Profile link         | No        | Yes        |
| Profile (with role)   | Limited   | Full       |

_Profile page is still reachable via URL when anonymous; the Profile **link** is hidden until signed in._

---

## Test users (seed)

The seed script creates test users for all roles. After setting **`DATABASE_URL`** and running migrations, run:

```bash
npm run db:seed
```

(or `npx prisma db seed`). Re-running the seed **updates** existing users (names and passwords), so test logins stay in sync with `prisma/seed.ts`.

**Logins** (sign in at **/signin**; password for all is **`password`**):

| Email | Password | Name | Role |
|-------|----------|------|------|
| `admin@example.com` | `password` | Morgan Blake | System Admin |
| `broker@example.com` | `password` | Jordan Lee | Broker |
| `broker2@example.com` | `password` | Riley Scott | Broker |
| `realtor@example.com` | `password` | Sam Chen | Realtor (team lead, under Jordan Lee) |
| `realtor2@example.com` | `password` | Alex Rivera | Realtor (under Jordan Lee) |
| `realtor3@example.com` | `password` | Morgan Taylor | Realtor (under Riley Scott) |
| `realtor4@example.com` | `password` | Casey Wong | Realtor (under Jordan Lee) |
| `user@example.com` | `password` | Jamie Smith | Consumer (USER) |
