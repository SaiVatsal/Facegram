import { store } from '../store.js';
import { escapeHTML, renderAvatar } from '../utils.js';
import { renderStoryBar } from '../components/story-bar.js';
import { renderPostCard } from '../components/post-card.js';
import { openPostDetailModal } from '../components/modal.js';

export function renderFeedPage(container, query = {}) {
  const currentUser = store.getCurrentUser();
  if (!currentUser) return;

  const posts = store.getFeedPosts();
  const suggestedUsers = store.getSuggestedUsers().slice(0, 5);

  const postsHTML =
    posts.length > 0
      ? posts.map((post) => renderPostCard(post)).join('')
      : `
        <div class="empty-state">
          <h3>No Posts Yet</h3>
          <p>Share your first photo, video, or gradient text card to get the feed started.</p>
          <button type="button" class="btn btn-primary" data-action="open-create-post">
            Create First Post
          </button>
        </div>
      `;

  const suggestionsHTML = suggestedUsers
    .map((u) => {
      const following = store.isFollowing(currentUser.id, u.id);
      return `
        <div class="suggestion-item">
          <a href="#/profile/${encodeURIComponent(u.username)}" class="rail-user-meta">
            ${renderAvatar(u, 'avatar-sm')}
            <div class="rail-user-text">
              <span class="rail-username">${escapeHTML(u.username)}</span>
              <span class="rail-subtext">${escapeHTML(u.displayName)}</span>
            </div>
          </a>
          <button
            type="button"
            class="btn ${following ? 'btn-secondary' : 'btn-ghost'} btn-sm"
            data-action="toggle-follow"
            data-user-id="${escapeHTML(u.id)}"
          >
            ${following ? 'Following' : 'Follow'}
          </button>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="feed-layout">
      <div class="feed-column">
        ${renderStoryBar()}

        <div class="composer-trigger-card">
          ${renderAvatar(currentUser, 'avatar-sm')}
          <button
            type="button"
            class="composer-prompt-btn"
            data-action="open-create-post"
          >
            What's on your mind, ${escapeHTML(currentUser.displayName.split(' ')[0])}? Share a photo or status...
          </button>
        </div>

        ${postsHTML}
      </div>

      <aside class="right-rail" aria-label="Account and Suggestions">
        <div class="rail-profile-row">
          <a href="#/profile/${encodeURIComponent(currentUser.username)}" class="rail-user-meta">
            ${renderAvatar(currentUser, 'avatar-md')}
            <div class="rail-user-text">
              <span class="rail-username">${escapeHTML(currentUser.username)}</span>
              <span class="rail-subtext">${escapeHTML(currentUser.displayName)}</span>
            </div>
          </a>
          <button type="button" class="btn btn-ghost btn-sm" data-action="logout">
            Switch
          </button>
        </div>

        <div>
          <div class="rail-section-header">
            <span>Suggested for you</span>
            <a href="#/explore">See All</a>
          </div>
          <div class="suggestions-list">
            ${suggestionsHTML}
          </div>
        </div>

        <footer class="rail-footer">
          <p>Facegram &bull; 100% Client-Side Vanilla ES Modules</p>
          <p>Stored locally via IndexedDB &amp; localStorage.</p>
        </footer>
      </aside>
    </div>
  `;

  if (query.post) {
    const targetCard = document.getElementById(`post-${query.post}`);
    if (targetCard) {
      setTimeout(() => {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    } else if (store.getPostById(query.post)) {
      openPostDetailModal(query.post);
    }
  }
}
