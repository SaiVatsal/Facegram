import { store } from '../store.js';
import { escapeHTML, timeAgo, renderAvatar, REACTIONS, REACTION_MAP, ICON } from '../utils.js';
import { renderCommentList } from './comment-list.js';

export function renderPostCard(post) {
  const currentUser = store.getCurrentUser();
  const author = store.getUserById(post.userId);
  if (!author) return '';

  const isOwnPost = currentUser && currentUser.id === post.userId;
  const userReactionType = currentUser ? store.getUserReaction(post.id, currentUser.id) : null;
  const userReactionObj = userReactionType ? REACTION_MAP[userReactionType] : null;
  const summary = store.getReactionSummary(post.id);
  const isSaved = store.isPostSaved(post.id);

  let mediaContentHTML = '';
  if (post.mediaType === 'video' && post.mediaId) {
    mediaContentHTML = `
      <video
        data-media-id="${escapeHTML(post.mediaId)}"
        controls
        playsinline
        preload="metadata"
      ></video>
    `;
  } else if (post.mediaType === 'image' && post.mediaId) {
    mediaContentHTML = `
      <img
        data-media-id="${escapeHTML(post.mediaId)}"
        alt="Post by ${escapeHTML(author.username)}"
        loading="lazy"
      />
    `;
  } else {
    const gradClass = post.bgGradient || 'grad-ocean';
    mediaContentHTML = `
      <div class="post-text-card ${escapeHTML(gradClass)}">
        <span>${escapeHTML(post.caption)}</span>
      </div>
    `;
  }

  const reactionChoicesHTML = REACTIONS.map(
    (r) => `
      <button
        type="button"
        class="reaction-choice-btn"
        data-action="pick-reaction"
        data-post-id="${escapeHTML(post.id)}"
        data-reaction="${escapeHTML(r.type)}"
        title="${escapeHTML(r.label)}"
        aria-label="React ${escapeHTML(r.label)}"
      >${r.emoji}</button>
    `
  ).join('');

  const topBadgesHTML = summary.topTypes
    .map((type) => {
      const r = REACTION_MAP[type];
      return r ? `<span class="reaction-badge-item">${r.emoji}</span>` : '';
    })
    .join('');

  return `
    <article class="post-card" id="post-${escapeHTML(post.id)}" data-post-id="${escapeHTML(post.id)}">
      <header class="post-header">
        <a href="#/profile/${encodeURIComponent(author.username)}" class="post-author">
          ${renderAvatar(author, 'avatar-sm')}
          <div class="post-author-info">
            <span class="post-author-name">${escapeHTML(author.username)}</span>
            <span class="post-timestamp">${escapeHTML(timeAgo(post.createdAt))}</span>
          </div>
        </a>

        ${
          isOwnPost
            ? `<button
                type="button"
                class="icon-btn"
                data-action="delete-post"
                data-post-id="${escapeHTML(post.id)}"
                title="Delete post"
                aria-label="Delete post"
              >${ICON.trash}</button>`
            : ''
        }
      </header>

      <div
        class="post-media-container"
        data-action="double-tap-media"
        data-post-id="${escapeHTML(post.id)}"
      >
        ${mediaContentHTML}
        <div class="double-tap-heart" aria-hidden="true">
          ${ICON.heartFilled}
        </div>
      </div>

      <div class="post-actions-bar">
        <div class="post-actions-left">
          <div class="reaction-trigger-wrap" data-post-id="${escapeHTML(post.id)}">
            <div class="reaction-popover" role="toolbar" aria-label="Choose a reaction">
              ${reactionChoicesHTML}
            </div>

            <button
              type="button"
              class="active-reaction-btn ${userReactionObj ? 'reacted' : ''}"
              data-action="toggle-default-reaction"
              data-post-id="${escapeHTML(post.id)}"
              aria-label="React to post"
            >
              ${
                userReactionObj
                  ? `<span class="reaction-emoji-inline">${userReactionObj.emoji}</span><span>${escapeHTML(userReactionObj.label)}</span>`
                  : `${ICON.heart}<span>React</span>`
              }
            </button>
          </div>

          <button
            type="button"
            class="icon-btn"
            data-action="focus-comment"
            data-post-id="${escapeHTML(post.id)}"
            aria-label="Comment on post"
          >
            ${ICON.comment}
          </button>

          <button
            type="button"
            class="icon-btn"
            data-action="share-post"
            data-post-id="${escapeHTML(post.id)}"
            aria-label="Share post link"
          >
            ${ICON.share}
          </button>
        </div>

        <button
          type="button"
          class="icon-btn"
          data-action="toggle-save"
          data-post-id="${escapeHTML(post.id)}"
          aria-label="${isSaved ? 'Remove from saved' : 'Save post'}"
        >
          ${isSaved ? ICON.bookmarkFilled : ICON.bookmark}
        </button>
      </div>

      ${
        summary.total > 0
          ? `<div class="post-reactions-summary">
              <span class="top-reaction-badges">${topBadgesHTML}</span>
              <span>${summary.total} ${summary.total === 1 ? 'reaction' : 'reactions'}</span>
            </div>`
          : ''
      }

      ${
        post.mediaType !== 'text' && post.caption
          ? `<div class="post-body">
              <div class="post-caption">
                <a href="#/profile/${encodeURIComponent(author.username)}" class="post-caption-author">${escapeHTML(author.username)}</a>
                <span>${escapeHTML(post.caption)}</span>
              </div>
            </div>`
          : ''
      }

      ${renderCommentList(post.id)}
    </article>
  `;
}
