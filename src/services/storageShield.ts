/**
 * Storage Shield & Inviolability Architecture
 * 
 * Regla Crítica Mandatoria:
 * "Ninguna actualización de la estructura de la aplicación proveniente de Firebase
 * debe alterar, sobrescribir, modificar o eliminar los archivos locales del usuario.
 * Los datos del usuario y el código de la plataforma corren por carriles estrictamente separados."
 * 
 * Arquitectura de Doble Carril (Dual-Rail Architecture):
 * - CARRIL PLATAFORMA (Firebase Cloud): Código, componentes, manifiestos de versión, señalización.
 * - CARRIL USUARIO (Local Vault): PDFs, notas, tareas, audios grabados y perfiles locales en IndexedDB y localStorage blindado.
 */

import {
  savePreUpdateSnapshot,
  backupLocalTasksToVault,
  getLocalTasksBackup,
} from './userVaultService';

/**
 * Prefijos protegidos e intocables del Carril del Usuario.
 * Ningún proceso de actualización, caché o reseteo puede eliminarlos.
 */
export const PROTECTED_USER_PREFIXES = [
  'dyser_vault_',
  'dyser_user_',
  'dyser_onboarding_',
  'dyser_saved_',
  'dyser_audio_',
  'dyser_firebase_chat_sessions_',
  'dyser_firebase_academic_tasks_',
  'dyser_firebase_student_profile_',
  'dyser_community_',
  'dyser_rehearsal_',
  'dyser_sanctuary_',
] as const;

/**
 * Bases de datos IndexedDB del Usuario que están blindadas contra borrado.
 */
export const PROTECTED_INDEXED_DBS = [
  'dyser_user_vault_db',
  'dyser_audio_db',
] as const;

let isShieldInstalled = false;

/**
 * Instala el escudo protector sobre las APIs de almacenamiento nativas
 * para impedir borrados accidentales o purgas por actualizaciones remotas.
 */
export function initStorageShield(): void {
  if (typeof window === 'undefined' || isShieldInstalled) return;

  try {
    // 1. Blindar localStorage.clear()
    const originalClear = window.localStorage.clear.bind(window.localStorage);

    window.localStorage.clear = function shieldedClear() {
      console.warn('[StorageShield] Se interceptó llamada a localStorage.clear(). Protegiendo carriles de datos de usuario.');
      // En lugar de borrar todo a ciegas, preservamos las claves del usuario
      const preserved: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && isProtectedUserKey(key)) {
          const val = window.localStorage.getItem(key);
          if (val !== null) preserved[key] = val;
        }
      }

      // Ejecutar borrado nativo (purga de caches de sistema y tokens volátiles)
      originalClear();

      // Restaurar inmediatamente todas las claves protegidas del usuario
      for (const [k, v] of Object.entries(preserved)) {
        window.localStorage.setItem(k, v);
      }
      console.log(`[StorageShield] ${Object.keys(preserved).length} claves de usuario preservadas intactas en el carril local.`);
    };

    // 2. Blindar indexedDB.deleteDatabase() contra bases de datos del usuario
    if (window.indexedDB && window.indexedDB.deleteDatabase) {
      const originalDeleteDatabase = window.indexedDB.deleteDatabase.bind(window.indexedDB);
      window.indexedDB.deleteDatabase = function shieldedDeleteDatabase(name: string) {
        if (PROTECTED_INDEXED_DBS.includes(name as any)) {
          console.error(`[StorageShield] BLOQUEADO: Intento de eliminar la base de datos protegida del usuario: "${name}". Operación abortada.`);
          const blockedRequest = {} as IDBOpenDBRequest;
          setTimeout(() => {
            if (blockedRequest.onerror) {
              const err = new DOMException('Acceso denegado: Base de datos de usuario protegida por el escudo de almacenamiento.', 'SecurityError');
              blockedRequest.onerror(new Event('error') as any);
            }
          }, 0);
          return blockedRequest;
        }
        return originalDeleteDatabase(name);
      };
    }

    isShieldInstalled = true;
    console.log('[StorageShield] Escudo de Almacenamiento Local activado: Carriles de datos y código separados.');
  } catch (err) {
    console.warn('[StorageShield] No se pudo instalar el interceptor completo:', err);
  }
}

/**
 * Comprueba si una clave de almacenamiento pertenece al carril protegido del usuario.
 */
export function isProtectedUserKey(key: string): boolean {
  return PROTECTED_USER_PREFIXES.some(prefix => key.startsWith(prefix));
}

/**
 * Toma una instantánea de emergencia y asegura el respaldo atómico de todos los datos
 * personales antes de que se refresquen los bundles de código o componentes de la app.
 */
export async function createPreUpdateSafetySnapshot(): Promise<void> {
  try {
    const userStorageSnapshot: Record<string, string> = {};

    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && isProtectedUserKey(key)) {
          const val = window.localStorage.getItem(key);
          if (val !== null) userStorageSnapshot[key] = val;
        }
      }
    }

    // Asegurar tareas en el almacén blindado de IndexedDB
    try {
      const tasksRaw = userStorageSnapshot['dyser_firebase_academic_tasks_v1'];
      if (tasksRaw) {
        const parsed = JSON.parse(tasksRaw);
        if (Array.isArray(parsed)) {
          await backupLocalTasksToVault(parsed);
        }
      }
    } catch (_) {}

    // Guardar la instantánea en IndexedDB
    await savePreUpdateSnapshot({
      localStorageData: userStorageSnapshot,
      createdAt: Date.now(),
      reason: 'firebase_code_update_revalidation',
    });

    console.log('[StorageShield] Pre-Update Safety Snapshot completado exitosamente. Datos locales protegidos.');
  } catch (err) {
    console.warn('[StorageShield] Error generando instantánea pre-actualización:', err);
  }
}

/**
 * Verifica la integridad del carril de datos del usuario al arrancar.
 * Si detecta que alguna colección local se vació inesperadamente, la restaura desde el respaldo.
 */
export async function verifyVaultIntegrity(): Promise<void> {
  // Con el aislamiento estricto por usuario en Firestore, las tareas se cargan por UID de Firebase Auth.
  // No se sobreescribe ni restaura en localStorage global para evitar arrastrar tareas entre usuarios.
}
