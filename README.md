# BalkanMadness: landing page handoff

A one-page site for **BalkanMadness**, which organizes Balkan parties and concerts in the Netherlands (Breda & Eindhoven). The site is dark and minimal: black background, white text, red highlights.

## What's in this folder

```
balkanmadness_site/
├── index.html      ← the page (open this in a browser — no build step)
├── styles.css      ← all styling; colors/fonts as CSS variables in :root
├── content/        ← ALL editable content (JSON), edited by the owners in /admin
│   ├── site.json       hero photos, tagline, who-we-are text, contact details
│   ├── artists.json
│   └── events/         one file per event (events.json is generated from these, not committed)
├── render.js       ← HTML builders shared by the site AND the admin previews
├── main.js         ← behavior: hero crossfade, scroll reveal, modal, form
├── admin/          ← the owners' editor (Decap CMS): config.yml, admin.css (dark skin), preview.js (live previews)
├── scripts/build-content.js ← combines content/events/*.json → content/events.json (Netlify runs it on deploy)
├── netlify.toml    ← build command + publish folder
├── assets/         ← logo, hero photo, Krisko photo, event posters (uploads/ = images added via /admin)
└── reference/
    └── BalkanMadness-design-reference.html  ← the original design, single self-contained file (visual source of truth)
```

The site is plain HTML, CSS and JavaScript with no framework. The only build step is a tiny script that combines the event files (Netlify runs it automatically). `main.js` loads the content from `content/*.json`, so it has to be **served** (any static host, or locally with `npx http-server`): double-clicking `index.html` no longer loads the content. Layout is in `index.html` and styling in `styles.css`. The text already in `index.html` is a fallback; the JSON wins.

The file in `reference/` is a self-contained snapshot of the approved design. Treat it as the visual reference only, not the code to edit.

## Owner admin (/admin)

The owners log in at `https://<site>/admin/` and get a simple editor with three sections:

- **Events**: a grid of poster thumbnails, one entry per event. Click **+ Event** to add one, upload the poster, and the preview on the right shows the card exactly as on the site plus the pop-up visitors get when they click it. Pick the date in a calendar. An event becomes **Upcoming** (big featured card) automatically while its date is today or later, and moves to **Past events** the day after. Order doesn't matter: upcoming events are sorted soonest first, past events newest first. The hero TICKETS button uses the next upcoming event's ticket link unless one is set under Page text.
- **Artists**: name, photo, bio, cut-out flag. Drag to reorder. The preview shows the whole artists section.
- **Page text & contact**: the preview shows the hero (running the slideshow), Who we are and Contact. Fields: hero photos (2 or more turns on the slideshow), tagline, Who we are, contact intro, email, phone, address, socials.

Clicking **Publish** commits the change to the GitHub repo, and the host redeploys the site in about a minute. Every change is versioned in git, so anything can be rolled back.

### Testing the admin locally

```bash
npx decap-server                          # terminal 1: lets /admin write to the local files (port 8081)
node scripts/build-content.js --watch     # terminal 2: rebuilds content/events.json when events change
npx http-server -p 8080 -c-1              # terminal 3: serves the site
```

Open http://localhost:8080/admin/ and click Login (no password locally).

### Going live (one-time setup)

1. Push this folder to a GitHub repo and set `repo:` (and `site_url:`) in `admin/config.yml`.
2. Host on **Netlify** (free): import the repo, no build command, publish directory `/`.
3. Login: create a GitHub OAuth App (callback `https://api.netlify.com/auth/done`) and add its client ID and secret under Netlify, Site configuration, Access & security, OAuth, GitHub.
4. Give each owner a (free) GitHub account and add them as collaborators on the repo. They log in at `/admin` with "Login with GitHub".

## Page structure (top → bottom)

1. **Nav** (`.nav`) is `position: fixed` and stays visible the whole time. It has no hard edge: the background is a gradient from `rgba(10,10,10,.92)` to transparent. It holds the logo on the left and four links on the right (WHO WE ARE, ARTISTS, EVENTS, CONTACT), which smooth-scroll to their sections. Every section has `scroll-margin-top: 70px` so its heading isn't hidden behind the nav.
2. **Hero** (`.hero`) fills the full viewport height, with a minimum of 640px.
   - Background photo treatment: `grayscale(.3) brightness(1.15) contrast(1.05)`, a red `soft-light` tint at 40% opacity, and a radial vignette.
   - The bottom fades fully into `#0a0a0a`, so there is no seam with the next section.
   - In the center: the logo, the tagline (white text with a text shadow, on a soft dark radial glow for legibility) and two buttons. **WHO WE ARE** is a ghost button that scrolls to `#who`. **TICKETS** is red and links to Weeztix in a new tab.
   - With 2 or more hero photos, the hero crossfades every 6 s (1.2 s fade) and shows indicator dots. With 1 photo it stays static and hides the dots.
3. **Who we are** (`#who`): centered eyebrow, H2 "A movement, not just a party" and one paragraph. Max width 720px.
4. **Artists** (`#artists`): one row each for Krisko, Dessita and Andrea, alternating photo-left/text-right, then the reverse, then photo-left again.
   - **Scroll-linked reveal, reversible.** Each row's opacity goes from 0 to 1 and it slides 40px in from its photo side. Progress = `(1.1·vh − rowCenter) / (0.5·vh)`, clamped to 0–1. Scrolling back up reverses it.
   - The Krisko photo has a radial edge-fade mask so it blends into the black. This is **not** a true background removal. For a clean cut-out, upload a transparent PNG in /admin and tick the cut-out box.
   - Dessita and Andrea have no photos yet. Add them in /admin, under Artists.
5. **Events** (`#events`, background `#050505`)
   - **Upcoming:** large featured card (poster plus details, GET TICKETS and DETAILS buttons). Any event dated today or later appears here, decided automatically.
   - **Past events:** responsive grid (`minmax(300px, 1fr)`) of cards showing poster, tag, date, name and venue. Hover lifts the card 4px and turns the border red.
   - **Clicking any card opens the modal:** full poster (contain-fit, 70vh), tag, title, WHEN / WHERE / LINE-UP / HOSTED BY, description, GET TICKETS and VIEW ON FACEBOOK (each shown only if its link is set). Close with the × button, a click on the backdrop, or Esc. Page scroll is locked while it's open.
6. **Contact** (`#contact`): email, phone, address, Instagram and Facebook icons, and a form with name, email and message. The form is **not connected to anything yet**: it only shows "SENT!" for 2 s.
7. **Footer**: © 2026 on the left, "Breda & Eindhoven, Netherlands" on the right.

## Design tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0a` | page background |
| `--bg-alt` | `#050505` | Events and Contact sections |
| `--red` | `#e0333f` | accents, buttons, eyebrows, tags |
| `--red-hover` | `#ff4d57` | hover on red |
| `--ink-strong` | `#f7f5f4` | headings |
| `--ink` | `#f2f0ee` | default text |
| `--ink-body` | `#c9c6c4` | paragraphs |
| `--ink-muted` | `#9a9694` | secondary text |
| `--ink-faint` | `#6b6866` | footer, meta labels |
| `--nav-link` | `#cfcccb` | nav links |

**Fonts (Google Fonts)**
- **Bebas Neue** for headings and names. H2 is `clamp(36px,5vw,56px)` with 1px letter-spacing. Artist names are `clamp(40px,5vw,64px)`.
- **Inter** (400/500/600/700) for everything else.
  - Body text: 16px with line-height 1.7. The intro paragraph is 18px.
  - Eyebrows: 13px, weight 600, 3px letter-spacing, red.
  - Buttons: 14px, weight 600, 1.5px letter-spacing, 2px radius.

**Spacing and radii:** sections use 40–100px vertical padding. Containers are max 1200px (Events), 1100px (Artists), 960px (Contact) and 720px (Who we are). Card radius is 4px, button radius 2px.

## Real content and links

- Tickets (B.N.R, 11 Dec 2026): https://weeztix.shop/zadm76kb
- Facebook: https://www.facebook.com/profile.php?id=61557188572329
- Instagram: https://www.instagram.com/balkanmadnessparty
- Email: `balkanmadnesspartynetherlnads@gmail.com` (spelled "netherlnads", copied from the Facebook page; **check it is correct**)
- Phone: +31 6 35629553 · Address: Vismarktstraat 20, 4811 WE Breda
- The event data comes from the BalkanMadness Facebook page. The descriptions are short summaries written for the site.

## Open to-dos

- [ ] Wire up the contact form (Formspree, Netlify Forms, or a mailto fallback).
- [ ] Add photos for Dessita and Andrea, and replace Krisko's photo with a transparent-background cut-out (`cutout: true`).
- [ ] Add 2–3 more hero photos so the crossfade turns on.
- [ ] The B.N.R poster is a 3-tile Facebook image, so the card crops to the left tile (`pos: 'left center'`). Replace it with the original single poster if available.
- [ ] Mobile: the nav links shrink below 760px. A hamburger menu would be cleaner.
- [ ] SEO and social: add an Open Graph image, a favicon, and update `<title>`/`<meta description>` if needed.
- [ ] The poster and hero files are large; compress or convert them to WebP before going live.
