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
  - Create a Vercel Blob store and copy its read/write token here

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
- The public homepage loads editable content from `/api/content`.
- `Search Results Data` is stored for admin use and is not shown on the public homepage.
