import { store } from '../store.js';
import { escapeHTML, timeAgo, renderAvatar, ICON } from '../utils.js';

export function renderMessagesPage(container, activeUsername = null) {
  const currentUser = store.getCurrentUser();
  if (!currentUser) return;

  const otherUsers = store.getAllUsers().filter((u) => u.id !== currentUser.id);
  let activePartner = activeUsername ? store.getUserByUsername(activeUsername) : otherUsers[0] || null;

  if (activePartner && activePartner.id === currentUser.id) {
    activePartner = otherUsers[0] || null;
  }

  const threadsHTML = otherUsers
    .map((u) => {
      const msgs = store.getMessagesWithUser(u.id);
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      const snippet = lastMsg
        ? lastMsg.mediaId
          ? '📷 Sent a photo'
          : lastMsg.text
        : `Start a chat with @${u.username}`;

      const isSelected = activePartner && activePartner.id === u.id;

      return `
        <button
          type="button"
          class="thread-item ${isSelected ? 'active' : ''}"
          data-action="select-dm-thread"
          data-username="${escapeHTML(u.username)}"
        >
          ${renderAvatar(u, 'avatar-md')}
          <div class="rail-user-text">
            <span class="rail-username">${escapeHTML(u.displayName)}</span>
            <span class="rail-subtext">${escapeHTML(snippet)}</span>
          </div>
        </button>
      `;
    })
    .join('');

  let chatColumnHTML = '';

  if (activePartner) {
    const messages = store.getMessagesWithUser(activePartner.id);

    const messagesListHTML =
      messages.length > 0
        ? messages
            .map((m) => {
              const isOutgoing = m.senderId === currentUser.id;
              return `
                <div class="msg-row ${isOutgoing ? 'outgoing' : 'incoming'}">
                  ${
                    m.mediaId
                      ? `<div class="msg-media"><img data-media-id="${escapeHTML(
                          m.mediaId
                        )}" alt="Direct message attachment" /></div>`
                      : ''
                  }
                  ${m.text ? `<div class="msg-bubble">${escapeHTML(m.text)}</div>` : ''}
                  <span class="msg-time">${escapeHTML(timeAgo(m.createdAt))}</span>
                </div>
              `;
            })
            .join('')
        : `
          <div class="empty-state">
            <h3>Say hello to ${escapeHTML(activePartner.displayName)}</h3>
            <p>Send a message or image below. AI persona replies like a human in real time!</p>
          </div>
        `;

    chatColumnHTML = `
      <div class="chat-header">
        <div class="rail-user-meta">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            data-action="back-to-threads"
          >Back</button>
          <a href="#/profile/${encodeURIComponent(activePartner.username)}" class="rail-user-meta">
            ${renderAvatar(activePartner, 'avatar-sm')}
            <div class="rail-user-text">
              <span class="rail-username">${escapeHTML(activePartner.displayName)}</span>
              <span class="rail-subtext">@${escapeHTML(activePartner.username)}</span>
            </div>
          </a>
        </div>
        <a
          href="#/profile/${encodeURIComponent(activePartner.username)}"
          class="btn btn-ghost btn-sm"
        >View Profile</a>
      </div>

      <div class="chat-messages-area" id="chat-messages-scroll">
        ${messagesListHTML}
      </div>

      <form
        class="chat-composer"
        data-action="send-dm-form"
        data-receiver-id="${escapeHTML(activePartner.id)}"
      >
        <button
          type="button"
          class="icon-btn"
          data-action="trigger-dm-image"
          title="Send Image"
          aria-label="Send Image"
        >
          ${ICON.image}
        </button>
        <input
          type="file"
          id="dm-image-input"
          class="hidden"
          accept="image/*"
          data-action="send-dm-image"
          data-receiver-id="${escapeHTML(activePartner.id)}"
        />

        <input
          type="text"
          name="message"
          class="form-input"
          placeholder="Message @${escapeHTML(activePartner.username)}..."
          maxlength="400"
          autocomplete="off"
          aria-label="Message input"
        />
        <button type="submit" class="btn btn-primary">Send</button>
      </form>
    `;
  } else {
    chatColumnHTML = `
      <div class="empty-state">
        <h3>Your Messages</h3>
        <p>Select a user on the left to start chatting.</p>
      </div>
    `;
  }

  const mobileChatActiveClass = activeUsername ? 'chat-active' : '';

  container.innerHTML = `
    <div class="messages-shell ${mobileChatActiveClass}">
      <aside class="threads-list-col" aria-label="Direct Message Threads">
        <div class="threads-header">
          <span>Messages (@${escapeHTML(currentUser.username)})</span>
        </div>
        <div class="threads-scroll">
          ${threadsHTML}
        </div>
      </aside>

      <section class="chat-col" aria-label="Active Conversation">
        ${chatColumnHTML}
      </section>
    </div>
  `;

  const scrollBox = document.getElementById('chat-messages-scroll');
  if (scrollBox) {
    scrollBox.scrollTop = scrollBox.scrollHeight;
  }
}
