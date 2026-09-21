/**
 * Dyser Local User Vault Service (IndexedDB + Protected Local Storage)
 * 
 * Regla de Arquitectura Estricta:
 * Todos los archivos personales de los usuarios (PDFs, tareas, apuntes, documentos
 * y grabaciones) residen de forma EXCLUSIVA en el almacenamiento interno de su propio
 * dispositivo (IndexedDB 'dyser_user_vault_db').
 * 
 * Este carril de datos personales es completamente independiente del carril de código
 * de Firebase y no puede ser alterado, sobrescrito ni purgado por actualizaciones de la plataforma.
 */

export interface StoredUserPdf {
  id: string;
  name: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
  subject?: string;
  createdAt: number;
  source: 'summary' | 'blackboard' | 'upload' | 'user_note';
}

export interface StoredUserNote {
  id: string;
  title: string;
  content: string;
  subject?: string;
  category?: 'resumen' | 'apunte' | 'pizarra' | 'investigacion';
  createdAt: number;
  updatedAt: number;
}

export interface StoredUserDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl?: string;
  summaryText?: string;
  uploadedAt: number;
}

const VAULT_DB_NAME = 'dyser_user_vault_db';
const VAULT_DB_VERSION = 1;

export const VAULT_STORES = {
  PDFS: 'user_pdfs',
  NOTES: 'user_notes',
  DOCUMENTS: 'user_documents',
  SNAPSHOTS: 'vault_snapshots',
  TASKS_BACKUP: 'user_tasks_backup',
} as const;

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Abre o inicializa la base de datos de IndexedDB del Usuario
 */
export function openUserVaultDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este dispositivo'));
      return;
    }

    const request = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Almacén de PDFs personales
      if (!db.objectStoreNames.contains(VAULT_STORES.PDFS)) {
        const store = db.createObjectStore(VAULT_STORES.PDFS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('source', 'source', { unique: false });
      }

      // Almacén de Apuntes y Notas locales
      if (!db.objectStoreNames.contains(VAULT_STORES.NOTES)) {
        const store = db.createObjectStore(VAULT_STORES.NOTES, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Almacén de Documentos del usuario
      if (!db.objectStoreNames.contains(VAULT_STORES.DOCUMENTS)) {
        const store = db.createObjectStore(VAULT_STORES.DOCUMENTS, { keyPath: 'id' });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }

      // Instantáneas de seguridad previas a actualizaciones
      if (!db.objectStoreNames.contains(VAULT_STORES.SNAPSHOTS)) {
        db.createObjectStore(VAULT_STORES.SNAPSHOTS, { keyPath: 'snapshotId' });
      }

      // Respaldo indestructible de Tareas académicas locales
      if (!db.objectStoreNames.contains(VAULT_STORES.TASKS_BACKUP)) {
        db.createObjectStore(VAULT_STORES.TASKS_BACKUP, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.warn('[UserVault] Error abriendo almacén local IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

// ============================================================================
// GESTIÓN LOCAL DE PDFs DEL USUARIO (INDEPENDIENTES Y LOCALES)
// ============================================================================

/**
 * Guarda un PDF en el almacenamiento local del dispositivo (IndexedDB).
 */
export async function saveUserPdf(pdf: StoredUserPdf): Promise<void> {
  try {
    const db = await openUserVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VAULT_STORES.PDFS, 'readwrite');
      const store = tx.objectStore(VAULT_STORES.PDFS);
      const req = store.put(pdf);

      req.onsuccess = () => {
        console.log(`[UserVault] PDF personal "${pdf.name}" asegurado en almacenamiento interno.`);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[UserVault] Fallback de PDF a localStorage:', err);
    try {
      const fallbackList = getLocalPdfsFallback();
      const idx = fallbackList.findIndex(p => p.id === pdf.id);
      if (idx >= 0) fallbackList[idx] = pdf;
      else fallbackList.unshift(pdf);
      localStorage.setItem('dyser_vault_personal_pdfs_v1', JSON.stringify(fallbackList.slice(0, 20)));
    } catch (_) {}
  }
}

/**
 * Recupera todos los PDFs personales guardados en el almacenamiento interno.
 */
export async function getAllUserPdfs(): Promise<StoredUserPdf[]> {
  try {
    const db = await openUserVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction(VAULT_STORES.PDFS, 'readonly');
      const store = tx.objectStore(VAULT_STORES.PDFS);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result || [];
        // Ordenar por fecha descendente
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      req.onerror = () => resolve(getLocalPdfsFallback());
    });
  } catch (err) {
    return getLocalPdfsFallback();
  }
}

/**
 * Elimina un PDF personal por decisión expresa del usuario.
 */
export async function deleteUserPdf(id: string): Promise<void> {
  try {
    const db = await openUserVaultDB();
    const tx = db.transaction(VAULT_STORES.PDFS, 'readwrite');
    tx.objectStore(VAULT_STORES.PDFS).delete(id);
  } catch (_) {
    const list = getLocalPdfsFallback().filter(p => p.id !== id);
    localStorage.setItem('dyser_vault_personal_pdfs_v1', JSON.stringify(list));
  }
}

function getLocalPdfsFallback(): StoredUserPdf[] {
  try {
    const raw = localStorage.getItem('dyser_vault_personal_pdfs_v1');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

// ============================================================================
// GESTIÓN LOCAL DE APUNTES Y NOTAS DEL USUARIO
// ============================================================================

/**
 * Guarda un apunte personal en IndexedDB.
 */
export async function saveUserNote(note: StoredUserNote): Promise<void> {
  try {
    const db = await openUserVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VAULT_STORES.NOTES, 'readwrite');
      const store = tx.objectStore(VAULT_STORES.NOTES);
      const req = store.put(note);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[UserVault] Fallback de apunte a localStorage:', err);
    try {
      const notes = getLocalNotesFallback();
      const idx = notes.findIndex(n => n.id === note.id);
      if (idx >= 0) notes[idx] = note;
      else notes.unshift(note);
      localStorage.setItem('dyser_vault_personal_notes_v1', JSON.stringify(notes));
    } catch (_) {}
  }
}

/**
 * Recupera todos los apuntes personales guardados en el dispositivo.
 */
export async function getAllUserNotes(): Promise<StoredUserNote[]> {
  try {
    const db = await openUserVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction(VAULT_STORES.NOTES, 'readonly');
      const store = tx.objectStore(VAULT_STORES.NOTES);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result || [];
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };
      req.onerror = () => resolve(getLocalNotesFallback());
    });
  } catch (err) {
    return getLocalNotesFallback();
  }
}

function getLocalNotesFallback(): StoredUserNote[] {
  try {
    const raw = localStorage.getItem('dyser_vault_personal_notes_v1');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

// ============================================================================
// RESPALDO Y PROTECCIÓN LOCAL DE TAREAS PERSONALES
// ============================================================================

/**
 * Respalda las tareas del usuario en IndexedDB para protegerlas contra cualquier
 * alteración originada desde la nube o la red.
 */
export async function backupLocalTasksToVault(tasks: any[]): Promise<void> {
  if (!Array.isArray(tasks) || tasks.length === 0) return;
  try {
    const db = await openUserVaultDB();
    const tx = db.transaction(VAULT_STORES.TASKS_BACKUP, 'readwrite');
    const store = tx.objectStore(VAULT_STORES.TASKS_BACKUP);
    for (const task of tasks) {
      store.put(task);
    }
  } catch (e) {
    // Si IndexedDB falla, se asegura copia en clave inmutable de localStorage
    try {
      localStorage.setItem('dyser_vault_tasks_immutable_backup', JSON.stringify(tasks));
    } catch (_) {}
  }
}

/**
 * Recupera el respaldo local de tareas en caso de que alguna sincronización externa
 * haya intentado vaciar las tareas del usuario.
 */
export async function getLocalTasksBackup(): Promise<any[]> {
  try {
    const db = await openUserVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction(VAULT_STORES.TASKS_BACKUP, 'readonly');
      const store = tx.objectStore(VAULT_STORES.TASKS_BACKUP);
      const req = store.getAll();
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          resolve(req.result);
        } else {
          resolve(getTasksFromStorageFallback());
        }
      };
      req.onerror = () => resolve(getTasksFromStorageFallback());
    });
  } catch (_) {
    return getTasksFromStorageFallback();
  }
}

function getTasksFromStorageFallback(): any[] {
  try {
    const raw = localStorage.getItem('dyser_vault_tasks_immutable_backup');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

// ============================================================================
// INSTANTÁNEAS DE SEGURIDAD PREVIAS A ACTUALIZACIÓN DE CÓDIGO
// ============================================================================

/**
 * Guarda una instantánea completa e inalterable del estado de los archivos del usuario
 * en IndexedDB inmediatamente antes de que el motor de Firebase aplique un nuevo bundle.
 */
export async function savePreUpdateSnapshot(snapshotData: Record<string, any>): Promise<void> {
  try {
    const db = await openUserVaultDB();
    const snapshotId = `snapshot-${Date.now()}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VAULT_STORES.SNAPSHOTS, 'readwrite');
      const store = tx.objectStore(VAULT_STORES.SNAPSHOTS);
      const req = store.put({
        snapshotId,
        timestamp: Date.now(),
        data: snapshotData,
      });

      req.onsuccess = () => {
        console.log('[UserVault] Instantánea de seguridad atómica creada exitosamente.');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[UserVault] No se pudo guardar instantánea en IndexedDB:', err);
  }
}
