# Jespersen Admin Setup

This site now includes a protected admin page at `/admin`.

It uses:
- a password-protected login form
- an `HttpOnly` session cookie
- Vercel serverless functions
- Vercel Blob storage for saved content

## What the Admin Can Edit

- `Services`
- `Our Work`
- `About`
- `Search Results Data` for internal admin notes

## Required Vercel Environment Variables

Add these in `Project -> Settings -> Environment Variables`:

- `ADMIN_PASSWORD`
  - Set this to the password you want to use for the admin

- `ADMIN_SECRET`
  - Use a long random string for signing session cookies
  - Example: `jespersen-admin-super-secret-change-this`

- `BLOB_READ_WRITE_TOKEN`
  - Read/write token for the existing **public** Blob store
  - Used for public page content and portfolio images
  - Do not point this at a private store. A store's access mode is chosen when the store is created and cannot be changed later.

- `PRIVATE_BLOB_READ_WRITE_TOKEN`
  - Read/write token for a **separate private** Blob store that holds admin search notes
  - Not created by this repository. When you are ready, create a Blob store with access set to Private and connect it without replacing `BLOB_READ_WRITE_TOKEN`
  - In the connection's Advanced Options, set the environment variable prefix to `PRIVATE_` so the generated name is `PRIVATE_BLOB_READ_WRITE_TOKEN`
  - If the dashboard shows a different generated name, copy that private store's token into `PRIVATE_BLOB_READ_WRITE_TOKEN` yourself
  - The code passes this token explicitly. Vercel uses an explicit `token` ahead of the project's default OIDC store (`BLOB_STORE_ID` and `VERCEL_OIDC_TOKEN`), which stays with the public store
  - Admin Save fails until this is set. Public pages still read the public store without it

### Google Search Console (Search Results tab + query momentum)

The same credentials power **Search Console** stats and **query momentum** (compares the selected period to the previous period so you can see searches gaining impressions). This uses Google’s **official Search Console API** only.

**Note:** There is **no public Google API** for Google Trends-style “what’s trending worldwide.” For broad industry trends, use [Google Trends](https://trends.google.com) manually or your Ads/SEO tools. Momentum is based on **your site’s** Search Console data, which is usually more actionable than generic trends.

- `GSC_SITE_URL`
  - Must match your Search Console property exactly
  - Examples:
    - `https://example.com/` (URL-prefix property)
    - `sc-domain:example.com` (domain property)

Use one of these:

- `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` (recommended)
  - Base64-encoded full service-account JSON key

- `GOOGLE_SERVICE_ACCOUNT_KEY`
  - Raw service-account JSON key (minified or normal)

### Service Request Email Notifications

This project now matches the same email setup pattern used in your other site.
Add these so contact form submissions send an email:

- `EMAIL_USER`
  - Your Gmail address used to send notifications

- `EMAIL_PASSWORD`
  - Gmail app password (16 characters, no spaces)

- `RECIPIENT_EMAIL` (optional)
  - Where you want notifications delivered
  - Defaults to `Jespersenerections@gmail.com` if not set

## Deploy

1. Redeploy the Vercel project after adding the environment variables.
2. Open `/admin` on the live site.
3. Log in with `ADMIN_PASSWORD`.
4. Save content updates from the admin page.

## Notes

- If `BLOB_READ_WRITE_TOKEN` is missing, the public site still falls back to default content.
- The public homepage loads editable content from `/api/content`. That route reads only the public store.
- `Search Results Data` is stored for admin use in a private Blob store at `admin/search-results.json`, using `PRIVATE_BLOB_READ_WRITE_TOKEN`. It is not written into the public `site-content.json` object and is not shown on the public homepage.
- Only a signed-in admin request can read those notes. The private blob URL is not public.
- This repository change does not create a store, rewrite the live Blob, or migrate notes. Legacy notes stay in the public object until an admin Save succeeds after the private token is configured. Download the current public `site-content.json` before that first save if you want a copy. See `docs/LEGAL-05-review.md` for recovery steps.
