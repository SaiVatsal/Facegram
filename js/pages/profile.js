import { store } from '../store.js';
import { escapeHTML, renderAvatar, ICON } from '../utils.js';

function renderProfileGrid(posts, emptyTitle, emptySubtitle) {
  if (posts.length === 0) {
    return `
      <div class="empty-state">
        <h3>${escapeHTML(emptyTitle)}</h3>
        <p>${escapeHTML(emptySubtitle)}</p>
      </div>
    `;
  }

  return `
    <div class="media-grid">
      ${posts
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
            )}" ${srcAttr} alt="${escapeHTML(post.caption || 'Profile post')}" loading="lazy" />`;
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
              aria-label="View post"
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
  `;
}

export function renderProfilePage(container, targetUsername) {
  const currentUser = store.getCurrentUser();
  const profileUser = store.getUserByUsername(targetUsername);

  if (!profileUser) {
    container.innerHTML = `
      <div class="page-container">
        <div class="empty-state">
          <h3>User Not Found</h3>
          <p>The profile @${escapeHTML(targetUsername)} does not exist.</p>
          <a href="#/feed" class="btn btn-primary">Back to Home</a>
        </div>
      </div>
    `;
    return;
  }

  const isOwnProfile = currentUser && currentUser.id === profileUser.id;
  const isFollowing = currentUser && store.isFollowing(currentUser.id, profileUser.id);
  const userPosts = store.getUserPosts(profileUser.id);
  const savedPosts = isOwnProfile ? store.getSavedPosts(profileUser.id) : [];
  const followersCount = store.getFollowerCount(profileUser.id);
  const followingCount = store.getFollowingCount(profileUser.id);

  const actionButtonsHTML = isOwnProfile
    ? `
      <button type="button" class="btn btn-secondary btn-sm" data-action="open-edit-profile">
        Edit Profile
      </button>
      <button type="button" class="btn btn-primary btn-sm" data-action="open-create-post">
        + New Post
      </button>
    `
    : `
      <button
        type="button"
        class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm"
        data-action="toggle-follow"
        data-user-id="${escapeHTML(profileUser.id)}"
      >
        ${isFollowing ? 'Following' : 'Follow'}
      </button>
      <a
        href="#/messages/${encodeURIComponent(profileUser.username)}"
        class="btn btn-secondary btn-sm"
      >
        Message
      </a>
    `;

  container.innerHTML = `
    <div class="page-container">
      <section class="profile-header-card" aria-label="Profile Header">
        ${renderAvatar(profileUser, 'avatar-xl')}
        <div class="profile-info-col">
          <div class="profile-top-row">
            <h1 class="profile-username">${escapeHTML(profileUser.username)}</h1>
            ${actionButtonsHTML}
          </div>

          <div class="profile-stats-row">
            <span><strong>${userPosts.length}</strong> posts</span>
            <span><strong>${followersCount}</strong> followers</span>
            <span><strong>${followingCount}</strong> following</span>
          </div>

          <div class="profile-bio-block">
            <div class="profile-display-name">${escapeHTML(profileUser.displayName)}</div>
            <p>${escapeHTML(profileUser.bio)}</p>
          </div>
        </div>
      </section>

      <div class="profile-tabs" role="tablist">
        <button
          type="button"
          class="profile-tab-btn active"
          data-action="switch-profile-tab"
          data-tab="posts"
        >
          ${ICON.grid}
          <span>Posts</span>
        </button>

        ${
          isOwnProfile
            ? `<button
                type="button"
                class="profile-tab-btn"
                data-action="switch-profile-tab"
                data-tab="saved"
              >
                ${ICON.bookmark}
                <span>Saved</span>
              </button>`
            : ''
        }
      </div>

      <section id="profile-posts-grid" aria-label="User Posts">
        ${renderProfileGrid(
          userPosts,
          'No Posts Shared Yet',
          isOwnProfile
            ? 'Photos, videos, and gradient cards you share will appear on your profile.'
            : `@${profileUser.username} hasn't shared any posts yet.`
        )}
      </section>

      ${
        isOwnProfile
          ? `<section id="profile-saved-grid" class="hidden" aria-label="Saved Posts">
              ${renderProfileGrid(
                savedPosts,
                'No Saved Posts',
                'Bookmark posts across the feed to revisit them privately here.'
              )}
            </section>`
          : ''
      }
    </div>
  `;
}
