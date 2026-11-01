# Hernan Glenn Belarmino Amon — Portfolio

A responsive, monochrome developer portfolio hosted on **GitHub Pages**, with a private owner dashboard and a **Supabase** back end. The public site presents profile information, GitHub projects, certificates, contact links, and additional portfolio content. The owner can manage supported content through the website's admin dashboard without editing the public page for every update.

**Live portfolio:** <https://tenjicpuz.pages.dev/>  
**GitHub profile:** <https://github.com/tenjicpuz>  
**Admin dashboard:** <https://tenjicpuz.pages.dev/admin>

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [How the project works](#how-the-project-works)
- [Project structure](#project-structure)
- [Technology stack](#technology-stack)
- [Deployment and setup](#deployment-and-setup)
- [Using the admin dashboard](#using-the-admin-dashboard)
- [Supabase data and storage](#supabase-data-and-storage)
- [Profile picture behavior](#profile-picture-behavior)
- [Security and privacy](#security-and-privacy)
- [Search engine files](#search-engine-files)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Important notes](#important-notes)

---

## Overview

This project is a static website with dynamic data supplied by GitHub and Supabase.

- **GitHub Pages** serves the public HTML, CSS, JavaScript, and static support files.
- **GitHub REST API** supplies public GitHub profile and repository information.
- **Supabase Auth** handles admin sign-in.
- **Supabase PostgreSQL** stores certificates, contact links, and extra portfolio entries.
- **Supabase Storage** stores certificate files and the uploaded profile picture.
- **Row Level Security (RLS)** is intended to enforce which database operations are allowed.

The public portfolio is designed to be readable without an account. The admin dashboard is intended for the portfolio owner.

## Features

### Public portfolio

- Dark, monochrome visual design using Syne, Manrope, and JetBrains Mono fonts.
- Intro splash screen and floating navigation.
- Responsive hero and About sections.
- Hanging ID-card presentation with interactive movement.
- Profile picture loaded from Supabase when a custom picture exists, otherwise it uses the GitHub profile image.
- GitHub profile statistics and repository-based project information.
- Portfolio showcase with Projects, Certificates, and Tech Stack tabs.
- Certificate gallery with support for public image and PDF files.
- Contact and social links loaded from Supabase.
- Published extra portfolio content loaded from Supabase.
- Featured case study describing the portfolio platform's architecture.
- Keyboard-accessible controls, visible focus styles, skip navigation, and reduced-motion support.
- Responsive layouts and print-friendly styling.

### Private admin dashboard

The current dashboard is `admin.html`, with its application logic in `admin.js`.

After an authorized owner signs in, the dashboard provides:

- **Certificates:** upload and delete certificate records and files.
- **Contact links:** add and delete website, email, and phone links.
- **Extra content:** create, edit, publish, unpublish, and delete entries in supported content sections.
- **Profile picture:** choose an image, crop and reposition it, preview the result, zoom, save it, or return to the GitHub profile picture.
- **Dashboard metrics:** certificate count, contact-link count, published-content count, and draft count.
- **Sign out:** end the current Supabase session.

### Supported extra-content sections

The admin editor currently defines these sections:

| Section | Typical fields |
| --- | --- |
| Resume / CV | Title, version or file type, summary, public PDF URL, preview image URL |
| Experience | Role, company or type, responsibilities and achievements, company URL, logo URL |
| Achievements & Awards | Award, awarding body, details, proof URL, image URL |
| Testimonials | Person name, role or organization, testimonial text, profile URL, photo URL |
| Blog / Articles | Article title, category, excerpt, article URL, featured image URL |
| Extra Projects | Project name, tech or category, description, live demo or repository URL, screenshot URL |

The public page displays published records from the `portfolio_content` table. The admin editor can also keep records as drafts.

---

## How the project works

```text
Visitor
  |
  v
GitHub Pages
  |
  +--> index.html
  |      |
  |      +--> GitHub REST API
  |      |      +--> Public profile information
  |      |      +--> Public repositories
  |      |
  |      +--> Supabase
  |             +--> PostgreSQL: certificates
  |             +--> PostgreSQL: contact_links
  |             +--> PostgreSQL: portfolio_content
  |             +--> Storage: certificates bucket
  |                    +--> Certificate files
  |                    +--> profile/ uploaded picture
  |
  +--> admin.html
         |
         +--> admin.js
                +--> Supabase Auth
                +--> PostgreSQL management
                +--> Storage uploads and deletion
```

The public page reads published information. The admin dashboard uses Supabase authentication and database/storage policies to perform management operations. The browser's public Supabase key is not an authorization mechanism; database and storage policies must enforce access.

---

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Main public portfolio. Contains the page layout, styling, and public-page JavaScript. |
| `admin.html` | Current private admin dashboard interface, including the profile-picture editor. |
| `admin.js` | Current admin logic: owner check, authentication, metrics, certificates, contact links, extra content, and profile-picture management. |
| `config.js` | Public Supabase project URL and publishable/anon key used by the browser. |
| `admin-legacy.html` | Older admin interface retained as a legacy page. It does not include the current profile-picture and extra-content dashboard features. |
| `404.html` | Custom GitHub Pages not-found page with a link back to the portfolio. |
| `.nojekyll` | Empty marker file that tells GitHub Pages not to run Jekyll processing. |
| `robots.txt` | Search crawler rules; allows the public site and disallows the current admin page and admin JavaScript. |
| `google255eb07db4aa57cb.html` | Google Search Console HTML verification file. Keep it if the corresponding property still uses it. |
| `README.md` | Project documentation. |
| `supabase_setup.sql` | Database, policies, and storage setup referenced by the project. Make sure this file is present in the repository and matches the current application before running setup. |
| `sitemap.xml` | Sitemap URL referenced by `robots.txt`. Make sure this file exists and is kept up to date if you intend to publish a sitemap. |

The last two files above are referenced by the project documentation or crawler configuration, but were not included in the files supplied for this README update. Their current contents therefore have not been verified here.

---

## Technology stack

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub Pages
- GitHub REST API
- Supabase JavaScript client
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- PostgreSQL Row Level Security

External browser dependencies currently include Google Fonts, the Supabase JavaScript client served through jsDelivr, and the GitHub REST API.

---

## Deployment and setup

### 1. Prepare the repository

Place the website files in the root of the GitHub repository used for GitHub Pages. The published project URL in the current HTML is:

`https://tenjicpuz.github.io/Hernan-Portfolio/`

Keep the relative file references working:

- `./config.js`
- `./admin.js`

The `.nojekyll` file should remain in the repository root.

### 2. Configure Supabase

Open `config.js` and check the project URL and public publishable/anon key:

```js
window.PORTFOLIO_CONFIG = {
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
};
```

Use the values from your own Supabase project. The current uploaded configuration already contains a project URL and publishable key.

**Important:** only use a browser-safe publishable/anon key here. Never put a Supabase `service_role` key or another secret key in `config.js` or any public repository file.

### 3. Set up the database and Storage

The application expects these PostgreSQL tables:

- `certificates`
- `contact_links`
- `portfolio_content`

It also expects a Storage bucket named:

- `certificates`

The bucket stores certificate uploads and the profile picture files inside its `profile/` folder.

Use the project's `supabase_setup.sql` file to configure the database, indexes, constraints, owner authorization, RLS policies, and Storage policies. Review that SQL against the current `admin.js` and public-page queries before applying it.

The SQL setup file was not among the files supplied for this README update, so this document does not reproduce or certify its policies.

### 4. Configure the admin owner

The current `admin.js` contains an `OWNER_ID` constant. It compares the authenticated user's Supabase Auth ID with the configured owner ID and signs out a different account.

```js
const OWNER_ID = 'YOUR_OWNER_AUTH_USER_ID';
```

If the owner account changes, update the owner ID in `admin.js` and in the database authorization logic in `supabase_setup.sql` so they match.

The JavaScript owner check controls the dashboard experience; it is not a replacement for database RLS or Storage policies.

### 5. Create or authorize the owner account

Create the intended owner account through the Supabase Dashboard or another trusted administrative process. The project is intended to use owner-only management rather than public account registration.

Disable public sign-ups in Supabase Auth if that matches your account-management plan. Confirm that the owner can sign in and that unauthorized users cannot write to the database or Storage.

### 6. Enable GitHub Pages

In the GitHub repository:

1. Open **Settings**.
2. Open **Pages**.
3. Select **Deploy from a branch** if that is the chosen deployment method.
4. Select the publishing branch and the repository root (`/`).
5. Save the settings and wait for deployment.

After deployment, test the public portfolio and `/admin.html`.

---

## Using the admin dashboard

Open:

`https://tenjicpuz.github.io/Hernan-Portfolio/admin.html`

Sign in with the authorized Supabase owner account.

### Certificates

- Enter a certificate title.
- Optionally enter the issuing organization and issue date.
- Select a PDF, PNG, JPG, or WEBP file.
- Upload the certificate.
- Delete a certificate from the published list when it is no longer needed.

The current admin code enforces a maximum certificate file size of **10 MB** and checks the accepted MIME types. Certificate records are stored in `certificates`; uploaded files are stored in the `certificates` Storage bucket.

### Contact links

Add a label, category, link type, and value.

Supported link types:

- Website / URL
- Email
- Phone

The dashboard validates URL, email, and phone values before inserting them. Contact links are read by the public page from `contact_links`.

### Extra content

Choose one of the available content sections, then fill in the relevant fields.

- Save a new entry.
- Select an existing entry to edit it.
- Set **Published** to control whether it is shown publicly.
- Use the display-order field to control ordering.
- Delete entries that are no longer required.

The public page queries only records marked as published.

### Profile picture

The Profile picture tab lets the owner:

1. Select or drop an image.
2. Reposition the image in the crop editor by dragging it.
3. Use the arrow keys to move the image when the canvas is focused.
4. Adjust zoom.
5. Review the card and circular previews.
6. Save the cropped picture.
7. Reset to the GitHub profile picture when desired.

The profile-picture input accepts images up to **25 MB**. The editor exports a cropped image and uploads it to the `profile/` folder in the existing `certificates` Storage bucket. The current code removes older profile images after a successful upload when Storage permissions allow it.

---

## Supabase data and storage

### Database tables

| Table | Purpose |
| --- | --- |
| `certificates` | Certificate title, issuer, issue date, Storage path, and public file URL. |
| `contact_links` | Contact or social-link label, category, type, and value. |
| `portfolio_content` | Section-based portfolio entries, descriptions, URLs, image URLs, display dates, ordering, and publication status. |

The exact SQL column definitions and policies should be taken from the deployed `supabase_setup.sql`, not inferred from this README.

### Storage bucket

The application uses one bucket named `certificates`.

| Storage location | Purpose |
| --- | --- |
| Bucket root | Uploaded certificate documents and images. |
| `profile/` | The current custom profile picture. |

The public portfolio obtains public URLs for files in this bucket. Configure Storage policies to match the intended public-read and owner-management behavior.

---

## Profile picture behavior

The profile picture shown by the public portfolio follows this behavior:

1. The page checks the `profile/` folder in the public `certificates` bucket.
2. If an uploaded profile image exists, the newest image is used.
3. If the folder is empty or the custom picture cannot be loaded, the page uses the GitHub profile image:
   `https://github.com/tenjicpuz.png`
4. The public design applies a monochrome treatment to the profile image.

The admin dashboard's **Use GitHub picture instead** action removes uploaded profile files and returns the public page to the GitHub image.

---

## Security and privacy

- The public Supabase publishable/anon key is expected to be visible in browser code. It is not a secret.
- Never publish a Supabase `service_role` key.
- Enforce database permissions with Row Level Security.
- Enforce Storage permissions with Storage policies.
- Keep owner authorization consistent between `admin.js` and the SQL setup.
- The JavaScript owner-ID check is not sufficient security on its own.
- Admin pages and scripts are disallowed in `robots.txt`, but `robots.txt` is not access control. It does not make a public page private.
- The admin dashboard should rely on Supabase authentication and server-enforced policies for protection.
- Certificate files and the custom profile picture are served using public URLs. Do not upload private documents, personal identification numbers, home addresses, or other information that should not be public.
- Only publish testimonials, photographs, certificates, and other material that you have permission to share.

---

## Search engine files

- `robots.txt` allows general crawling of the public site and disallows `/admin.html` and `/admin.js`.
- `404.html` supplies the custom not-found page.
- `google255eb07db4aa57cb.html` is the Google Search Console verification file.
- `index.html` contains canonical, Open Graph, Twitter, and Schema.org metadata.
- `robots.txt` references this sitemap:
  `https://tenjicpuz.github.io/Hernan-Portfolio/sitemap.xml`

Keep verification files and metadata accurate when changing the site URL or repository name. Ensure that `sitemap.xml` actually exists at the referenced location before relying on it.

---

## Maintenance

### Updating public profile details

Edit the relevant content in `index.html` when changing static profile text, page metadata, visual sections, or hard-coded presentation.

### Updating GitHub projects

The public page reads public profile and repository data from the GitHub REST API for the configured GitHub username. Keep repository descriptions and project information current on GitHub.

### Updating certificates, links, and extra content

Use the current admin dashboard instead of editing the public HTML for data stored in Supabase.

### Updating the profile picture

Use **Admin → Profile picture**. The public page automatically checks the Storage `profile/` folder and falls back to the GitHub image when no custom image is available.

### Updating the Supabase project

If the Supabase project changes:

1. Update `config.js`.
2. Confirm the database tables and columns expected by the public page and `admin.js`.
3. Recreate or migrate the Storage bucket and its policies.
4. Confirm the owner ID in both the admin JavaScript and database policies.
5. Test sign-in, reads, uploads, edits, and deletions before considering the migration complete.

### Editing the public site

The public page is primarily contained in `index.html`. The current admin interface is in `admin.html`, and its logic is in `admin.js`. Keep selectors, element IDs, database column names, and Storage paths in sync when changing application code.

---

## Troubleshooting

| Problem | Things to check |
| --- | --- |
| Admin page says Supabase is not configured | Check `config.js`, the Supabase URL, publishable/anon key, and script loading. |
| Owner cannot sign in | Check the Supabase Auth account, email/password, project URL, and browser console. |
| Account signs in but cannot manage data | Check the `OWNER_ID` in `admin.js` and the owner authorization and RLS policies in SQL. |
| Certificates do not load | Check the `certificates` table, public read policy, bucket name, and file URLs. |
| Certificate upload fails | Check file type, 10 MB limit, bucket configuration, and Storage insert policy. |
| Contact links do not appear | Check the `contact_links` table, read policy, and saved values. |
| Extra content does not appear | Check the `portfolio_content` table, section name, `is_published` value, and public read policy. |
| Profile picture does not update | Check the `certificates` bucket, `profile/` folder, Storage list/upload/delete policies, and browser console. |
| GitHub project information is missing | Check the public GitHub username, API response, network availability, and GitHub API rate limits. |
| Changes are not visible after deployment | Confirm the GitHub Pages deployment completed, then refresh the page and check browser caching. |
| 404 page has a broken return link | Confirm the repository base path in the link in `404.html` matches the published site path. |

---

## Important notes

- `admin.html` and `admin.js` are the current admin implementation.
- `admin-legacy.html` is retained as an older interface; use the current dashboard for profile-picture and extra-content management.
- Do not delete `google255eb07db4aa57cb.html` if it is still used for Search Console verification.
- Keep `.nojekyll` in the repository root.
- Confirm that `sitemap.xml` and `supabase_setup.sql` are present in the actual repository; they were not included in the files supplied for this README update.
- This README documents the supplied application files. It does not replace testing the live Supabase policies or verifying the deployed environment.

---

*Last documentation update: 1 November 2026.*
