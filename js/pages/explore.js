import { store } from '../store.js';
import { escapeHTML, renderAvatar, ICON } from '../utils.js';
import { hydrateMedia } from '../db.js';

let currentSearchQuery = '';
let searchListenerAttached = false;

function renderExploreResultsMarkup(query) {
  const cleanQuery = (query || '').trim().toLowerCase();
  const matchingPosts = store.getExplorePosts(cleanQuery);
  const matchingUsers = cleanQuery
    ? store
        .getAllUsers()
        .filter(
          (u) =>
            u.username.toLowerCase().includes(cleanQuery) ||
            u.displayName.toLowerCase().includes(cleanQuery) ||
            (u.bio || '').toLowerCase().includes(cleanQuery)
        )
    : store.getAllUsers();

  const usersStripHTML =
    matchingUsers.length > 0
      ? `
        <div class="search-users-strip" aria-label="Matching Profiles">
          ${matchingUsers
            .map(
              (u) => `
                <a href="#/profile/${encodeURIComponent(u.username)}" class="search-user-pill">
                  ${renderAvatar(u, 'avatar-xs')}
                  <div>
                    <div class="rail-username">${escapeHTML(u.username)}</div>
                    <div class="rail-subtext">${escapeHTML(u.displayName)}</div>
                  </div>
                </a>
              `
            )
            .join('')}
        </div>
      `
      : '';

  const gridHTML =
    matchingPosts.length > 0
      ? `
        <div class="media-grid">
          ${matchingPosts
            .map((post) => {
              const summary = store.getReactionSummary(post.id);
              const commentsCount = store.getPostComments(post.id).length;

              let tileInner = '';
              if (post.mediaType === 'video' && post.mediaId) {
                tileInner = `<video data-media-id="${escapeHTML(
                  post.mediaId
                )}" muted playsinline preload="metadata"></video>`;
              } else if (post.mediaType === 'image' && post.mediaId) {
                const isDirect =
                  post.mediaId.startsWith('.') ||
                  post.mediaId.startsWith('/') ||
                  post.mediaId.startsWith('assets/');
                const directSrc = isDirect
                  ? post.mediaId
                  : post.mediaId === 'seed_media_sunrise'
                  ? './assets/mountain_sunrise.jpg'
                  : post.mediaId === 'seed_media_portrait'
                  ? './assets/fashion_portrait.jpg'
                  : '';
                const srcAttr = directSrc ? `src="${escapeHTML(directSrc)}"` : '';
                tileInner = `<img data-media-id="${escapeHTML(
                  post.mediaId
                )}" ${srcAttr} alt="${escapeHTML(post.caption || 'Explore post')}" loading="lazy" />`;
              } else {
                const grad = post.bgGradient || 'grad-ocean';
                tileInner = `<div class="grid-tile-text ${escapeHTML(
                  grad
                )}"><span>${escapeHTML(post.caption)}</span></div>`;
              }

              return `
                <button
                  type="button"
                  class="grid-tile"
                  data-action="open-post-detail"
                  data-post-id="${escapeHTML(post.id)}"
                  aria-label="Open post detail"
                >
                  ${tileInner}
                  <div class="grid-tile-overlay">
                    <span>❤️ ${summary.total}</span>
                    <span>💬 ${commentsCount}</span>
                  </div>
                </button>
              `;
            })
            .join('')}
        </div>
      `
      : `
        <div class="empty-state">
          <h3>No matching results</h3>
          <p>Try searching for another creator username or caption keyword.</p>
        </div>
      `;

  const allReels = store.getReels();
  const matchingReels = cleanQuery
    ? allReels.filter((r) => r.caption.toLowerCase().includes(cleanQuery))
    : allReels;

  const reelsStripHTML =
    matchingReels.length > 0
      ? `
        <section class="explore-reels-section" aria-label="Reels Explorer">
          <div class="explore-reels-header">
            <div class="explore-reels-title">
              <span class="explore-reels-icon">${ICON.reels}</span>
              <span>Trending Reels</span>
            </div>
            <a href="#/reels" class="btn btn-ghost btn-xs">Watch All &rarr;</a>
          </div>
          <div class="explore-reels-carousel">
            ${matchingReels.slice(0, 8).map((reel) => {
              const author = store.getUserById(reel.userId);
              return `
                <a href="#/reels/${encodeURIComponent(reel.id)}" class="explore-reel-card" title="Watch reel by @${escapeHTML(author ? author.username : 'creator')}">
                  <video src="${escapeHTML(reel.videoUrl)}" muted playsinline preload="metadata"></video>
                  <div class="explore-reel-card-overlay">
                    <span class="explore-reel-card-play">${ICON.play}</span>
                    <span class="explore-reel-card-views">${escapeHTML(reel.views || '120K')}</span>
                  </div>
                  <div class="explore-reel-card-bottom">
                    <span class="explore-reel-card-author">@${escapeHTML(author ? author.username : 'creator')}</span>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </section>
      `
      : '';

  return `
    ${usersStripHTML}
    ${reelsStripHTML}
    ${gridHTML}
  `;
}

export function renderExplorePage(container, query = {}) {
  if (query.q !== undefined) {
    currentSearchQuery = query.q;
  }

  container.innerHTML = `
    <div class="page-container">
      <header class="explore-header">
        <div class="search-bar-wrap">
          <span class="search-icon-pos">${ICON.search}</span>
          <input
            type="search"
            class="search-input"
            placeholder="Search creators, usernames, or captions..."
            value="${escapeHTML(currentSearchQuery)}"
            data-action="explore-search-input"
            aria-label="Search creators or captions"
          />
        </div>
      </header>

      <div id="explore-results-root">
        ${renderExploreResultsMarkup(currentSearchQuery)}
      </div>
    </div>
  `;

  if (!searchListenerAttached) {
    window.addEventListener('facegram:explore-search', async (e) => {
      currentSearchQuery = e.detail.query || '';
      const resultsRoot = document.getElementById('explore-results-root');
      if (resultsRoot) {
        resultsRoot.innerHTML = renderExploreResultsMarkup(currentSearchQuery);
        await hydrateMedia(resultsRoot);
      }
    });
    searchListenerAttached = true;
  }
}
