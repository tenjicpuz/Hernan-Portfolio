# Hernan Glenn Belarmino Amon — Portfolio

Static portfolio for GitHub Pages with a Supabase-powered certificate gallery and a private upload page.

## Files

- `index.html` — public portfolio and automatic certificate gallery.
- `admin.html` — sign-in, upload, and delete interface for certificates.
- `config.js` — Supabase project URL and public anon/publishable key placeholders.
- `supabase_setup.sql` — database, public read, and authenticated write policies; storage bucket setup.

## 1. Create Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open **Project Settings → API** (or **Connect**) and copy the Project URL and public anon/publishable key. Never use a `service_role` or secret key in browser code.
3. Replace the two placeholder values in `config.js`.
4. Open **SQL Editor**, paste all of `supabase_setup.sql`, and run it.
5. In **Authentication → Providers / Sign In**, disable public sign-ups. Create your own admin user from Authentication → Users (invite/create user, depending on dashboard options). Use that email/password at `/admin.html`.

The policies allow public visitors to read certificates and only authenticated users to add/delete. With public sign-ups disabled and only your own admin user created, the upload page is private to you. Do not share your admin password.

## 2. Publish with GitHub Pages

1. Upload all files in this folder to the root of your GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
4. Wait for GitHub Pages to finish publishing. Your public site will be `https://YOUR-GITHUB-USERNAME.github.io/` if the repository is named `YOUR-GITHUB-USERNAME.github.io`, or the repository subpath for a project site.
5. Open the public site and `/admin.html` to test the gallery and upload flow.

## 3. Add a certificate

Visit your site's `/admin.html`, sign in, enter a title and optional issuer/date, choose a PDF or image (up to 10 MB), and upload. The public gallery reads the database on page load, so no source-code edit or redeployment is needed. Visitors can open the public certificate file.

## Security notes

- The Supabase anon/publishable key is intended for browser use; the RLS policies are essential.
- Never put a Supabase service-role or secret key in `config.js` or any public repository.
- Public bucket files are publicly viewable by design. Do not upload certificates containing private data you do not want online.
- For a stronger admin boundary on a site with multiple trusted users, replace the generic authenticated policies with an allowlist policy tied to your own Supabase Auth user UUID.
