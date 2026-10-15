import { store } from './store.js';
import { hydrateMedia } from './db.js';
import { renderNavbar } from './components/navbar.js';
import { renderAuthPage } from './pages/auth.js';
import { renderFeedPage } from './pages/feed.js';
import { renderExplorePage } from './pages/explore.js';
import { renderProfilePage } from './pages/profile.js';
import { renderMessagesPage } from './pages/messages.js';
import { renderNotificationsPage } from './pages/notifications.js';
import { renderReelsPage } from './pages/reels.js';

class Router {
  constructor() {
    this.currentPath = '/feed';
    this.currentParams = {};
    this.currentQuery = {};
    this.isRendering = false;
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouteChange());
    if (!window.location.hash || window.location.hash === '#') {
      const user = store.getCurrentUser();
      window.location.hash = user ? '#/feed' : '#/login';
    } else {
      this.handleRouteChange();
    }
  }

  navigate(hash) {
    const normalized = hash.startsWith('#') ? hash : `#${hash}`;
    if (window.location.hash === normalized) {
      this.handleRouteChange();
    } else {
      window.location.hash = normalized;
    }
  }

  parseHash(rawHash) {
    const clean = (rawHash || '#/feed').replace(/^#/, '') || '/feed';
    const [pathPart, queryString] = clean.split('?');
    const query = {};

    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => {
        query[key] = val;
      });
    }

    const segments = pathPart.split('/').filter(Boolean);
    let route = '/feed';
    const params = {};

    if (segments[0] === 'login') {
      route = '/login';
    } else if (segments[0] === 'feed' || segments.length === 0) {
      route = '/feed';
    } else if (segments[0] === 'explore') {
      route = '/explore';
    } else if (segments[0] === 'reels') {
      route = '/reels';
      if (segments[1]) params.reelId = decodeURIComponent(segments[1]);
    } else if (segments[0] === 'messages') {
      route = '/messages';
      if (segments[1]) params.username = decodeURIComponent(segments[1]);
    } else if (segments[0] === 'notifications') {
      route = '/notifications';
    } else if (segments[0] === 'profile') {
      route = '/profile';
      params.username = segments[1] ? decodeURIComponent(segments[1]) : '';
    } else {
      route = '/feed';
    }

    return { route, params, query };
  }

  renderSkeleton(mainEl) {
    mainEl.innerHTML = `
      <div class="feed-column">
        <div class="skeleton-box skeleton-card"></div>
        <div class="skeleton-box skeleton-card"></div>
      </div>
    `;
  }

  async handleRouteChange(preserveScroll = false) {
    if (this.isRendering) return;
    this.isRendering = true;

    try {
      const { route, params, query } = this.parseHash(window.location.hash);
      const currentUser = store.getCurrentUser();

      if (!currentUser && route !== '/login') {
        this.isRendering = false;
        this.navigate('#/login');
        return;
      }

      if (currentUser && route === '/login') {
        this.isRendering = false;
        this.navigate('#/feed');
        return;
      }

      const routeChanged = this.currentPath !== route;
      this.currentPath = route;
      this.currentParams = params;
      this.currentQuery = query;

      const navRoot = document.getElementById('nav-root');
      const mainRoot = document.getElementById('main-root');
      if (!mainRoot || !navRoot) return;

      const prevScroll = window.scrollY;

      if (route === '/login') {
        navRoot.innerHTML = '';
        mainRoot.classList.add('auth-mode');
        renderAuthPage(mainRoot);
        await hydrateMedia(mainRoot);
        return;
      }

      mainRoot.classList.remove('auth-mode');
      renderNavbar(navRoot, route);

      if (routeChanged && !preserveScroll) {
        this.renderSkeleton(mainRoot);
      }

      if (route === '/feed') {
        renderFeedPage(mainRoot, query);
      } else if (route === '/explore') {
        renderExplorePage(mainRoot, query);
      } else if (route === '/reels') {
        renderReelsPage(mainRoot, params.reelId || null);
      } else if (route === '/profile') {
        const targetUsername = params.username || currentUser.username;
        renderProfilePage(mainRoot, targetUsername);
      } else if (route === '/messages') {
        renderMessagesPage(mainRoot, params.username || query.user || null);
      } else if (route === '/notifications') {
        renderNotificationsPage(mainRoot);
      }

      await hydrateMedia(document);

      if (preserveScroll) {
        window.scrollTo(0, prevScroll);
      } else if (routeChanged) {
        window.scrollTo(0, 0);
      }
    } finally {
      this.isRendering = false;
    }
  }

  refreshView() {
    this.handleRouteChange(true);
  }
}

export const router = new Router();
