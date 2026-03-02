# Cloudinary Setup (Listing Image Uploads)

This document is a focused guide for configuring **Cloudinary** for listing image uploads in Pinkaroo.

For the complete set of third-party credentials (NextAuth, DB, Maps, MLS, etc.), see **[`SETUP-CREDENTIALS.md`](SETUP-CREDENTIALS.md)**.

---

## How Pinkaroo uses Cloudinary

- **Uploads happen server-side** in `pages/api/listings/index.ts` (the `POST` handler).
- The API accepts a multipart form field named **`images`** and uploads each file via Cloudinary.
- Uploaded images are transformed to a reasonable web size:
  - width: `800`
  - quality: `80`
  - format: `auto`
- The listing stores the returned **`secure_url`** values (Cloudinary-hosted HTTPS URLs).
- `next.config.js` is already configured to allow `res.cloudinary.com` images in `next/image` remote patterns.

---

## 1) Create a Cloudinary account

1. Create/sign in to your Cloudinary account at `https://cloudinary.com/`.
2. Open the **Dashboard**.
3. Copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**

---

## 2) Set required environment variables

Pinkaroo expects these **server-only** environment variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Notes:
- Do **not** prefix these with `NEXT_PUBLIC_` (they must not be exposed to the browser).
- For local development, put them in your `.env` (not committed).
- For Vercel, add them in **Project → Settings → Environment Variables**.

---

## 3) Local development checklist

1. Add the variables above to `.env`.
2. Restart the dev server after adding env vars.
3. Sign in as a role allowed to create listings (REALTOR/BROKER/ADMIN).
4. Go to **Add Listing** and upload one or more photos.
5. Submit and confirm:
   - the listing is created
   - the images are stored as `https://res.cloudinary.com/...` URLs

### Windows note (temp uploads)

The API route currently uses Multer with `dest: '/tmp'`. On some Windows setups, `C:\\tmp`/`/tmp` may not exist.

If uploads fail locally on Windows with temp-path errors:
- Create a temp directory that Multer can write to, or
- Set your environment to provide a working temp dir, or
- Update the Multer destination to use `os.tmpdir()` (code change).

---

## 4) Vercel deployment checklist

1. In Vercel, add:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Deploy.
3. In production, confirm Add Listing uploads work and Cloudinary URLs render.

---

## Troubleshooting

### Uploads fail with “Must supply api_key” / “Invalid Signature” / “Unauthorized”

- Ensure all three env vars exist in the environment that is running the API route (local terminal or Vercel project).
- Confirm there are no extra quotes or whitespace in the values.
- Confirm you didn’t accidentally set them as `NEXT_PUBLIC_...` vars.

### Images upload but don’t render on the site

- Confirm the stored image URLs start with `https://res.cloudinary.com/`.
- Confirm `next.config.js` includes `res.cloudinary.com` in `images.remotePatterns` (it should already).

### Images are too big or look low quality

- Adjust the Cloudinary transformation in `pages/api/listings/index.ts`:
  - `width` (e.g., 1200)
  - `quality` (e.g., 85)
  - `format` (e.g., `auto`)

---

## Security notes

- Keep `CLOUDINARY_API_SECRET` private.
- Do not commit secrets to git.
- Prefer setting secrets via your hosting provider (Vercel) and `.env` locally.

