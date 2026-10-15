import { initDB, validateAndStoreMedia, hydrateMedia } from './db.js';
import { store } from './store.js';
import { router } from './router.js';
import { showToast } from './utils.js';
import {
  closeModal,
  openCreatePostModal,
  openCreateStoryModal,
  openStoryViewerModal,
  openEditProfileModal,
  openPostDetailModal,
  handleModalFileChange,
  switchModalPostMode,
  selectModalGradient,
  updateLiveTextCardPreview,
  selectModalAvatarPreset,
  submitCreatePostForm,
  submitCreateStoryForm,
  submitEditProfileForm
} from './components/modal.js';

let lastTapTime = 0;
let longPressTimer = null;

function triggerHeartOverlay(mediaContainer, postId) {
  const heart = mediaContainer.querySelector('.double-tap-heart');
  if (heart) {
    heart.classList.remove('animate');
    void heart.offsetWidth;
    heart.classList.add('animate');
  }
  store.setReaction(postId, 'love', true);
}

async function copyShareLink(postId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}#/feed?post=${encodeURIComponent(
    postId
  )}`;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const temp = document.createElement('input');
      temp.value = shareUrl;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    showToast('Post link copied to clipboard!');
  } catch (_) {
    showToast(`Share link: #/feed?post=${postId}`);
  }
}

function setupGlobalEvents() {
  // Delegated Click Handler
  document.addEventListener('click', async (event) => {
    const actionEl = event.target.closest('[data-action]');

    // Close any open reaction popovers when clicking outside
    if (!event.target.closest('.reaction-trigger-wrap')) {
      document.querySelectorAll('.reaction-popover.open').forEach((el) => {
        el.classList.remove('open');
      });
    }

    if (!actionEl) return;
    const action = actionEl.dataset.action;

    if (action === 'dismiss-storage-banner') {
      const banner = document.getElementById('storage-error-banner');
      if (banner) banner.classList.add('hidden');
      return;
    }

    if (action === 'backdrop-close' && event.target === actionEl) {
      closeModal();
      return;
    }

    if (action === 'close-modal') {
      closeModal();
      return;
    }

    if (action === 'toggle-theme') {
      store.toggleTheme();
      return;
    }

    if (action === 'logout') {
      closeModal();
      store.logout();
      router.navigate('#/login');
      showToast('Logged out.');
      return;
    }

    if (action === 'quick-switch-user') {
      const userId = actionEl.dataset.userId;
      const switched = store.quickSwitchUser(userId);
      if (switched) {
        showToast(`Switched to @${switched.username}`);
        router.navigate('#/feed');
      }
      return;
    }

    if (action === 'switch-auth-tab') {
      const mode = actionEl.dataset.tab;
      const loginPane = document.getElementById('auth-login-pane');
      const signupPane = document.getElementById('auth-signup-pane');
      document.querySelectorAll('[data-action="switch-auth-tab"]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === mode);
      });
      if (loginPane && signupPane) {
        loginPane.classList.toggle('hidden', mode !== 'login');
        signupPane.classList.toggle('hidden', mode !== 'signup');
      }
      return;
    }

    if (action === 'open-create-post') {
      openCreatePostModal();
      return;
    }

    if (action === 'open-create-story') {
      openCreateStoryModal();
      return;
    }

    if (action === 'view-story') {
      openStoryViewerModal(actionEl.dataset.storyId);
      return;
    }

    if (action === 'open-edit-profile') {
      openEditProfileModal();
      return;
    }

    if (action === 'open-post-detail') {
      openPostDetailModal(actionEl.dataset.postId);
      return;
    }

    if (action === 'switch-post-mode') {
      switchModalPostMode(actionEl.dataset.mode);
      return;
    }

    if (action === 'select-gradient') {
      selectModalGradient(actionEl.dataset.gradient);
      return;
    }

    if (action === 'select-preset-avatar') {
      selectModalAvatarPreset(actionEl.dataset.preset);
      return;
    }

    if (action === 'pick-reaction') {
      const { postId, reaction } = actionEl.dataset;
      store.setReaction(postId, reaction, true);
      const pop = actionEl.closest('.reaction-popover');
      if (pop) pop.classList.remove('open');
      return;
    }

    if (action === 'toggle-default-reaction') {
      const { postId } = actionEl.dataset;
      const current = store.getCurrentUser();
      const existing = current ? store.getUserReaction(postId, current.id) : null;
      store.setReaction(postId, existing || 'love', false);
      return;
    }

    if (action === 'focus-comment') {
      const postId = actionEl.dataset.postId;
      const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      if (card) {
        const input = card.querySelector('.comment-input');
        if (input) input.focus();
      }
      return;
    }

    if (action === 'share-post') {
      await copyShareLink(actionEl.dataset.postId);
      return;
    }

    if (action === 'toggle-save') {
      const saved = store.toggleSavePost(actionEl.dataset.postId);
      showToast(saved ? 'Saved to bookmarks.' : 'Removed from bookmarks.');
      return;
    }

    if (action === 'delete-post') {
      await store.deletePost(actionEl.dataset.postId);
      closeModal();
      showToast('Post deleted.');
      return;
    }

    if (action === 'delete-comment') {
      store.deleteComment(actionEl.dataset.commentId);
      return;
    }

    if (action === 'toggle-follow') {
      store.toggleFollow(actionEl.dataset.userId);
      return;
    }

    if (action === 'switch-profile-tab') {
      const tab = actionEl.dataset.tab;
      const postsGrid = document.getElementById('profile-posts-grid');
      const savedGrid = document.getElementById('profile-saved-grid');
      document.querySelectorAll('[data-action="switch-profile-tab"]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
      if (postsGrid && savedGrid) {
        postsGrid.classList.toggle('hidden', tab !== 'posts');
        savedGrid.classList.toggle('hidden', tab !== 'saved');
      }
      return;
    }

    if (action === 'select-dm-thread') {
      const username = actionEl.dataset.username;
      router.navigate(`#/messages/${encodeURIComponent(username)}`);
      return;
    }

    if (action === 'back-to-threads') {
      const shell = document.querySelector('.messages-shell');
      if (shell) shell.classList.remove('chat-active');
      return;
    }

    if (action === 'trigger-dm-image') {
      const fileInput = document.getElementById('dm-image-input');
      if (fileInput) fileInput.click();
      return;
    }

    if (action === 'mark-notifications-read') {
      store.markAllNotificationsRead();
      showToast('All notifications marked as read.');
    }
  });

  // Double-click on desktop for animated heart overlay
  document.addEventListener('dblclick', (event) => {
    const mediaEl = event.target.closest('[data-action="double-tap-media"]');
    if (!mediaEl) return;
    triggerHeartOverlay(mediaEl, mediaEl.dataset.postId);
  });

  // Mobile double-tap & long-press reaction popover support
  document.addEventListener(
    'touchstart',
    (event) => {
      const mediaEl = event.target.closest('[data-action="double-tap-media"]');
      if (mediaEl) {
        const now = Date.now();
        if (now - lastTapTime < 300) {
          event.preventDefault();
          triggerHeartOverlay(mediaEl, mediaEl.dataset.postId);
        }
        lastTapTime = now;
      }

      const reactBtn = event.target.closest('[data-action="toggle-default-reaction"]');
      if (reactBtn) {
        longPressTimer = setTimeout(() => {
          const wrap = reactBtn.closest('.reaction-trigger-wrap');
          const pop = wrap && wrap.querySelector('.reaction-popover');
          if (pop) pop.classList.add('open');
        }, 420);
      }
    },
    { passive: false }
  );

  document.addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  // Delegated Input & File Change Handler
  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.dataset.action === 'live-caption-input') {
      updateLiveTextCardPreview(target.value);
    } else if (target.dataset.action === 'explore-search-input') {
      const eventCustom = new CustomEvent('facegram:explore-search', {
        detail: { query: target.value }
      });
      window.dispatchEvent(eventCustom);
    }
  });

  document.addEventListener('change', async (event) => {
    const target = event.target;
    if (target.dataset.action === 'handle-modal-file') {
      await handleModalFileChange(target);
    } else if (target.dataset.action === 'send-dm-image') {
      const file = target.files && target.files[0];
      const receiverId = target.dataset.receiverId;
      if (file && receiverId) {
        try {
          const { mediaId } = await validateAndStoreMedia(file);
          store.sendMessage(receiverId, { text: '', mediaId });
        } catch (_) {
          // Handled by validateAndStoreMedia toast
        }
        target.value = '';
      }
    }
  });

  // Delegated Form Submit Handler
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-action]');
    if (!form) return;
    event.preventDefault();

    const action = form.dataset.action;

    if (action === 'login-form') {
      const username = form.elements.username.value;
      const password = form.elements.password.value;
      try {
        const user = await store.login(username, password);
        showToast(`Welcome back, ${user.displayName}!`);
        router.navigate('#/feed');
      } catch (err) {
        showToast(err.message, 'error');
      }
      return;
    }

    if (action === 'signup-form') {
      try {
        const user = await store.signup({
          username: form.elements.username.value,
          displayName: form.elements.displayName.value,
          bio: form.elements.bio.value,
          password: form.elements.password.value,
          avatarPreset: form.elements.avatarPreset ? form.elements.avatarPreset.value : 'aurora'
        });
        showToast(`Account @${user.username} created!`);
        router.navigate('#/feed');
      } catch (err) {
        showToast(err.message, 'error');
      }
      return;
    }

    if (action === 'submit-comment') {
      const postId = form.dataset.postId;
      const input = form.elements.comment;
      if (input && input.value.trim()) {
        store.addComment(postId, input.value);
        input.value = '';
      }
      return;
    }

    if (action === 'submit-create-post') {
      submitCreatePostForm(form);
      return;
    }

    if (action === 'submit-create-story') {
      submitCreateStoryForm(form);
      return;
    }

    if (action === 'submit-edit-profile') {
      submitEditProfileForm(form);
      return;
    }

    if (action === 'send-dm-form') {
      const receiverId = form.dataset.receiverId;
      const input = form.elements.message;
      if (receiverId && input && input.value.trim()) {
        store.sendMessage(receiverId, { text: input.value });
        input.value = '';
      }
    }
  });
}

async function bootstrap() {
  try {
    await initDB();
  } catch (_) {
    // IndexedDB unavailable in strict private mode; app continues with SVG/text fallbacks
  }
  await store.init();
  setupGlobalEvents();

  store.subscribe(async () => {
    router.refreshView();
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot && modalRoot.children.length > 0) {
      await hydrateMedia(modalRoot);
    }
  });

  router.init();
}

bootstrap();
