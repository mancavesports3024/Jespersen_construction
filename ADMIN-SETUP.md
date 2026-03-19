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

## Deploy

1. Redeploy the Vercel project after adding the environment variables.
2. Open `/admin` on the live site.
3. Log in with `ADMIN_PASSWORD`.
4. Save content updates from the admin page.

## Notes

- If `BLOB_READ_WRITE_TOKEN` is missing, the public site still falls back to default content.
- The public homepage loads editable content from `/api/content`.
- `Search Results Data` is stored for admin use and is not shown on the public homepage.
