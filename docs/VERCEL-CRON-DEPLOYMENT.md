# Vercel Cron Jobs – Deployment Steps

This project uses Vercel Cron Jobs to run the **MLS sync** on a schedule. Follow these steps to enable cron on Vercel.

---

## 1. Cron configuration in the repo

Cron is defined in **`vercel.json`** at the project root:

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

- **Path:** `GET /api/cron/sync-mls` (MLS sync from CREA).
- **Schedule:** `0 6 * * *` = daily at **06:00 UTC**. Change as needed (cron expression is standard 5-field).

On **Hobby** plan, cron can run **at most once per day**; more frequent schedules will fail deployment.

---

## 2. Set `CRON_SECRET` on Vercel

Vercel sends this as the `Authorization: Bearer <CRON_SECRET>` header when invoking the cron. Your endpoint checks it and returns 401 if missing or wrong.

1. In [Vercel Dashboard](https://vercel.com/dashboard), open your **project**.
2. Go to **Settings** → **Environment Variables**.
3. Add:
   - **Name:** `CRON_SECRET`
   - **Value:** A random string (e.g. from `openssl rand -base64 24` or [generate-secret.vercel.app](https://generate-secret.vercel.app/)); **at least 16 characters** recommended.
   - **Environments:** Enable **Production** (and Preview if you want to test cron on preview deployments).
4. Save.

---

## 3. Deploy to production

Cron jobs run only on **production** deployments:

- Push to your production branch (e.g. `main`) or trigger a production deploy from the Vercel dashboard.
- After deploy, the cron definition from `vercel.json` is active; Vercel will call `GET /api/cron/sync-mls` on the schedule.

No extra “enable cron” step is required once `vercel.json` is in the repo and the project is deployed.

---

## 4. Verify cron is active

1. In Vercel: **Project** → **Cron Jobs** tab (left sidebar).
2. You should see the job for `/api/cron/sync-mls` and its schedule.
3. Use **View Logs** to see invocations and response status (e.g. 200 = success, 401 = bad/missing `CRON_SECRET`).

---

## 5. Optional: test the endpoint manually

You can trigger the same logic locally or against production:

```bash
curl -X GET "https://your-domain.com/api/cron/sync-mls" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

- **200** + `{"success":true}` = sync ran successfully.
- **401** = wrong or missing `Authorization` header.
- **500** = error during sync (check runtime logs in Vercel).

---

## Summary checklist

- [ ] `vercel.json` with `crons` is in the repo and deployed.
- [ ] `CRON_SECRET` is set in Vercel (Production, and optionally Preview).
- [ ] Production deployment is done after adding `CRON_SECRET`.
- [ ] Cron Jobs tab in Vercel shows the job and you can view logs.

For credential setup (e.g. CREA, Nodemailer for MLS error emails), see **[SETUP-CREDENTIALS.md](SETUP-CREDENTIALS.md)**.
