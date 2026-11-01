#Portfolio

![Portfolio banner](banner.png)

**BSIT Student · Independent Creator · Aspiring Developer**

------------------------------------------------------------------------

## About

Welcome to my personal portfolio repository. I'm Hernan Glenn Belarmino
Amon, a second-year Bachelor of Science in Information Technology
student at Olivarez College, based in Silang, Cavite, Philippines.

I build independent projects to strengthen my programming skills,
explore web technologies, and turn ideas into practical digital tools.

## Preview

![Portfolio website preview](preview.png)

## Highlights

-   Responsive portfolio layout for desktop and mobile
-   About, skills, projects, certificates, education, and contact
    sections
-   Projects loaded from my public GitHub repositories
-   Live GitHub profile statistics
-   Certificate gallery connected to Supabase
-   Light and dark appearance modes
-   Contact-link management for the portfolio owner
-   Print-friendly layout for saving the portfolio as a PDF

## Tech Stack

  Technology                        Purpose
  --------------------------------- -------------------------------------------
  HTML5                             Page structure
  CSS3                              Styling, layout, and responsive design
  JavaScript                        Interactive features and dynamic content
  GitHub API                        Public repository and profile information
  Supabase                          Certificate gallery and contact-link data
  GitHub Pages / Cloudflare Pages   Website hosting and deployment

## Repository Structure

``` text
.
├── index.html
├── 404.html
├── admin.html
├── admin-legacy.html
├── admin.js
├── config.js
├── banner.png
├── preview.png
├── .nojekyll
└── README.md
```

## Run Locally

1.  Clone the repository:

    ``` bash
    git clone https://github.com/tenjicpuz/Portfolio-SRC.git
    ```

2.  Open the project folder:

    ``` bash
    cd Portfolio-SRC
    ```

3.  Open `index.html` in your browser.

Some features, including the certificate gallery and contact management,
require the appropriate Supabase configuration.

## Configuration

The website uses `config.js` for its public client-side configuration.
Add the required Supabase project URL and anon key there if you want to
enable the connected features.

**Security note:** Never place a Supabase service-role key, private API
key, or account password in a public repository. Use only the public
anon key with properly configured Row Level Security policies.

## Deployment

The site can be hosted using a static hosting provider such as GitHub
Pages or Cloudflare Pages.

For the live version, visit
**[tenjicpuz.is-a.dev](https://tenjicpuz.is-a.dev/)**.

## Connect

-   **Portfolio:** https://tenjicpuz.is-a.dev/
-   **GitHub:** https://github.com/tenjicpuz
-   **Social profile:** https://guns.lol/kensojukisaki

------------------------------------------------------------------------

*Built and maintained by Hernan Glenn Belarmino Amon.*
