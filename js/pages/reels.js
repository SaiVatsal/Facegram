import { store } from '../store.js';
import { escapeHTML, renderAvatar, ICON, timeAgo, showToast } from '../utils.js';

let activeObserver = null;
let isAudioMuted = true;

export function renderReelsPage(container, targetReelId = null) {
  const reels = store.getReels();
  const currentUser = store.getCurrentUser();

  if (!reels || reels.length === 0) {
    container.innerHTML = `
      <div class="page-container">
        <div class="empty-state">
          <h3>No Reels Available</h3>
          <p>Reels are currently being updated. Check back in a moment!</p>
          <a href="#/feed" class="btn btn-primary">Back to Home</a>
        </div>
      </div>
    `;
    return;
  }

  // If targetReelId provided, move it to front or scroll to it
  let initialIndex = 0;
  if (targetReelId) {
    const idx = reels.findIndex((r) => r.id === targetReelId);
    if (idx >= 0) initialIndex = idx;
  }

  const reelsHTML = reels
    .map((reel, idx) => {
      const author = store.getUserById(reel.userId) || {
        username: 'creator',
        displayName: 'Creator',
        id: reel.userId
      };
      const isLiked = store.isReelLiked(reel.id);
      const isOwn = currentUser && currentUser.id === author.id;
      const isFollowing = currentUser && store.isFollowing(currentUser.id, author.id);
      const likeCount = (reel.likes ? reel.likes.length : 0);
      const commentCount = (reel.comments ? reel.comments.length : 0);

      return `
        <article
          class="reel-card"
          data-reel-id="${escapeHTML(reel.id)}"
          data-reel-index="${idx}"
          id="reel-${escapeHTML(reel.id)}"
        >
          <div class="reel-video-wrapper">
            <video
              class="reel-video"
              src="${escapeHTML(reel.videoUrl)}"
              loop
              playsinline
              preload="${idx === initialIndex ? 'auto' : 'metadata'}"
              ${isAudioMuted ? 'muted' : ''}
            ></video>

            <div class="reel-touch-layer" data-action="toggle-play-reel"></div>

            <div class="reel-play-indicator" aria-hidden="true">
              ${ICON.play}
            </div>

            <div class="reel-heart-pop" aria-hidden="true">❤️</div>

            <button
              type="button"
              class="reel-sound-toggle-btn"
              data-action="toggle-reel-sound"
              aria-label="${isAudioMuted ? 'Unmute audio' : 'Mute audio'}"
            >
              ${isAudioMuted ? ICON.volumeMute : ICON.volumeUp}
            </button>
          </div>

          <!-- Bottom Meta & Caption -->
          <div class="reel-meta-overlay">
            <div class="reel-author-row">
              <a href="#/profile/${encodeURIComponent(author.username)}" class="reel-author-info">
                ${renderAvatar(author, 'avatar-sm')}
                <div class="reel-author-names">
                  <span class="reel-author-name">${escapeHTML(author.displayName)}</span>
                  <span class="reel-author-handle">@${escapeHTML(author.username)}</span>
                </div>
              </a>

              ${
                !isOwn && currentUser
                  ? `
                <button
                  type="button"
                  class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-xs reel-follow-btn"
                  data-action="toggle-follow-reel"
                  data-user-id="${escapeHTML(author.id)}"
                >
                  ${isFollowing ? 'Following' : 'Follow'}
                </button>
              `
                  : ''
              }
            </div>

            <p class="reel-caption">${formatCaptionWithTags(reel.caption)}</p>

            <div class="reel-audio-bar">
              <span class="reel-audio-icon">${ICON.music}</span>
              <div class="reel-audio-marquee">
                <span>${escapeHTML(reel.audioTitle || 'Original Audio')}</span>
              </div>
            </div>
          </div>

          <!-- Right Action Rail -->
          <aside class="reel-actions-rail" aria-label="Reel Actions">
            <a href="#/profile/${encodeURIComponent(author.username)}" class="reel-action-avatar-wrap" title="${escapeHTML(author.displayName)}">
              ${renderAvatar(author, 'avatar-md')}
            </a>

            <button
              type="button"
              class="reel-action-btn ${isLiked ? 'liked' : ''}"
              data-action="toggle-like-reel"
              data-reel-id="${escapeHTML(reel.id)}"
              aria-label="${isLiked ? 'Unlike reel' : 'Like reel'}"
            >
              <span class="reel-icon-bubble">
                ${isLiked ? ICON.heartFilled : ICON.heart}
              </span>
              <span class="reel-action-count">${likeCount}</span>
            </button>

            <button
              type="button"
              class="reel-action-btn"
              data-action="open-reel-comments"
              data-reel-id="${escapeHTML(reel.id)}"
              aria-label="View comments"
            >
              <span class="reel-icon-bubble">${ICON.comment}</span>
              <span class="reel-action-count">${commentCount}</span>
            </button>

            <button
              type="button"
              class="reel-action-btn"
              data-action="share-reel"
              data-reel-id="${escapeHTML(reel.id)}"
              aria-label="Share reel"
            >
              <span class="reel-icon-bubble">${ICON.share}</span>
              <span class="reel-action-label">Share</span>
            </button>

            <div class="reel-music-disc-wrapper" title="${escapeHTML(reel.audioTitle || 'Original Audio')}">
              <div class="reel-spinning-disc">
                ${renderAvatar(author, 'avatar-xs')}
              </div>
            </div>
          </aside>
        </article>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="reels-page-wrapper">
      <div class="reels-controls-hint">
        <span>Scroll or use ↑ ↓ keys to browse reels</span>
      </div>

      <main class="reels-feed" id="reels-feed" aria-label="Reels Video Feed">
        ${reelsHTML}
      </main>

      <!-- Comments Bottom Sheet Drawer -->
      <div id="reel-comments-drawer" class="reel-comments-drawer hidden" aria-hidden="true">
        <div class="reel-drawer-backdrop" data-action="close-reel-comments"></div>
        <div class="reel-drawer-sheet">
          <div class="reel-drawer-header">
            <h4>Comments</h4>
            <button type="button" class="icon-btn" data-action="close-reel-comments" aria-label="Close comments">
              ${ICON.close}
            </button>
          </div>

          <div class="reel-comments-list" id="reel-comments-container">
            <!-- Dynamic comments rendered here -->
          </div>

          <form class="reel-comment-form" data-action="submit-reel-comment">
            <input
              type="text"
              name="commentText"
              class="form-input reel-comment-input"
              placeholder="Add a comment as ${escapeHTML(currentUser ? currentUser.displayName : 'Guest')}..."
              required
              autocomplete="off"
            />
            <button type="submit" class="btn btn-primary btn-sm">Post</button>
          </form>
        </div>
      </div>
    </div>
  `;

  setupReelsInteractions(container, initialIndex);
}

function formatCaptionWithTags(caption) {
  if (!caption) return '';
  const escaped = escapeHTML(caption);
  return escaped.replace(/#([\w\u0590-\u05ff]+)/g, '<span class="reel-hashtag">#$1</span>');
}

function setupReelsInteractions(container, initialIndex = 0) {
  const feed = container.querySelector('#reels-feed');
  if (!feed) return;

  const cards = Array.from(feed.querySelectorAll('.reel-card'));
  if (cards.length === 0) return;

  // Cleanup old observer
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }

  // Observer to manage play/pause state
  activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector('video');
        const disc = entry.target.querySelector('.reel-spinning-disc');
        if (!video) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.muted = isAudioMuted;
          const playPromise = video.play();
          if (playPromise) {
            playPromise.catch(() => {
              // Browser autoplay policy might require user gesture
              video.muted = true;
              video.play().catch(() => {});
            });
          }
          if (disc) disc.classList.add('playing');
        } else {
          video.pause();
          if (disc) disc.classList.remove('playing');
        }
      });
    },
    {
      root: feed,
      threshold: 0.6
    }
  );

  cards.forEach((card) => activeObserver.observe(card));

  // Scroll to initial reel if requested
  if (initialIndex > 0 && cards[initialIndex]) {
    setTimeout(() => {
      cards[initialIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Keyboard navigation (ArrowUp / ArrowDown)
  const handleKeydown = (e) => {
    if (!document.contains(feed)) {
      window.removeEventListener('keydown', handleKeydown);
      return;
    }
    // Don't intercept if user is typing in a comment input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      scrollReel(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      scrollReel(-1);
    } else if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      toggleCurrentReelPlay();
    } else if (e.key === 'm') {
      e.preventDefault();
      toggleGlobalSound(container);
    }
  };
  window.addEventListener('keydown', handleKeydown);

  function getCurrentVisibleCard() {
    const feedRect = feed.getBoundingClientRect();
    const feedCenterY = feedRect.top + feedRect.height / 2;
    let closestCard = cards[0];
    let minDistance = Infinity;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenterY = rect.top + rect.height / 2;
      const dist = Math.abs(cardCenterY - feedCenterY);
      if (dist < minDistance) {
        minDistance = dist;
        closestCard = card;
      }
    });
    return closestCard;
  }

  function scrollReel(direction) {
    const current = getCurrentVisibleCard();
    const currentIndex = parseInt(current.dataset.reelIndex, 10);
    const targetIdx = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
    if (cards[targetIdx]) {
      cards[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function toggleCurrentReelPlay() {
    const current = getCurrentVisibleCard();
    if (!current) return;
    const video = current.querySelector('video');
    const indicator = current.querySelector('.reel-play-indicator');
    const disc = current.querySelector('.reel-spinning-disc');
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        if (disc) disc.classList.add('playing');
        flashIndicator(indicator, ICON.play);
      }).catch(() => {});
    } else {
      video.pause();
      if (disc) disc.classList.remove('playing');
      flashIndicator(indicator, ICON.pause);
    }
  }

  // Click delegates on container
  container.addEventListener('click', (e) => {
    // Sound toggle
    const soundBtn = e.target.closest('[data-action="toggle-reel-sound"]');
    if (soundBtn) {
      e.stopPropagation();
      toggleGlobalSound(container);
      return;
    }

    // Like reel
    const likeBtn = e.target.closest('[data-action="toggle-like-reel"]');
    if (likeBtn) {
      e.stopPropagation();
      const reelId = likeBtn.dataset.reelId;
      const isLiked = store.toggleReelLike(reelId);
      likeBtn.classList.toggle('liked', isLiked);
      const countEl = likeBtn.querySelector('.reel-action-count');
      const bubbleEl = likeBtn.querySelector('.reel-icon-bubble');
      const reel = store.getReelById(reelId);
      if (countEl && reel) countEl.textContent = reel.likes.length;
      if (bubbleEl) bubbleEl.innerHTML = isLiked ? ICON.heartFilled : ICON.heart;
      return;
    }

    // Toggle follow on reel author
    const followBtn = e.target.closest('[data-action="toggle-follow-reel"]');
    if (followBtn) {
      e.stopPropagation();
      const targetUserId = followBtn.dataset.userId;
      const currentUser = store.getCurrentUser();
      if (currentUser) {
        const isNowFollowing = store.toggleFollow(targetUserId);
        followBtn.textContent = isNowFollowing ? 'Following' : 'Follow';
        followBtn.className = `btn ${isNowFollowing ? 'btn-secondary' : 'btn-primary'} btn-xs reel-follow-btn`;
      }
      return;
    }

    // Open comments
    const commentsBtn = e.target.closest('[data-action="open-reel-comments"]');
    if (commentsBtn) {
      e.stopPropagation();
      const reelId = commentsBtn.dataset.reelId;
      openReelCommentsDrawer(container, reelId);
      return;
    }

    // Close comments
    const closeBtn = e.target.closest('[data-action="close-reel-comments"]');
    if (closeBtn) {
      closeReelCommentsDrawer(container);
      return;
    }

    // Share reel
    const shareBtn = e.target.closest('[data-action="share-reel"]');
    if (shareBtn) {
      e.stopPropagation();
      const reelId = shareBtn.dataset.reelId;
      const shareUrl = `${window.location.origin}${window.location.pathname}#/reels/${encodeURIComponent(reelId)}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Reel link copied to clipboard!');
      }).catch(() => {
        showToast('Link: ' + shareUrl);
      });
      return;
    }

    // Tap on video: single tap = play/pause, double tap = like
    const touchLayer = e.target.closest('.reel-touch-layer');
    if (touchLayer) {
      const card = touchLayer.closest('.reel-card');
      const now = Date.now();
      const lastTap = touchLayer._lastTap || 0;
      touchLayer._lastTap = now;

      if (now - lastTap < 300) {
        // Double Tap: Like animation!
        if (card) {
          const reelId = card.dataset.reelId;
          const isLiked = store.toggleReelLike(reelId);
          const likeBtn = card.querySelector('[data-action="toggle-like-reel"]');
          if (likeBtn) {
            likeBtn.classList.toggle('liked', isLiked);
            const countEl = likeBtn.querySelector('.reel-action-count');
            const bubbleEl = likeBtn.querySelector('.reel-icon-bubble');
            const reel = store.getReelById(reelId);
            if (countEl && reel) countEl.textContent = reel.likes.length;
            if (bubbleEl) bubbleEl.innerHTML = isLiked ? ICON.heartFilled : ICON.heart;
          }
          const heartPop = card.querySelector('.reel-heart-pop');
          if (heartPop) {
            heartPop.classList.add('pop-active');
            setTimeout(() => heartPop.classList.remove('pop-active'), 800);
          }
        }
      } else {
        // Single Tap: Play / Pause
        setTimeout(() => {
          if (Date.now() - (touchLayer._lastTap || 0) >= 280) {
            const video = card.querySelector('video');
            const indicator = card.querySelector('.reel-play-indicator');
            const disc = card.querySelector('.reel-spinning-disc');
            if (video) {
              if (video.paused) {
                video.play().then(() => {
                  if (disc) disc.classList.add('playing');
                  flashIndicator(indicator, ICON.play);
                }).catch(() => {});
              } else {
                video.pause();
                if (disc) disc.classList.remove('playing');
                flashIndicator(indicator, ICON.pause);
              }
            }
          }
        }, 300);
      }
    }
  });

  // Submit comment in drawer
  container.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-action="submit-reel-comment"]');
    if (!form) return;
    e.preventDefault();
    const reelId = form.dataset.activeReelId;
    const input = form.elements.commentText;
    if (!reelId || !input || !input.value.trim()) return;

    store.addReelComment(reelId, input.value.trim());
    input.value = '';
    renderReelCommentsList(container, reelId);

    // Update comment count on active card
    const card = container.querySelector(`[data-reel-id="${reelId}"]`);
    if (card) {
      const countEl = card.querySelector('[data-action="open-reel-comments"] .reel-action-count');
      const reel = store.getReelById(reelId);
      if (countEl && reel) countEl.textContent = reel.comments.length;
    }
  });
}

function flashIndicator(indicator, iconSvg) {
  if (!indicator) return;
  indicator.innerHTML = iconSvg;
  indicator.classList.add('flash');
  setTimeout(() => indicator.classList.remove('flash'), 500);
}

function toggleGlobalSound(container) {
  isAudioMuted = !isAudioMuted;
  const videos = container.querySelectorAll('video');
  videos.forEach((v) => {
    v.muted = isAudioMuted;
  });

  const soundBtns = container.querySelectorAll('[data-action="toggle-reel-sound"]');
  soundBtns.forEach((btn) => {
    btn.innerHTML = isAudioMuted ? ICON.volumeMute : ICON.volumeUp;
    btn.setAttribute('aria-label', isAudioMuted ? 'Unmute audio' : 'Mute audio');
  });

  showToast(isAudioMuted ? 'Audio muted' : 'Audio unmuted 🔊');
}

function openReelCommentsDrawer(container, reelId) {
  const drawer = container.querySelector('#reel-comments-drawer');
  const form = container.querySelector('[data-action="submit-reel-comment"]');
  if (!drawer) return;

  drawer.classList.remove('hidden');
  drawer.setAttribute('aria-hidden', 'false');
  if (form) form.dataset.activeReelId = reelId;

  renderReelCommentsList(container, reelId);
}

function closeReelCommentsDrawer(container) {
  const drawer = container.querySelector('#reel-comments-drawer');
  if (!drawer) return;
  drawer.classList.add('hidden');
  drawer.setAttribute('aria-hidden', 'true');
}

function renderReelCommentsList(container, reelId) {
  const listEl = container.querySelector('#reel-comments-container');
  if (!listEl) return;

  const reel = store.getReelById(reelId);
  const comments = (reel && reel.comments) ? reel.comments : [];

  if (comments.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state reel-empty-comments">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = comments
    .map((c) => {
      const author = store.getUserById(c.userId) || {
        username: 'user',
        displayName: 'User',
        id: c.userId
      };

      return `
        <div class="reel-comment-item">
          <a href="#/profile/${encodeURIComponent(author.username)}" class="reel-comment-avatar">
            ${renderAvatar(author, 'avatar-xs')}
          </a>
          <div class="reel-comment-body">
            <div class="reel-comment-header">
              <span class="reel-comment-author">${escapeHTML(author.displayName)}</span>
              <span class="reel-comment-time">${timeAgo(c.createdAt)}</span>
            </div>
            <p class="reel-comment-text">${escapeHTML(c.text)}</p>
          </div>
        </div>
      `;
    })
    .join('');
}
