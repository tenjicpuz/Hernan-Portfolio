# Hernan Glenn Belarmino Amon: Portfolio

Static portfolio hosted on GitHub Pages with a Supabase backend for certificates, contact links and extra content.

Live site: https://tenjicpuz.github.io/Hernan-Portfolio/

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Public portfolio (reads GitHub stats, certificates, contact links, published content) |
| `admin.html` + `admin.js` | Private owner dashboard (certificates, contact links, extra content) |
| `config.js` | Supabase project URL and public anon key |
| `supabase_setup.sql` | The ONE database setup file. Safe to re-run |
| `404.html` | Custom not-found page |
| `sitemap.xml`, `robots.txt` | Search engine files |
| `google255eb07db4aa57cb.html` | Google Search Console verification (keep it) |

## Updating the database (do this once after pulling these changes)

1. Open Supabase Dashboard, **SQL Editor**, **New query**.
2. Paste all of `supabase_setup.sql` and click **Run**.
3. Go to **Authentication, Sign In / Providers** and turn **off** "Allow new users to sign up".

This restricts every write (certificates, files, contact links, content) to your owner account only. Before, any signed-in user could write.

## Publishing

Settings, Pages, Deploy from a branch, `main`, `/ (root)`. Visit `/admin.html` to manage content.

## Security notes

- The anon key is public by design; the database policies are what protect your data.
- The owner UID appears in `supabase_setup.sql` and `admin.js`. It is an identifier, not a secret.
- If you change your admin account, update the UID in **both** places.
- Never commit a `service_role` key.
- Uploaded certificates are publicly viewable. Do not upload private data.
