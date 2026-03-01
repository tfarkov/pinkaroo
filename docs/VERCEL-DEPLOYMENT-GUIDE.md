# Vercel Deployment Guide (App + Env + Cron + GoDaddy Domain)

This guide covers a full production deployment of Pinkaroo on Vercel:

- Initial Vercel project setup
- Required and optional environment variables
- Deployment workflows (manual + CI/CD)
- Production database migration and seeding strategy
- Vercel Cron setup for MLS sync
- GoDaddy custom domain setup

For service-specific credential creation, see **[SETUP-CREDENTIALS.md](SETUP-CREDENTIALS.md)**.

---

## 1) Prerequisites

Before deploying:

1. Code is pushed to GitHub/GitLab/Bitbucket.
2. You have a production MySQL database connection string.
3. You have at least the required secrets/keys listed below.
4. Domain is ready in GoDaddy (if using a custom domain).

---

## 2) Create the Vercel project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
2. Import the repository.
3. Framework should auto-detect as **Next.js**.
4. Use defaults unless you have custom needs:
   - Build command: `next build` (default)
   - Output directory: default
   - Install command: default
5. Deploy once (you will likely get runtime errors until env vars are added).

Note: `postinstall` runs `prisma generate`, so Prisma client is generated during install.

---

## 3) Configure environment variables in Vercel

In Vercel: **Project -> Settings -> Environment Variables**.

Set variables for at least **Production**. Add to **Preview** too if you want preview deployments to be fully functional.

### Required for production

| Variable | Why it is required |
|---|---|
| `DATABASE_URL` | Prisma database connection |
| `NEXTAUTH_SECRET` | Session/JWT signing for auth |
| `NEXTAUTH_URL` | Canonical auth URL (must match production domain) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map rendering and client geocode usage |
| `CRON_SECRET` | Auth for `/api/cron/sync-mls` cron endpoint |

### Required for specific features (strongly recommended)

| Variable | Needed for |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Listing image upload |
| `CLOUDINARY_API_KEY` | Listing image upload |
| `CLOUDINARY_API_SECRET` | Listing image upload |
| `CREA_CLIENT_ID` | MLS search/import/sync |
| `CREA_CLIENT_SECRET` | MLS search/import/sync |

### Optional

| Variable | Feature |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_ID`, `GITHUB_SECRET` | GitHub OAuth |
| `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Facebook OAuth |
| `APPLE_ID`, `APPLE_SECRET` | Apple OAuth |
| `NODEMAILER_USER`, `NODEMAILER_PASS` | MLS error emails |
| `NEXT_PUBLIC_GA_ID` | Google Analytics |
| `SENTRY_DSN` | Sentry error reporting |

### Value tips

- `NEXTAUTH_URL` should be your production URL, for example:
  - `https://yourdomain.com` (apex)
  - or `https://www.yourdomain.com`
- `NEXTAUTH_SECRET` and `CRON_SECRET`: generate random values (`openssl rand -base64 32`).
- Never commit secrets to git.

---

## 4) Deployment workflows (consolidated)

Choose one workflow and keep it consistent across your team.

### Workflow A: Vercel Git auto-deploy + manual DB migration

Best for small teams or low deployment frequency.

1. Push to your production branch (for example `dev` or `main`).
2. Let Vercel build/deploy automatically from Git integration.
3. Run database migration manually against production:

```bash
npx prisma migrate deploy
```

4. Run optional seed only when needed:

```bash
npx prisma db seed
```

5. Verify critical routes:
   - `/`
   - `/signin`
   - `/listings/...`
   - `/api/auth/session`

### Workflow B: CI/CD pipeline (recommended for teams)

Best for repeatable and auditable releases.

Pipeline stages:

1. **Validate** (PR): install, lint/test/build.
2. **Deploy** (merge to production branch): trigger Vercel production deployment.
3. **Migrate**: run `prisma migrate deploy` against production DB.
4. **Post-deploy checks**: health/smoke checks and optional cron endpoint test.

Important migration rule:

- `prisma migrate deploy` must run in every production release pipeline.
- `prisma db seed` should usually be one-time bootstrap or controlled job, not every deploy.

---

## 5) CI/CD implementation guide (GitHub Actions example)

If you use GitHub, add a production deploy workflow.

### Required CI secrets

Add these in GitHub repository settings (`Settings -> Secrets and variables -> Actions`):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL` (production DB URL used by migration step)
- Optionally: `CRON_SECRET` if you want to run authenticated cron smoke test in CI

### Example production workflow

```yaml
name: Deploy Production

on:
  push:
    branches: [dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build check
        run: npm run build

      - name: Apply Prisma migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx prisma migrate deploy

      - name: Deploy to Vercel Production
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          npm i -g vercel
          vercel pull --yes --environment=production --token=$VERCEL_TOKEN
          vercel build --prod --token=$VERCEL_TOKEN
          vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

Adjust the trigger branch (`dev`/`main`) to match your production branch.

### CI/CD notes

- Prefer protected branches + required checks before merge.
- Run preview deployments on PRs, production deployment on merge only.
- Keep all production config in Vercel Environment Variables, not in workflow files.
- If rollback is needed, restore a previous Vercel deployment and handle DB rollback separately.

---

## 6) Cron setup for MLS sync

Cron is defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-mls",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- Path: `GET /api/cron/sync-mls`
- Schedule: `0 6 * * *` (daily at 06:00 UTC)

Important:

- Cron executes on **Production** deployments.
- On Hobby plan, cron frequency limits apply (typically daily max).
- Endpoint is protected by `Authorization: Bearer <CRON_SECRET>`.

### Verify cron

1. Vercel -> **Project -> Cron Jobs**
2. Confirm `/api/cron/sync-mls` appears.
3. Check logs after scheduled run.
4. Optional manual test:

```bash
curl -X GET "https://your-domain.com/api/cron/sync-mls" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected:

- `200` + success payload on valid call
- `401` if secret is missing/wrong

---

## 7) GoDaddy domain setup

There are two valid approaches. Use one.

### Option A: Keep GoDaddy DNS, add Vercel records (most common)

1. In Vercel: **Project -> Settings -> Domains -> Add** your domain:
   - `yourdomain.com`
   - `www.yourdomain.com`
2. Vercel shows required DNS records.
3. In GoDaddy DNS management, add/update:
   - **A** record: host `@` -> `76.76.21.21`
   - **CNAME**: host `www` -> `cname.vercel-dns.com`
4. If Vercel asks for verification, add the TXT record it provides.
5. Wait for DNS propagation (usually minutes, sometimes up to 24-48h).
6. In Vercel domains page, ensure both domains show **Valid**.
7. Set the primary domain in Vercel (apex or `www`).

### Option B: Delegate nameservers to Vercel

1. In Vercel domain settings, choose nameserver delegation.
2. At GoDaddy, replace nameservers with Vercel-provided values.
3. Wait for propagation.
4. Manage DNS records from Vercel going forward.

Use this if you want all DNS controlled from Vercel.

---

## 8) Post-domain checks (critical)

After DNS is valid:

1. Update `NEXTAUTH_URL` to your final primary domain (if it changed).
2. Redeploy production (or trigger "Redeploy" in Vercel).
3. Verify:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com` (redirect behavior as desired)
   - OAuth callback URLs match your final domain in provider dashboards.
4. Confirm SSL certificate is active in Vercel.

---

## 9) Production smoke test checklist

- [ ] Home, listings, listing detail pages load
- [ ] Sign in works (credentials and enabled OAuth providers)
- [ ] Add listing image upload works (Cloudinary)
- [ ] MLS search/import works (CREA credentials)
- [ ] Cron job appears in Vercel and logs successful runs
- [ ] Custom domain resolves and HTTPS works
- [ ] `NEXTAUTH_URL` matches final domain

---

## 10) Common issues and fixes

- **401 on cron endpoint**: `CRON_SECRET` missing/mismatch.
- **Auth callback errors**: wrong `NEXTAUTH_URL` or provider callback URL mismatch.
- **Database errors at runtime**: `DATABASE_URL` incorrect or migrations not deployed.
- **Maps not rendering**: missing/invalid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or referrer restrictions.
- **Images not uploading**: Cloudinary env vars missing.
- **Domain not validating**: DNS records wrong or still propagating.

---

## Quick command reference

```bash
# Generate secrets
openssl rand -base64 32

# Production migrations
npx prisma migrate deploy

# Optional seed
npx prisma db seed

# Manual cron trigger
curl -X GET "https://your-domain.com/api/cron/sync-mls" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
