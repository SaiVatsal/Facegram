import { store } from '../store.js';
import { escapeHTML, getLogoSVG, renderAvatar, ICON } from '../utils.js';

export function renderNavbar(container, activeRoute = '/feed') {
  const user = store.getCurrentUser();
  if (!user) {
    container.innerHTML = '';
    return;
  }

  const unreadCount = store.getUnreadNotificationCount();
  const theme = store.getTheme();
  const profileHref = `#/profile/${encodeURIComponent(user.username)}`;
  const isOwnProfile =
    activeRoute === '/profile' &&
    (!window.location.hash.split('/')[2] ||
      decodeURIComponent(window.location.hash.split('/')[2]) === user.username);

  const badgeHTML =
    unreadCount > 0 ? `<span class="nav-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>` : '';

  container.innerHTML = `
    <!-- Desktop Left Sidebar -->
    <nav class="sidebar-nav" aria-label="Primary Navigation">
      <div>
        <a href="#/feed" class="brand-link">
          ${getLogoSVG('logo-svg')}
          <span class="brand-title">Facegram</span>
        </a>

        <div class="nav-links">
          <a href="#/feed" class="nav-item ${activeRoute === '/feed' ? 'active' : ''}">
            <span class="nav-icon-wrap">${ICON.home}</span>
            <span>Home</span>
          </a>

          <a href="#/explore" class="nav-item ${activeRoute === '/explore' ? 'active' : ''}">
            <span class="nav-icon-wrap">${ICON.explore}</span>
            <span>Explore</span>
          </a>

          <a href="#/messages" class="nav-item ${activeRoute === '/messages' ? 'active' : ''}">
            <span class="nav-icon-wrap">${ICON.messages}</span>
            <span>Messages</span>
          </a>

          <a href="#/notifications" class="nav-item ${activeRoute === '/notifications' ? 'active' : ''}">
            <span class="nav-icon-wrap">
              ${ICON.heart}
              ${badgeHTML}
            </span>
            <span>Notifications</span>
          </a>

          <button type="button" class="nav-item" data-action="open-create-post">
            <span class="nav-icon-wrap">${ICON.plus}</span>
            <span>Create</span>
          </button>

          <a href="${escapeHTML(profileHref)}" class="nav-item ${isOwnProfile ? 'active' : ''}">
            ${renderAvatar(user, 'avatar-xs')}
            <span>Profile</span>
          </a>
        </div>
      </div>

      <div class="sidebar-footer">
        <button type="button" class="nav-item" data-action="toggle-theme">
          <span class="nav-icon-wrap">${theme === 'dark' ? ICON.sun : ICON.moon}</span>
          <span>${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button type="button" class="nav-item" data-action="logout">
          <span class="nav-icon-wrap">${ICON.logout}</span>
          <span>Log out (@${escapeHTML(user.username)})</span>
        </button>
      </div>
    </nav>

    <!-- Mobile Top Header -->
    <div class="mobile-header">
      <a href="#/feed" class="brand-link">
        ${getLogoSVG('logo-svg')}
        <span class="brand-title">Facegram</span>
      </a>

      <div class="mobile-header-actions">
        <button type="button" class="icon-btn" data-action="open-create-post" aria-label="Create Post">
          ${ICON.plus}
        </button>

        <a href="#/notifications" class="icon-btn" aria-label="Notifications">
          <span class="nav-icon-wrap">
            ${ICON.heart}
            ${badgeHTML}
          </span>
        </a>

        <button type="button" class="icon-btn" data-action="toggle-theme" aria-label="Toggle Theme">
          ${theme === 'dark' ? ICON.sun : ICON.moon}
        </button>

        <button type="button" class="icon-btn" data-action="logout" aria-label="Log Out">
          ${ICON.logout}
        </button>
      </div>
    </div>

    <!-- Mobile Bottom Tab Bar -->
    <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
      <a href="#/feed" class="icon-btn ${activeRoute === '/feed' ? 'active' : ''}" aria-label="Home">
        ${ICON.home}
      </a>

      <a href="#/explore" class="icon-btn ${activeRoute === '/explore' ? 'active' : ''}" aria-label="Explore">
        ${ICON.explore}
      </a>

      <button type="button" class="icon-btn" data-action="open-create-post" aria-label="Create">
        ${ICON.plus}
      </button>

      <a href="#/messages" class="icon-btn ${activeRoute === '/messages' ? 'active' : ''}" aria-label="Messages">
        ${ICON.messages}
      </a>

      <a href="${escapeHTML(profileHref)}" class="icon-btn ${isOwnProfile ? 'active' : ''}" aria-label="Profile">
        ${renderAvatar(user, 'avatar-xs')}
      </a>
    </nav>
  `;
}
