# Hernan Glenn Belarmino Amon: Portfolio

A full-stack developer portfolio: a static front end on GitHub Pages, a private admin dashboard, and a Supabase back end (Auth, PostgreSQL, Storage) protected by row-level security.

**Live site:** https://tenjicpuz.github.io/Hernan-Portfolio/

## Features

- Dark, monochrome design with an intro splash, a draggable hanging ID card, a floating pill navigation and a tabbed showcase (Projects, Certificates, Tech Stack).
- Live GitHub data: repository count, most-used language, last activity and up to six projects, from one cached API request.
- Certificates uploaded through the admin dashboard, with an image preview and PDF support.
- Contact links and extra content managed from the dashboard, with no code changes or redeploys.
- Featured case study describing the architecture and security design of this platform.
- Accessible and responsive: skip link, keyboard-operable tabs, visible focus, reduced-motion support, print-to-PDF layout, schema.org structured data.

## Architecture

```
Browser (vanilla JavaScript)
  |-- GitHub Pages ........ static hosting, deployed from main
  |-- GitHub REST API ..... live profile and repositories (cached 15 min)
  '-- Supabase ............ Auth, PostgreSQL, Storage (row-level security)
```

Anyone can read published data. Only the owner account can insert, update or delete.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Public portfolio (styles and scripts included in the one file) |
| `admin.html` + `admin.js` | Private owner dashboard: certificates, contact links, extra content |
| `config.js` | Supabase project URL and public anon key |
| `supabase_setup.sql` | The one database setup file. Safe to re-run |
| `404.html` | Custom not-found page |
| `sitemap.xml`, `robots.txt` | Search engine files |
| `google255eb07db4aa57cb.html` | Google Search Console verification (keep it) |
| `_nojekyll` | Tells GitHub Pages to serve files as they are |

## Setup

### 1. Database (once)

1. Open the Supabase Dashboard, then **SQL Editor**, then **New query**.
2. Paste all of `supabase_setup.sql` and click **Run**.
3. Go to **Authentication, Sign In / Providers** and turn **off** "Allow new users to sign up".

This restricts every write (certificates, files, contact links, content) to the owner account.

### 2. Configuration

Put your Supabase URL and public anon key in `config.js`. If you change the admin account, update the owner UID in **both** `supabase_setup.sql` and `admin.js`.

### 3. Publishing

**Settings, Pages, Deploy from a branch, `main`, `/ (root)`.** Open `/admin.html` to manage content.

## Keeping the portfolio current

- **Projects** load from your public GitHub repositories (non-forks, ranked by stars, then recent activity). Give each repository a clear description and it appears on the site.
- **Fallback project list:** edit the `<ul id="project-grid">` block in `index.html`. It shows when GitHub is unreachable and to search engines.
- **Contact details:** add your email and other links in the dashboard under **Contact links**.
- **Typing line in the hero:** edit the `phrases` array in the script at the bottom of `index.html`.
- **Skip the intro splash while editing:** it already runs once per browser session.

## Security notes

- The anon key is public by design. The database policies are what protect your data.
- The owner UID appears in `supabase_setup.sql` and `admin.js`. It is an identifier, not a secret.
- Never commit a `service_role` key.
- All database text is escaped before rendering, and link schemes are validated.
- Uploaded certificates are publicly viewable. Do not upload private data.

## Tech

JavaScript, HTML, CSS, PostgreSQL, Supabase (Auth, Storage, RLS), GitHub REST API, GitHub Pages.
