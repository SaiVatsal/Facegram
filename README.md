# Facegram

**Facegram** is a simple social media web app inspired by Instagram and Facebook. It has a clean Instagram-like interface along with some useful Facebook features like 6 emoji reactions, gradient text posts and quick demo account switching.

The project is made using **HTML, CSS and Vanilla JavaScript (ES Modules)**. There are no frameworks, npm packages, backend servers or external image and icon libraries used. Everything works directly in the browser.

---

## Features

- **Login and Signup:** Users can create an account, login and logout. There are also 6 demo accounts which can be switched instantly for testing. Passwords are hashed using Web Crypto `SubtleCrypto` with SHA-256, and a basic JavaScript fallback is included for non-HTTPS environments.

- **Posts and Stories:**
  - Stories are displayed at the top with gradient rings for unseen stories.
  - A fullscreen story viewer is available with a timer and animated progress bar.
  - Users can upload image stories or create text stories with gradient backgrounds.
  - Posts can contain photos, videos or gradient text cards.
  - Images are automatically compressed to a maximum size of 1080px and saved as JPEG with 0.8 quality.
  - Videos larger than 15 MB are not allowed.

- **Post Reactions and Comments:**
  - Double-click or double-tap a post image to show an animated heart effect.
  - Hover over or long-press the React button to open the Facebook-style emoji reaction menu.
  - The available reactions are ❤️ 👍 😂 😮 😢 😡.
  - Users can add and delete comments, save posts and delete their own posts.
  - Posts can also be shared using a direct link.

- **User Profiles:** Each profile displays the username, bio, followers, following and posts. Users can use preset SVG avatars or upload their own photos. There is also a Posts and Saved tab.

- **Explore Page:** Users can search for other accounts and posts. The search checks usernames, display names, bios and post captions.

- **Notifications:** The notification page displays reactions, comments and new followers. Notifications can be marked as read or unread.

- **Direct Messages:** Users can send text messages and image attachments. Demo users can send automatic replies after around 1.5 seconds. This is only a simulation, not a real online messaging service.

- **Light and Dark Mode:** Users can switch between light and dark themes. The selected theme is saved in `localStorage`, so it remains selected when the page is opened again.

---

## Project Structure

The project files are arranged into seperate folders to make the code easier to manage and update.

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

## How to Run the Project

Since Facegram uses JavaScript ES Modules, opening `index.html` directly with `file://` may cause errors in some browsers. It is better to run the project using a local server.

### Method 1: Using Python

If Python is already installed on your computer, open the terminal inside the project folder and run:

```bash
python -m http.server 8080
```

Now open this address in your browser:

http://localhost:8080

### Method 2: Using Node.js

If Node.js is installed, run:

```bash
npx serve .
```

Follow the local URL shown in the terminal.

### Method 3: Using VS Code

1. Open the Facegram folder in VS Code.
2. Install the Live Server extension if you don't have it.
3. Right-click on `index.html`.
4. Select **Open with Live Server**.

Thats it, the application should open in your browser.

---

## Deployment

Facegram is a static web application, so it can be hosted without setting up a backend server or build process.

### Deploy on Vercel

1. Upload the project to a GitHub, GitLab or Bitbucket repository.
2. Open [Vercel](https://vercel.com/new) and import the repository.
3. Select **Other** as the framework preset.
4. Leave the build command empty and use the project root as the output directory.
5. Click Deploy.

The app uses hash-based routing, such as `#/feed` and `#/explore`, so refreshing these pages doesn't require seperate server routes.

### Deploy on GitHub Pages

1. Push the project files to your GitHub repository.
2. Open the repository settings.
3. Go to **Pages**.
4. Select **Deploy from a branch**.
5. Choose the `main` branch and the root folder.
6. Save the settings and wait for deployment.

The CSS and JavaScript files use relative paths, which allows the app to work from a repository subpath too.

---

## Browser Storage

Facegram stores its information locally in the browser instead of using a database server.

### LocalStorage

The `js/store.js` file manages basic application data, including:

- User accounts and current login session
- Posts and post information
- Reactions and comments
- Followers and following
- Saved posts
- Stories and messages
- Notifications and theme settings

LocalStorage is mainly used for small text-based data. Its available storage space is limited and depends on the browser.

### IndexedDB

The `js/db.js` file handles image and video files. Media is stored as `Blob` data using a unique `mediaId`.

Images are resized to a maximum dimension of 1080px and converted into JPEG format at 0.8 quality before saving. Videos above 15 MB are rejected with a notification.

### Storage Errors and Private Browsing

Storage operations use `try/catch` to handle errors. If the browser runs out of storage space, a warning banner is displayed to inform the user.

In private browsing mode, some browsers may clear stored data when the private window is closed. So this project is mainly designed for demo purposes and local testing.

---

## Important Note

Facegram is a client-side demo project. The data is stored in the user's browser, so accounts, posts and messages are not synced between different devices or users.

Password hashing is included as part of the demo, but it does not make client-side authentication secure for a production application. A real social media platform would need a backend, proper authentication, access control and server-side data storage.
