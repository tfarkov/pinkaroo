# Pinkaroo Portal – Credentials & Integration Setup

Step-by-step guide to configure each service used by the app. Add the listed environment variables to your `.env` (or hosting provider’s env config).

---

## 1. NextAuth (required for login)

Used for all sign-in: credentials (email/password), Google, GitHub, Facebook, Apple.

### Steps

1. **Generate a secret**
   - Run: `openssl rand -base64 32` (or use [generate-secret.vercel.app](https://generate-secret.vercel.app/)).
   - Use the output as `NEXTAUTH_SECRET`.

2. **Set the app URL**
   - Local: `NEXTAUTH_URL=http://localhost:3000`
   - Production: `NEXTAUTH_URL=https://your-domain.com`

3. **Add to `.env`**
   ```env
   NEXTAUTH_SECRET=your_32_char_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database**
   - Ensure `DATABASE_URL` is set (Prisma/MySQL). Run `npx prisma migrate dev` so User, Account, Session tables exist.

---

## 2. Credentials (email/password sign-up)

No extra config: sign-up uses `POST /api/auth/register` and sign-in uses NextAuth’s credentials provider.  
Only **NEXTAUTH_SECRET** and **NEXTAUTH_URL** (and **DATABASE_URL**) are required.

---

## 3. Google OAuth

### Steps

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Go to **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
4. If asked, configure the **OAuth consent screen** (User type: External, add app name, support email, dev contact).
5. Application type: **Web application**.
6. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client secret**.
8. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   ```

---

## 4. GitHub OAuth

### Steps

1. Open [GitHub](https://github.com/) → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Application name**: e.g. `Pinkaroo Portal`.
3. **Homepage URL**: `https://your-domain.com` (or `http://localhost:3000` for dev).
4. **Authorization callback URL**:
   - `http://localhost:3000/api/auth/callback/github`
   - or production: `https://your-domain.com/api/auth/callback/github`
5. Register; copy **Client ID** and generate **Client secret**.
6. Add to `.env`:
   ```env
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   ```

---

## 5. Facebook Login

### Steps

1. Open [Facebook for Developers](https://developers.facebook.com/) → **My Apps** → **Create App** (Consumer or Business).
2. Add product **Facebook Login** → **Set up** → **Web**.
3. **Site URL**: `http://localhost:3000` or `https://your-domain.com`.
4. Under **Facebook Login** → **Settings**, add **Valid OAuth Redirect URIs**:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://your-domain.com/api/auth/callback/facebook`
5. **App** → **Settings** → **Basic**: copy **App ID** and **App Secret**.
6. Add to `.env`:
   ```env
   FACEBOOK_CLIENT_ID=your_app_id
   FACEBOOK_CLIENT_SECRET=your_app_secret
   ```

---

## 6. Apple Sign In

### Steps

1. Open [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**.
2. **Identifiers** → **+** → **Services IDs** → create (e.g. `com.yourapp.service`). Enable **Sign In with Apple** and configure domains and redirect URL:
   - `https://your-domain.com/api/auth/callback/apple` (and optionally localhost for dev).
3. **Identifiers** → create an **App ID** (or use existing), enable **Sign In with Apple**.
4. **Keys** → create a new key, enable **Sign In with Apple**, link to the App ID. Download the `.p8` key (once only). Note **Key ID**.
5. **Membership** → note **Team ID** and **Services ID** (Client ID).
6. **Generate client secret (JWT)**  
   Apple requires the client secret to be a JWT. Options:
   - Use a generator (e.g. [bal.so/apple-gen-secret](https://bal.so/apple-gen-secret)) with Team ID, Key ID, Client ID, and the `.p8` private key.
   - Or generate in code and pass it into the Apple provider (e.g. from `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`).  
   The JWT expires (e.g. 6 months); rotate before expiry.
7. Add to `.env`:
   ```env
   APPLE_ID=com.yourapp.service
   APPLE_SECRET=eyJhbGc...   # The JWT client secret
   ```

---

## 7. Database (Prisma / MySQL)

### Steps

1. Create a MySQL database (local or hosted, e.g. PlanetScale, Railway, AWS RDS).
2. Set in `.env`:
   ```env
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
   ```
3. Run migrations: `npx prisma migrate dev`
4. Optional seed: `npx prisma db seed`

---

## 8. Cloudinary (listing images)

### Steps

1. Sign up at [cloudinary.com](https://cloudinary.com/) and open the **Dashboard**.
2. Copy **Cloud name**, **API Key**, **API Secret**.
3. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## 9. Google Maps (geocoding & map UI)

### Steps

1. In [Google Cloud Console](https://console.cloud.google.com/) (same or different project as OAuth), enable **Maps JavaScript API** and **Geocoding API**.
2. **APIs & Services** → **Credentials** → create **API key** (or use existing).
3. Restrict the key (optional): HTTP referrers for your domain(s), and limit to Maps JavaScript API + Geocoding API.
4. Add to `.env` (must be `NEXT_PUBLIC_` so the client can use it):
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
   ```

---

## 10. CREA / MLS (Canadian listings)

### Steps

1. Obtain CREA DDF API credentials (client ID and secret) from your board/MLS provider.
2. Add to `.env`:
   ```env
   CREA_CLIENT_ID=your_crea_client_id
   CREA_CLIENT_SECRET=your_crea_client_secret
   ```

---

## 11. Redis (Socket.io – optional)

Used for real-time notifications. If not set, the app falls back to in-memory Socket.io.

### Steps

1. Create a Redis instance (e.g. [Upstash](https://upstash.com/), Redis Cloud, or local Redis).
2. Get the connection URL (e.g. `rediss://default:xxx@xxx.upstash.io:6379`).
3. Add to `.env`:
   ```env
   REDIS_URL=rediss://...
   ```

---

## 12. Nodemailer (MLS error emails)

### Steps

1. Use an SMTP provider (Gmail, SendGrid, Mailgun, etc.). For Gmail: enable 2FA and create an **App password**.
2. Add to `.env`:
   ```env
   NODEMAILER_USER=your-email@gmail.com
   NODEMAILER_PASS=your_app_password
   ```
   (Or the SMTP user/pass for your provider; adjust `lib/email.ts` if using a different transport.)

---

## 13. Cron (MLS sync)

Used to protect the cron endpoint that runs MLS sync. **On Vercel**, set `CRON_SECRET` in the project’s Environment Variables; Vercel sends it as `Authorization: Bearer <CRON_SECRET>` when invoking the cron. See **[VERCEL-DEPLOYMENT-GUIDE.md](VERCEL-DEPLOYMENT-GUIDE.md)** for full deployment steps.

### Steps

1. Generate a secret (e.g. `openssl rand -base64 24`; at least 16 characters).
2. Add to `.env` for local runs:
   ```env
   CRON_SECRET=your_cron_secret
   ```
3. On Vercel: add `CRON_SECRET` in **Settings → Environment Variables** (Production).
4. When calling the cron job manually or from another scheduler, send:  
   `Authorization: Bearer your_cron_secret`

---

## 14. Google Analytics

### Steps

1. Create a property at [analytics.google.com](https://analytics.google.com/) and get the **Measurement ID** (e.g. `G-XXXXXXXXXX`).
2. Add to `.env` (must be `NEXT_PUBLIC_`):
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

---

## 15. Sentry (errors – optional)

If you use Sentry via `@sentry/nextjs`:

### Steps

1. Create a project at [sentry.io](https://sentry.io/) and get the **DSN**.
2. Add to `.env`:
   ```env
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```
   (Other Sentry env vars may be required depending on your `next.config.js` and Sentry setup.)

---

## Quick reference – all env vars

| Variable | Service | Required |
|----------|---------|----------|
| `NEXTAUTH_SECRET` | NextAuth | Yes |
| `NEXTAUTH_URL` | NextAuth | Yes |
| `DATABASE_URL` | Prisma | Yes |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | For Google sign-in |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth | For GitHub sign-in |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook | For Facebook sign-in |
| `APPLE_ID` / `APPLE_SECRET` | Apple | For Apple sign-in |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cloudinary | For image uploads |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps | For maps & geocoding |
| `CREA_CLIENT_ID` / `CREA_CLIENT_SECRET` | CREA/MLS | For MLS search/sync |
| `REDIS_URL` | Socket.io | Optional (fallback: in-memory) |
| `NODEMAILER_USER` / `NODEMAILER_PASS` | Email | For MLS error emails |
| `CRON_SECRET` | Cron | For MLS sync endpoint |
| `NEXT_PUBLIC_GA_ID` | Analytics | Optional |
| `SENTRY_DSN` | Sentry | Optional |

Keep `.env` out of version control (add `.env` to `.gitignore`). Use your host’s environment config in production.
