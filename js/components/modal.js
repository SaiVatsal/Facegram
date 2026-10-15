import { store } from '../store.js';
import {
  escapeHTML,
  timeAgo,
  renderAvatar,
  PRESET_AVATARS,
  TEXT_POST_GRADIENTS,
  ICON,
  showToast
} from '../utils.js';
import { validateAndStoreMedia, hydrateMedia } from '../db.js';
import { renderPostCard } from './post-card.js';

let storyTimer = null;
let pendingModalMedia = null;
let selectedGradient = 'grad-ocean';
let selectedPostMode = 'media';
let selectedAvatarPreset = 'aurora';

export function closeModal() {
  if (storyTimer) {
    clearTimeout(storyTimer);
    storyTimer = null;
  }
  pendingModalMedia = null;
  const modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    modalRoot.innerHTML = '';
  }
}

export function openCreatePostModal() {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  pendingModalMedia = null;
  selectedGradient = 'grad-ocean';
  selectedPostMode = 'media';

  const swatchesHTML = TEXT_POST_GRADIENTS.map(
    (g) => `
      <button
        type="button"
        class="gradient-swatch ${g.id} ${g.id === selectedGradient ? 'selected' : ''}"
        data-action="select-gradient"
        data-gradient="${escapeHTML(g.id)}"
        aria-label="${escapeHTML(g.label)} gradient"
      ></button>
    `
  ).join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Create new post">
        <div class="modal-header">
          <span>Create New Post</span>
          <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close modal">
            ${ICON.close}
          </button>
        </div>

        <form class="modal-body" data-action="submit-create-post">
          <div class="auth-tabs">
            <button
              type="button"
              class="auth-tab-btn active"
              data-action="switch-post-mode"
              data-mode="media"
            >Photo / Video</button>
            <button
              type="button"
              class="auth-tab-btn"
              data-action="switch-post-mode"
              data-mode="text"
            >Text Card</button>
          </div>

          <div id="create-post-media-pane">
            <div class="form-group">
              <label class="form-label" for="post-media-input">Upload Photo (auto-compressed) or Video (max 15 MB)</label>
              <input
                type="file"
                id="post-media-input"
                class="form-input"
                accept="image/*,video/*"
                data-action="handle-modal-file"
              />
            </div>
            <div id="modal-media-preview" class="hidden"></div>
          </div>

          <div id="create-post-text-pane" class="hidden">
            <div class="form-group">
              <span class="form-label">Choose Card Gradient</span>
              <div class="gradient-picker-row">
                ${swatchesHTML}
              </div>
            </div>

            <div id="text-card-live-preview" class="post-text-card ${escapeHTML(selectedGradient)}">
              <span>Share what’s on your mind...</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="post-caption-input">Caption / Text</label>
            <textarea
              id="post-caption-input"
              name="caption"
              class="form-textarea"
              placeholder="Write a caption or status update..."
              maxlength="500"
              data-action="live-caption-input"
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Share Post</button>
        </form>
      </div>
    </div>
  `;
}

export function openCreateStoryModal() {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  pendingModalMedia = null;
  selectedGradient = 'grad-berry';

  const swatchesHTML = TEXT_POST_GRADIENTS.map(
    (g) => `
      <button
        type="button"
        class="gradient-swatch ${g.id} ${g.id === selectedGradient ? 'selected' : ''}"
        data-action="select-gradient"
        data-gradient="${escapeHTML(g.id)}"
        aria-label="${escapeHTML(g.label)} gradient"
      ></button>
    `
  ).join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Add to Your Story">
        <div class="modal-header">
          <span>Add to Your Story</span>
          <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close modal">
            ${ICON.close}
          </button>
        </div>

        <form class="modal-body" data-action="submit-create-story">
          <div class="form-group">
            <label class="form-label" for="story-media-input">Optional Story Image</label>
            <input
              type="file"
              id="story-media-input"
              class="form-input"
              accept="image/*"
              data-action="handle-modal-file"
            />
          </div>

          <div id="modal-media-preview" class="hidden"></div>

          <div class="form-group">
            <span class="form-label">Background Gradient (for text stories)</span>
            <div class="gradient-picker-row">
              ${swatchesHTML}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="story-text-input">Story Caption / Overlay Text</label>
            <input
              type="text"
              id="story-text-input"
              name="text"
              class="form-input"
              placeholder="Type your story message..."
              maxlength="140"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block">Publish Story</button>
        </form>
      </div>
    </div>
  `;
}

export async function openStoryViewerModal(storyId) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const stories = store.getActiveStories();
  const index = stories.findIndex((s) => s.id === storyId);
  if (index === -1) return;

  const story = stories[index];
  const author = store.getUserById(story.userId);
  store.markStorySeen(story.id);

  const nextStory = stories[index + 1] || null;
  const gradClass = story.bgGradient || 'grad-berry';

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <div class="story-viewer-panel" role="dialog" aria-modal="true" aria-label="Story viewer">
        <div class="story-viewer-stage ${story.mediaId ? '' : escapeHTML(gradClass)}">
          ${
            story.mediaId
              ? `<img data-media-id="${escapeHTML(story.mediaId)}" alt="Story by ${escapeHTML(author ? author.username : '')}" />`
              : `<div class="post-text-card ${escapeHTML(gradClass)}"><span>${escapeHTML(story.text)}</span></div>`
          }
        </div>

        <div>
          <div class="story-progress-track">
            <div class="story-progress-fill"></div>
          </div>

          <div class="story-viewer-top">
            <div class="post-author">
              ${renderAvatar(author, 'avatar-sm')}
              <div>
                <div class="post-author-name">${escapeHTML(author ? author.username : '')}</div>
                <div class="post-timestamp">${escapeHTML(timeAgo(story.createdAt))}</div>
              </div>
            </div>

            <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close story">
              ${ICON.close}
            </button>
          </div>
        </div>

        ${
          story.mediaId && story.text
            ? `<div class="story-caption-banner">${escapeHTML(story.text)}</div>`
            : '<div></div>'
        }
      </div>
    </div>
  `;

  await hydrateMedia(modalRoot);

  if (storyTimer) clearTimeout(storyTimer);
  storyTimer = setTimeout(() => {
    if (nextStory) {
      openStoryViewerModal(nextStory.id);
    } else {
      closeModal();
    }
  }, 5000);
}

export function openEditProfileModal() {
  const modalRoot = document.getElementById('modal-root');
  const user = store.getCurrentUser();
  if (!modalRoot || !user) return;

  pendingModalMedia = null;
  selectedAvatarPreset = user.avatarPreset || 'aurora';

  const presetButtonsHTML = Object.entries(PRESET_AVATARS)
    .map(
      ([key, svg]) => `
        <button
          type="button"
          class="preset-avatar-btn ${key === selectedAvatarPreset ? 'selected' : ''}"
          data-action="select-preset-avatar"
          data-preset="${escapeHTML(key)}"
          aria-label="Preset avatar ${escapeHTML(key)}"
        >
          <span class="avatar avatar-md">${svg}</span>
        </button>
      `
    )
    .join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Edit Profile">
        <div class="modal-header">
          <span>Edit Profile</span>
          <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close modal">
            ${ICON.close}
          </button>
        </div>

        <form class="modal-body" data-action="submit-edit-profile">
          <div class="form-group">
            <span class="form-label">Pick a Preset SVG Avatar</span>
            <div class="preset-avatar-grid">
              ${presetButtonsHTML}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="avatar-file-input">Or Upload Custom Avatar Photo</label>
            <input
              type="file"
              id="avatar-file-input"
              class="form-input"
              accept="image/*"
              data-action="handle-modal-file"
            />
            <div id="modal-media-preview" class="hidden"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-display-name">Display Name</label>
            <input
              type="text"
              id="edit-display-name"
              name="displayName"
              class="form-input"
              value="${escapeHTML(user.displayName)}"
              maxlength="50"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-bio">Bio</label>
            <textarea
              id="edit-bio"
              name="bio"
              class="form-textarea"
              maxlength="180"
            >${escapeHTML(user.bio)}</textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Save Profile</button>
        </form>
      </div>
    </div>
  `;
}

export async function openPostDetailModal(postId) {
  const modalRoot = document.getElementById('modal-root');
  const post = store.getPostById(postId);
  if (!modalRoot || !post) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Post detail">
        <div class="modal-header">
          <span>Post</span>
          <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close modal">
            ${ICON.close}
          </button>
        </div>
        <div>
          ${renderPostCard(post)}
        </div>
      </div>
    </div>
  `;

  await hydrateMedia(modalRoot);
}

export async function handleModalFileChange(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;

  try {
    const result = await validateAndStoreMedia(file);
    pendingModalMedia = result;

    const previewContainer = document.getElementById('modal-media-preview');
    if (previewContainer) {
      previewContainer.classList.remove('hidden');
      if (result.mediaType === 'video') {
        previewContainer.innerHTML = `<video data-media-id="${escapeHTML(result.mediaId)}" controls playsinline></video>`;
      } else {
        previewContainer.innerHTML = `<img data-media-id="${escapeHTML(result.mediaId)}" alt="Upload preview" />`;
      }
      await hydrateMedia(previewContainer);
    }
  } catch (_) {
    inputEl.value = '';
  }
}

export function switchModalPostMode(mode) {
  selectedPostMode = mode === 'text' ? 'text' : 'media';
  const mediaPane = document.getElementById('create-post-media-pane');
  const textPane = document.getElementById('create-post-text-pane');
  const buttons = document.querySelectorAll('[data-action="switch-post-mode"]');

  buttons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === selectedPostMode);
  });

  if (mediaPane && textPane) {
    mediaPane.classList.toggle('hidden', selectedPostMode === 'text');
    textPane.classList.toggle('hidden', selectedPostMode !== 'text');
  }
}

export function selectModalGradient(gradClass) {
  selectedGradient = gradClass;
  document.querySelectorAll('[data-action="select-gradient"]').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.gradient === gradClass);
  });
  const preview = document.getElementById('text-card-live-preview');
  if (preview) {
    preview.className = `post-text-card ${gradClass}`;
  }
}

export function updateLiveTextCardPreview(text) {
  const preview = document.getElementById('text-card-live-preview');
  if (preview) {
    preview.textContent = text.trim() || 'Share what’s on your mind...';
  }
}

export function selectModalAvatarPreset(presetKey) {
  selectedAvatarPreset = presetKey;
  pendingModalMedia = null;
  document.querySelectorAll('[data-action="select-preset-avatar"]').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.preset === presetKey);
  });
}

export function submitCreatePostForm(formEl) {
  const caption = formEl.elements.caption ? formEl.elements.caption.value.trim() : '';
  if (selectedPostMode === 'media') {
    if (!pendingModalMedia) {
      showToast('Please select an image or video, or switch to Text Card.', 'error');
      return;
    }
    store.createPost({
      caption,
      mediaId: pendingModalMedia.mediaId,
      mediaType: pendingModalMedia.mediaType,
      bgGradient: null
    });
  } else {
    if (!caption) {
      showToast('Please write some text for your card.', 'error');
      return;
    }
    store.createPost({
      caption,
      mediaId: null,
      mediaType: 'text',
      bgGradient: selectedGradient
    });
  }
  closeModal();
  showToast('Post published!');
}

export function submitCreateStoryForm(formEl) {
  const text = formEl.elements.text ? formEl.elements.text.value.trim() : '';
  store.createStory({
    mediaId: pendingModalMedia ? pendingModalMedia.mediaId : null,
    text,
    bgGradient: selectedGradient
  });
  closeModal();
  showToast('Added to your story!');
}

export function submitEditProfileForm(formEl) {
  const user = store.getCurrentUser();
  if (!user) return;

  const displayName = formEl.elements.displayName.value;
  const bio = formEl.elements.bio.value;

  const avatarUpdates = pendingModalMedia
    ? { avatarMediaId: pendingModalMedia.mediaId }
    : { avatarPreset: selectedAvatarPreset, avatarMediaId: null };

  store.updateProfile(user.id, {
    displayName,
    bio,
    ...avatarUpdates
  });
  closeModal();
  showToast('Profile updated!');
}
