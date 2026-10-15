import { store } from '../store.js';
import { escapeHTML, timeAgo, renderAvatar, REACTION_MAP } from '../utils.js';

export function renderNotificationsPage(container) {
  const notifications = store.getNotifications();
  const unreadCount = store.getUnreadNotificationCount();

  const itemsHTML =
    notifications.length > 0
      ? notifications
          .map((n) => {
            const actor = store.getUserById(n.actorId);
            if (!actor) return '';

            let actionText = 'interacted with your profile.';
            let targetHref = `#/profile/${encodeURIComponent(actor.username)}`;

            if (n.type === 'reaction') {
              const r = REACTION_MAP[n.reactionType] || REACTION_MAP.love;
              actionText = `reacted ${r.emoji} (${r.label}) to your post.`;
              if (n.postId) targetHref = `#/feed?post=${encodeURIComponent(n.postId)}`;
            } else if (n.type === 'comment') {
              actionText = `commented on your post.`;
              if (n.postId) targetHref = `#/feed?post=${encodeURIComponent(n.postId)}`;
            } else if (n.type === 'follow') {
              actionText = `started following you.`;
            }

            return `
              <div class="notif-item ${n.read ? '' : 'unread'}">
                <div class="notif-left">
                  ${n.read ? '' : '<span class="unread-dot" title="Unread"></span>'}
                  <a href="#/profile/${encodeURIComponent(actor.username)}">
                    ${renderAvatar(actor, 'avatar-sm')}
                  </a>
                  <div>
                    <a href="#/profile/${encodeURIComponent(actor.username)}" class="rail-username">
                      ${escapeHTML(actor.username)}
                    </a>
                    <span> ${escapeHTML(actionText)}</span>
                    <span class="comment-time">${escapeHTML(timeAgo(n.createdAt))}</span>
                  </div>
                </div>
                <a href="${escapeHTML(targetHref)}" class="btn btn-secondary btn-sm">
                  View
                </a>
              </div>
            `;
          })
          .join('')
      : `
        <div class="empty-state">
          <h3>All Caught Up</h3>
          <p>When someone reacts to your posts, leaves a comment, or follows you, you'll see it here.</p>
        </div>
      `;

  container.innerHTML = `
    <div class="notifications-card">
      <header class="notifications-header">
        <h2>Notifications ${unreadCount > 0 ? `(${unreadCount} new)` : ''}</h2>
        ${
          unreadCount > 0
            ? `<button
                type="button"
                class="btn btn-secondary btn-sm"
                data-action="mark-notifications-read"
              >Mark all as read</button>`
            : ''
        }
      </header>
      <div>
        ${itemsHTML}
      </div>
    </div>
  `;
}
