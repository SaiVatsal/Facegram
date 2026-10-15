export function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function timeAgo(timestamp) {
  const seconds = Math.max(1, Math.floor((Date.now() - Number(timestamp)) / 1000));
  if (seconds < 45) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export async function hashPassword(password) {
  const normalized = String(password || '');
  if (window.crypto && window.crypto.subtle) {
    try {
      const data = new TextEncoder().encode(normalized);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (_) {
      // Fallback to deterministic JS hash if SubtleCrypto fails
    }
  }

  let h1 = 0xdeadbeef ^ normalized.length;
  let h2 = 0x41c6ce57 ^ normalized.length;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export async function compressImage(file, maxDim = 1080, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas compression failed'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image'));
    };
    img.src = objectUrl;
  });
}

export async function generatePostArtworkBlob(themeIndex = 0, title = '', subtitle = '') {
  const palettes = [
    ['#1877F2', '#9B37F2', '#F77737'],
    ['#0F2027', '#203A43', '#2C5364'],
    ['#833AB4', '#FD1D1D', '#FCB045'],
    ['#11998E', '#38EF7D', '#0B486B'],
    ['#FF416C', '#FF4B2B', '#6A11CB'],
    ['#2B5876', '#4E4376', '#E1306C']
  ];
  const pal = palettes[themeIndex % palettes.length];
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 900, 900, 0);
  grad.addColorStop(0, pal[0]);
  grad.addColorStop(0.55, pal[1]);
  grad.addColorStop(1, pal[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 900, 900);

  // Decorative geometric rings & hills
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(680, 220, 170, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.moveTo(0, 650);
  ctx.quadraticCurveTo(260, 520, 520, 660);
  ctx.quadraticCurveTo(720, 760, 900, 610);
  ctx.lineTo(900, 900);
  ctx.lineTo(0, 900);
  ctx.closePath();
  ctx.fill();

  if (title) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 450, 420);
  }

  if (subtitle) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '500 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(subtitle, 450, 475);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.84);
  });
}

export function getLogoSVG(className = 'logo-svg') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="${escapeHTML(className)}" role="img" aria-label="Facegram">
  <defs>
    <linearGradient id="fgLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1877F2"/>
      <stop offset="35%" stop-color="#9B37F2"/>
      <stop offset="70%" stop-color="#E1306C"/>
      <stop offset="100%" stop-color="#F77737"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#fgLogoGrad)"/>
  <path d="M36.5 21.5h5v-7.5h-6.2c-6.8 0-10.8 4.1-10.8 10.6v4.4H19v7.2h5.5V52h8.2V36.2h6.1l1.1-7.2h-7.2v-3.7c0-2.4 1.1-3.8 3.8-3.8z" fill="#ffffff"/>
</svg>`;
}

export const PRESET_AVATARS = {
  aurora: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#1877F2"/><circle cx="40" cy="30" r="14" fill="#fff"/><path d="M16 70c4-14 14-22 24-22s20 8 24 22" fill="#fff"/></svg>`,
  sunset: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#E1306C"/><circle cx="40" cy="30" r="14" fill="#FFE6EE"/><path d="M16 70c4-14 14-22 24-22s20 8 24 22" fill="#FFE6EE"/></svg>`,
  violet: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#9B37F2"/><circle cx="40" cy="30" r="14" fill="#F3E8FF"/><path d="M16 70c4-14 14-22 24-22s20 8 24 22" fill="#F3E8FF"/></svg>`,
  amber: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#F77737"/><circle cx="40" cy="30" r="14" fill="#FFF4EC"/><path d="M16 70c4-14 14-22 24-22s20 8 24 22" fill="#FFF4EC"/></svg>`,
  emerald: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#10B981"/><circle cx="40" cy="30" r="14" fill="#ECFDF5"/><path d="M16 70c4-14 14-22 24-22s20 8 24 22" fill="#ECFDF5"/></svg>`,
  midnight: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#1E293B"/><circle cx="40" cy="30" r="14" fill="#94A3B8"/><path d="M16 70c4-14 14-22 24-22s20 8 24 22" fill="#94A3B8"/></svg>`
};

export function renderAvatar(user, sizeClass = 'avatar-md') {
  if (!user) {
    return `<span class="avatar ${escapeHTML(sizeClass)}">${PRESET_AVATARS.aurora}</span>`;
  }
  if (user.avatarMediaId) {
    const isDirect =
      user.avatarMediaId.startsWith('.') ||
      user.avatarMediaId.startsWith('/') ||
      user.avatarMediaId.startsWith('assets/');
    const directSrc = isDirect
      ? user.avatarMediaId
      : user.avatarMediaId === 'seed_media_portrait'
      ? './assets/fashion_portrait.jpg'
      : user.avatarMediaId === 'seed_media_sunrise'
      ? './assets/mountain_sunrise.jpg'
      : '';
    const srcAttr = directSrc ? `src="${escapeHTML(directSrc)}"` : '';
    return `<span class="avatar ${escapeHTML(sizeClass)}"><img data-media-id="${escapeHTML(
      user.avatarMediaId
    )}" ${srcAttr} alt="${escapeHTML(user.username)}" /></span>`;
  }
  const presetSvg = PRESET_AVATARS[user.avatarPreset] || PRESET_AVATARS.aurora;
  return `<span class="avatar ${escapeHTML(sizeClass)}">${presetSvg}</span>`;
}

export const REACTIONS = [
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' }
];

export const REACTION_MAP = Object.fromEntries(REACTIONS.map((r) => [r.type, r]));

export const TEXT_POST_GRADIENTS = [
  { id: 'grad-ocean', label: 'Ocean' },
  { id: 'grad-sunset', label: 'Sunset' },
  { id: 'grad-aurora', label: 'Aurora' },
  { id: 'grad-berry', label: 'Berry' },
  { id: 'grad-ember', label: 'Ember' },
  { id: 'grad-midnight', label: 'Midnight' }
];

export const ICON = {
  home: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-10.5z"/></svg>`,
  explore: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  messages: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  heart: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  heartFilled: `<svg class="svg-icon-filled" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  plus: `<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  comment: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  share: `<svg class="svg-icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  bookmark: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  bookmarkFilled: `<svg class="svg-icon-filled" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  trash: `<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  search: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  sun: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>`,
  moon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  logout: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  close: `<svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  image: `<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  grid: `<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  reels: `<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><polygon points="10 8 16 12 10 16 10 8"/><line x1="7" y1="3" x2="10" y2="7"/><line x1="14" y1="3" x2="17" y2="7"/></svg>`,
  volumeUp: `<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  volumeMute: `<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  music: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  play: `<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg class="svg-icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
};

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-root');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

export function showStorageError(message) {
  const banner = document.getElementById('storage-error-banner');
  const textEl = document.getElementById('storage-error-text');
  if (textEl && message) {
    textEl.textContent = message;
  }
  if (banner) {
    banner.classList.remove('hidden');
  }
}

export function getAIResponseMessage({ text = '', mediaId = null, partner = null, currentUser = null }) {
  const raw = String(text || '').trim();
  const normalized = raw.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = normalized ? normalized.split(' ') : [];
  const firstWord = words[0] || '';

  // 1. Image only / with image
  if (mediaId && (!raw || raw.length < 5)) {
    return 'Love this photo! 📸';
  }

  // 2. Exact single-word or short greetings (responds in one single word)
  // E.g. "hi", "hi alex", "hello", "hey", "yo", "sup"
  if (
    ['hi', 'hello', 'hey', 'yo', 'sup'].includes(normalized) ||
    (words.length <= 2 && ['hi', 'hello', 'hey', 'yo', 'sup'].includes(firstWord))
  ) {
    if (firstWord === 'hello') return 'Hello';
    if (firstWord === 'hey') return 'Hey';
    if (firstWord === 'yo') return 'Yo';
    if (firstWord === 'sup') return 'Sup';
    return 'Hi';
  }

  // 3. Work management / organization questions ("how to manage the work")
  if (
    normalized.includes('manage the work') ||
    normalized.includes('manage work') ||
    normalized.includes('manage my work') ||
    normalized.includes('work management') ||
    normalized.includes('organize work') ||
    normalized.includes('organize my work') ||
    normalized.includes('handling work') ||
    normalized.includes('handle work') ||
    normalized.includes('workload') ||
    normalized.includes('time management')
  ) {
    return 'Prioritize your top 3 tasks daily, block 90-minute focus sessions, and tackle the hardest task first.';
  }

  // 4. Time of day greetings
  if (normalized.includes('good morning') || normalized === 'morning') return 'Morning!';
  if (normalized.includes('good evening') || normalized === 'evening') return 'Evening!';
  if (normalized.includes('good night') || normalized === 'night') return 'Good night!';

  // 5. Wellbeing / How are you
  if (
    normalized.includes('how are you') ||
    normalized.includes('how r u') ||
    normalized.includes('how you doing') ||
    normalized.includes('how are you doing') ||
    normalized.includes('hows it going') ||
    normalized.includes('how is it going')
  ) {
    return 'Doing great, how about you?';
  }

  // 6. What's up / What are you doing
  if (
    normalized.includes('what are you doing') ||
    normalized.includes('what r u doing') ||
    normalized.includes('wyd') ||
    normalized.includes('whats up') ||
    normalized.includes('what is up')
  ) {
    return "Just wrapping up some projects! What's up with you?";
  }

  // 7. Polite / Gratitude
  if (['thanks', 'thank you', 'thx', 'tysm'].includes(normalized) || firstWord === 'thanks') {
    return 'Anytime!';
  }
  if (['welcome', 'youre welcome'].includes(normalized)) {
    return 'Appreciate it!';
  }
  if (normalized.includes('sorry')) {
    return 'No worries at all!';
  }

  // 8. Affirmations & short reactions
  if (['ok', 'okay', 'k', 'sure', 'sounds good'].includes(normalized)) {
    return 'Sounds good!';
  }
  if (['cool', 'nice', 'awesome', 'great', 'amazing', 'perfect'].includes(normalized)) {
    return 'Awesome!';
  }
  if (['yes', 'yeah', 'yep'].includes(normalized)) {
    return 'Great!';
  }
  if (['no', 'nah', 'nope'].includes(normalized)) {
    return 'Got it!';
  }

  // 9. Farewells
  if (['bye', 'goodbye', 'cya', 'see you', 'see ya'].includes(normalized) || firstWord === 'bye') {
    return 'Talk soon! 👋';
  }

  // 10. Direct questions
  if (
    raw.includes('?') ||
    ['how', 'what', 'why', 'where', 'who', 'when', 'can', 'should', 'do', 'is', 'are'].includes(
      firstWord
    )
  ) {
    if (normalized.includes('think') || normalized.includes('opinion')) {
      return 'Honestly looks really solid to me!';
    }
    if (normalized.includes('help')) {
      return 'Sure, what do you need a hand with?';
    }
    if (normalized.includes('where')) {
      return 'At the studio right now!';
    }
    return 'Keep it simple and focus on what moves the needle most.';
  }

  // 11. Persona-specific natural fallback
  if (partner && partner.id === 'u_alex') {
    const alexPool = [
      'Love the sound of that!',
      'Totally agree—clean and straightforward is always the way to go.',
      'Nice! Let’s definitely talk more about this.',
      'Haha so true! Hope your week is going well.'
    ];
    return alexPool[Math.floor(Math.random() * alexPool.length)];
  }

  const generalPool = [
    'Totally agree! Let’s catch up on this soon.',
    'Sounds awesome, thanks for sharing!',
    'Haha totally agree ✨',
    'Just saw this—sounds really interesting!'
  ];
  return generalPool[Math.floor(Math.random() * generalPool.length)];
}
