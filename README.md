# Facegram

**Facegram** is a zero-dependency, 100% client-side social media web application combining Instagram's clean layout and visual aesthetic with expressive Facebook features (6-emoji reaction popovers, gradient text-card posts, and instant demo account switching).

Built strictly with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES Modules)**—no frameworks, no npm packages, no build step, no backend server, and no external images or icon libraries.

---

## Features

- **Authentication & Instant Demo Switch**: Sign up, log in, log out, or switch between 6 pre-seeded demo accounts in a single click. Passwords are hashed via Web Crypto `SubtleCrypto` (`SHA-256`) with a deterministic pure-JS fallback for non-HTTPS contexts.
- **Rich Feed & Stories**:
  - Top stories bar with unseen gradient rings, fullscreen timed story viewer with animated progress bar, and a **+ Your Story** uploader (supports images or gradient text stories).
  - Create Post modal supporting **Photo** (auto-compressed via `<canvas>` to max 1080px JPEG at `0.8` quality), **Video** (validated up to 15 MB), or **Facebook-style Gradient Text Cards**.
- **Expressive Interactions**:
  - Double-tap or double-click any post media for an animated heart burst overlay.
  - Hover or long-press the React button to open the Facebook-style reaction popover (`❤️ 👍 😂 😮 😢 😡`), updating live reaction counts and top reaction badges.
  - Add and delete comments, bookmark/save posts, copy direct post share links (`#/feed?post=ID`), and delete your own posts.
- **Profiles, Explore, Notifications & Direct Messages**:
  - User profiles with follower/following counts, bio, preset SVG or custom photo avatars, and a **Posts / Saved** tab toggle.
  - **Explore** grid with live search across usernames, display names, bios, and post captions.
  - **Notifications** center tracking reactions, comments, and new followers with read/unread states.
  - **Direct Messages (`#/messages`)** supporting text and image attachments, plus simulated 1.5-second auto-replies from demo users.
- **Light & Dark Mode**: Persisted in `localStorage` using CSS custom properties (`:root` and `[data-theme="dark"]`).

---

## Project Structure

```text
.
├── index.html
├── assets/
│   └── logo.svg
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── router.js
│   ├── store.js
│   ├── db.js
│   ├── utils.js
│   ├── components/
│   │   ├── navbar.js
│   │   ├── story-bar.js
│   │   ├── post-card.js
│   │   ├── comment-list.js
│   │   └── modal.js
│   └── pages/
│       ├── auth.js
│       ├── feed.js
│       ├── explore.js
│       ├── profile.js
│       ├── messages.js
│       └── notifications.js
└── README.md
```

---

## Running Locally

Because Facegram uses native ES Modules (`<script type="module" src="./js/main.js">`), browsers require serving the files over `http://` or `https://` rather than `file://` to satisfy CORS rules for module imports.

Run any static file server from the project root:

### Option 1: Python (Built-in)
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js (npx serve)
```bash
npx serve .
```

### Option 3: VS Code Live Server
Right-click `index.html` in VS Code and select **Open with Live Server**.

---

## Zero-Config Deployment

### Deploying to Vercel
1. Push this repository to GitHub, GitLab, or Bitbucket (or run `npx vercel` from the directory).
2. Import the repository into [Vercel](https://vercel.com/new).
3. Leave **Framework Preset** as **Other**, **Build Command** empty, and **Output Directory** as default (`.`).
4. Click **Deploy**. Hash-based routing (`#/feed`, `#/explore`, etc.) ensures refreshes never 404.

### Deploying to GitHub Pages
1. Push the files to your GitHub repository.
2. Go to **Settings** -> **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, pick `main` (or `master`) and `/ (root)`, and click **Save**.
4. Because all asset and module paths are strictly relative (`./css/styles.css`, `./js/main.js`), Facegram works automatically on subpath URLs like `https://<username>.github.io/<repo-name>/`.

---

## Browser Storage Architecture & Limitations

- **localStorage (`js/store.js`)**: Stores lightweight JSON metadata (users, session state, posts metadata, reactions, comments, follows, bookmarks, stories metadata, DMs, notifications, and theme preference). Browsers typically cap `localStorage` at 5 MB per origin.
- **IndexedDB (`js/db.js`)**: Stores binary image and video `Blob`s keyed by `mediaId`. Images are automatically downscaled to a maximum dimension of 1080px and encoded as `image/jpeg` (0.8 quality) via `<canvas>` before storage. Videos larger than 15 MB are rejected with a toast notification.
- **Quota Handling & Private Browsing**: All storage reads and writes are wrapped in `try/catch`. If `QuotaExceededError` is triggered, a persistent warning banner appears at the top of the viewport. Note that in some strict incognito/private browsing modes, IndexedDB or localStorage may be cleared when the window closes.
