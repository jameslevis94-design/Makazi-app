// IndexedDB storage helper for custom dragged & dropped videos
// This enables large video files (10MB - 100MB+) to persist across browser reloads without localStorage size limits

const DB_NAME = 'MakaziVideoDB';
const DB_VERSION = 1;
const STORE_NAME = 'hero_videos';
const VIDEO_KEY = 'active_hero_video';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export interface StoredVideoRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  updatedAt: number;
}

export async function saveStoredVideo(file: Blob, name: string, type: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: StoredVideoRecord = {
        id: VIDEO_KEY,
        blob: file,
        name,
        type: type || 'video/mp4',
        size: file.size,
        updatedAt: Date.now()
      };

      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn('Failed to save video to IndexedDB:', err);
  }
}

export async function getStoredVideo(): Promise<StoredVideoRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(VIDEO_KEY);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve video from IndexedDB:', err);
    return null;
  }
}

export async function clearStoredVideo(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(VIDEO_KEY);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  } catch (err) {
    console.warn('Failed to clear video from IndexedDB:', err);
  }
}
