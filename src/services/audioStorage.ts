/**
 * Servicio de Almacenamiento Local de Audio en IndexedDB para Dyser PWA
 * Permite guardar y recuperar Blobs de audio reales grabados desde el micrófono
 * sin las limitaciones de cuota (5MB) de localStorage.
 */

const DB_NAME = 'dyser_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'class_recordings_audio';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este entorno'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
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

/**
 * Guarda un Blob de audio grabado en IndexedDB bajo el ID de la grabación.
 */
export async function saveAudioRecord(id: string, audioBlob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(audioBlob, id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] No se pudo persistir audio en IndexedDB:', err);
  }
}

/**
 * Recupera un Blob de audio almacenado por su ID.
 */
export async function getAudioRecord(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] Error al leer audio de IndexedDB:', err);
    return null;
  }
}

/**
 * Elimina un audio grabado de IndexedDB.
 */
export async function deleteAudioRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[AudioStorage] Error al eliminar audio de IndexedDB:', err);
  }
}

/**
 * Convierte un Blob de audio a string base64 puro (sin prefijo data:...)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1] || '';
        resolve(base64);
      } else {
        reject(new Error('Formato de datos no convertible a base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
