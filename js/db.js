import { uid, compressImage, showStorageError, showToast } from './utils.js';

const DB_NAME = 'facegram_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media';
const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB
const objectUrlCache = new Map();
let dbPromise = null;

export function initDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
  return dbPromise;
}

export async function saveMediaBlob(blob, customId = null) {
  const mediaId = customId || uid('media');
  try {
    const db = await initDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, mediaId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    if (objectUrlCache.has(mediaId)) {
      URL.revokeObjectURL(objectUrlCache.get(mediaId));
    }
    objectUrlCache.set(mediaId, URL.createObjectURL(blob));
    return mediaId;
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || String(err).includes('Quota'))) {
      showStorageError('IndexedDB storage quota exceeded while saving media.');
    } else {
      showToast('Could not store media file in browser database.', 'error');
    }
    throw err;
  }
}

export async function getMediaBlob(mediaId) {
  if (!mediaId) return null;
  try {
    const db = await initDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(mediaId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (_) {
    return null;
  }
}

export async function getMediaObjectURL(mediaId) {
  if (!mediaId) return null;
  if (
    mediaId.startsWith('./') ||
    mediaId.startsWith('../') ||
    mediaId.startsWith('/') ||
    mediaId.startsWith('assets/') ||
    mediaId.startsWith('http://') ||
    mediaId.startsWith('https://') ||
    mediaId.startsWith('data:')
  ) {
    return mediaId;
  }
  if (mediaId === 'seed_media_sunrise') return './assets/mountain_sunrise.jpg';
  if (mediaId === 'seed_media_portrait') return './assets/fashion_portrait.jpg';
  if (objectUrlCache.has(mediaId)) {
    return objectUrlCache.get(mediaId);
  }
  const blob = await getMediaBlob(mediaId);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(mediaId, url);
  return url;
}

export async function deleteMediaBlob(mediaId) {
  if (!mediaId) return;
  if (objectUrlCache.has(mediaId)) {
    URL.revokeObjectURL(objectUrlCache.get(mediaId));
    objectUrlCache.delete(mediaId);
  }
  try {
    const db = await initDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(mediaId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (_) {
    // Ignore deletion errors
  }
}

export async function validateAndStoreMedia(file) {
  if (!file) throw new Error('No file selected');
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  if (!isVideo && !isImage) {
    showToast('Please select a valid image or video file.', 'error');
    throw new Error('Unsupported media format');
  }

  if (isVideo) {
    if (file.size > MAX_VIDEO_BYTES) {
      showToast('Videos must be under 15 MB. Please pick a shorter clip.', 'error');
      throw new Error('Video exceeds 15 MB limit');
    }
    const mediaId = await saveMediaBlob(file);
    return { mediaId, mediaType: 'video' };
  }

  const compressedBlob = await compressImage(file, 1080, 0.8);
  const mediaId = await saveMediaBlob(compressedBlob);
  return { mediaId, mediaType: 'image' };
}

export async function hydrateMedia(rootElement = document) {
  if (!rootElement) return;
  const elements = rootElement.querySelectorAll('img[data-media-id], video[data-media-id]');
  await Promise.all(
    Array.from(elements).map(async (el) => {
      const mediaId = el.getAttribute('data-media-id');
      if (!mediaId || el.dataset.hydratedId === mediaId) return;
      const url = await getMediaObjectURL(mediaId);
      if (url) {
        el.src = url;
        el.dataset.hydratedId = mediaId;
      }
    })
  );
}
