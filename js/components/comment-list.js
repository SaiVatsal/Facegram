import { store } from '../store.js';
import { escapeHTML, timeAgo } from '../utils.js';

export function renderCommentList(postId) {
  const currentUser = store.getCurrentUser();
  const comments = store.getPostComments(postId);

  const itemsHTML = comments
    .map((comment) => {
      const author = store.getUserById(comment.userId);
      const username = author ? author.username : 'unknown';
      const canDelete = currentUser && comment.userId === currentUser.id;

      return `
        <div class="comment-row" data-comment-id="${escapeHTML(comment.id)}">
          <div class="comment-content">
            <a href="#/profile/${encodeURIComponent(username)}" class="comment-author">${escapeHTML(username)}</a>
            <span>${escapeHTML(comment.text)}</span>
            <span class="comment-time">${escapeHTML(timeAgo(comment.createdAt))}</span>
          </div>
          ${
            canDelete
              ? `<button
                  type="button"
                  class="comment-delete-btn"
                  data-action="delete-comment"
                  data-comment-id="${escapeHTML(comment.id)}"
                  aria-label="Delete comment"
                >Delete</button>`
              : ''
          }
        </div>
      `;
    })
    .join('');

  return `
    <div class="comments-section">
      ${comments.length > 0 ? `<div class="comments-list">${itemsHTML}</div>` : ''}

      <form class="comment-form" data-action="submit-comment" data-post-id="${escapeHTML(postId)}">
        <input
          type="text"
          name="comment"
          class="comment-input"
          placeholder="Add a comment..."
          maxlength="280"
          autocomplete="off"
          aria-label="Add a comment"
        />
        <button type="submit" class="comment-submit-btn">Post</button>
      </form>
    </div>
  `;
}
