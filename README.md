# Jespersen Erections - Professional Construction Website

A professional, responsive website for Jespersen Erections construction company. Built to showcase work and attract new business.

## Features

- **Hero section** – Strong first impression with call-to-action
- **Services** – Deck builds, siding, remodels
- **Portfolio** – Project gallery with hover effects (add your own images)
- **About** – Company credentials and stats
- **Contact form** – Quote request form with validation
- **Admin page** – Protected `/admin` editor for Services, Our Work, About, and search data on Vercel

## Quick Start

1. Open `index.html` in a web browser, or
2. Use a local server (recommended for development):
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (npx)
   npx serve
   ```
3. Visit `http://localhost:8000`

## Customization

### Update Contact Info
Edit the phone number and email in `index.html` (search for `contact-details`).

### Add Your Photos
Replace the Unsplash URLs in `styles.css` (search for `placeholder-1` through `placeholder-4`) with your own project images. Or add `<img>` tags to the portfolio items in `index.html`.

### Connect the Contact Form
The form currently shows a success message locally. To receive submissions:
- Use a form service (Formspree, Netlify Forms, etc.)
- Or add a backend endpoint and update `script.js` to submit via `fetch()`

### Admin Setup

If the site is deployed on Vercel, use `ADMIN-SETUP.md` for the environment variables required by the protected admin page and content storage.

## File Structure

```
Jespersen/
├── index.html    # Main page
├── styles.css    # All styling
├── script.js     # Navigation, form, animations
└── README.md     # This file
```

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Uses CSS Grid, Flexbox, and vanilla JavaScript.
