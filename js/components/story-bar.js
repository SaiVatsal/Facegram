import { store } from '../store.js';
import { escapeHTML, renderAvatar } from '../utils.js';

export function renderStoryBar() {
  const currentUser = store.getCurrentUser();
  const stories = store.getActiveStories();

  const storyItemsHTML = stories
    .map((story) => {
      const author = store.getUserById(story.userId);
      if (!author) return '';
      const isSeen =
        currentUser && Array.isArray(story.seenBy) && story.seenBy.includes(currentUser.id);

      return `
        <button
          type="button"
          class="story-item"
          data-action="view-story"
          data-story-id="${escapeHTML(story.id)}"
          aria-label="View story by ${escapeHTML(author.username)}"
        >
          <span class="story-ring ${isSeen ? 'seen' : ''}">
            <span class="story-ring-inner">
              ${renderAvatar(author, 'avatar-lg')}
            </span>
          </span>
          <span class="story-label">${escapeHTML(author.username)}</span>
        </button>
      `;
    })
    .join('');

  return `
    <section class="stories-bar" aria-label="Stories">
      <button
        type="button"
        class="story-item"
        data-action="open-create-story"
        aria-label="Add to your story"
      >
        <span class="story-ring seen">
          <span class="story-ring-inner">
            ${renderAvatar(currentUser, 'avatar-lg')}
          </span>
          <span class="story-add-badge">+</span>
        </span>
        <span class="story-label">+ Your Story</span>
      </button>

      ${storyItemsHTML}
    </section>
  `;
}
