/**
 * Dyser Centralized Application Sync & Update Architecture (Firebase Firestore)
 * 
 * Regla de Arquitectura Estricta:
 * "La estructura, código y componentes de la aplicación se sincronizan centralmente
 * a través de Firebase. Cualquier actualización realizada mediante los prompts de
 * desarrollo se refleja de forma automática y transparente en los dispositivos de
 * los usuarios en tiempo real, sin necesidad de ningún panel de control interno dentro de la app."
 * 
 * Funcionamiento:
 * 1. Mantiene el manifiesto de versión y release en la colección 'app_system/runtime_release' de Firestore.
 * 2. Se suscribe en tiempo real mediante onSnapshot.
 * 3. Al detectar una actualización de código o componentes generada por prompts de desarrollo:
 *    - Activa el escudo protector de datos del usuario (Storage Shield).
 *    - Invalida cachés volátiles de red de la aplicación antigua.
 *    - Aplica la actualización de forma suave y transparente en el dispositivo del usuario,
 *      sin interrumpir actividades críticas (grabaciones de audio activas o salas de ensayo).
 *    - Cero paneles de administración ni botones intrusivos: 100% automático.
 */

import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { createPreUpdateSafetySnapshot, verifyVaultIntegrity } from './storageShield';

export interface AppRuntimeRelease {
  buildId: string;
  version: string;
  buildTimestamp: number;
  updatedBy: string;
  description: string;
  targetPlatform: string;
  modules: {
    community: string;
    nasserAI: string;
    blackboard: string;
    studyRooms: string;
    userVault: string;
  };
}

/**
 * Huella de la versión actual del código compilado en este entorno.
 * Se actualiza de forma determinista con cada iteración de desarrollo.
 */
export const CURRENT_LOCAL_RELEASE: AppRuntimeRelease = {
  buildId: 'dyser-release-2026.09.19-pwa-v2.5',
  version: '2.5.0-centralized-sync',
  buildTimestamp: 1789854500000,
  updatedBy: 'dyser-prompt-engine',
  description: 'Arquitectura de doble carril: Sincronización centralizada en Firebase y Almacén local blindado en IndexedDB',
  targetPlatform: 'web-pwa-mobile',
  modules: {
    community: 'v2.5-disser-code',
    nasserAI: 'v3.8-zero-preambles',
    blackboard: 'v2.2-latex-solver',
    studyRooms: 'v2.1-webrtc-rehearsal',
    userVault: 'v1.0-shielded-indexeddb',
  },
};

const SESSION_STORAGE_KEY_CURRENT_BUILD = 'dyser_active_runtime_build_id';
const UPDATE_CHECK_INTERVAL_MS = 60 * 1000; // Sondeo complementario de respaldo cada 60s

let isInitialized = false;
let unsubscribeSnapshot: (() => void) | null = null;
let isUpdating = false;

/**
 * Registra o sincroniza la versión actual en Firebase Firestore si es necesario.
 */
async function registerCurrentReleaseInFirebase(): Promise<void> {
  try {
    const releaseDocRef = doc(db, 'app_system', 'runtime_release');
    const existingSnap = await getDoc(releaseDocRef);

    if (!existingSnap.exists()) {
      // Si el documento central no existe, registrar el manifiesto actual
      await setDoc(releaseDocRef, {
        ...CURRENT_LOCAL_RELEASE,
        publishedAt: serverTimestamp(),
      });
      console.log('[AppSync] Manifiesto inicial de versión publicado en Firebase Firestore.');
    } else {
      const data = existingSnap.data() as AppRuntimeRelease;
      // Si la versión local es más reciente que la registrada en la nube, actualizar la nube
      if (CURRENT_LOCAL_RELEASE.buildTimestamp > (data.buildTimestamp || 0)) {
        await setDoc(releaseDocRef, {
          ...CURRENT_LOCAL_RELEASE,
          publishedAt: serverTimestamp(),
        }, { merge: true });
        console.log(`[AppSync] Nueva versión ${CURRENT_LOCAL_RELEASE.version} sincronizada en Firebase Firestore.`);
      }
    }
  } catch (err) {
    // Si hay restricciones de red o reglas de Firestore, se mantiene operando localmente
    console.warn('[AppSync] Aviso al comprobar versión central en Firebase (modo offline resiliente):', err);
  }
}

/**
 * Comprueba si el usuario se encuentra realizando una acción no interrumpible
 * (por ejemplo, grabando una clase en vivo con el micrófono o en sala de ensayo interactiva).
 */
function isUserInCriticalAction(): boolean {
  if (typeof window === 'undefined') return false;
  // Banderas en sessionStorage que indican acción activa
  const isRecording = sessionStorage.getItem('dyser_is_recording_active') === 'true';
  const isExamInProgress = sessionStorage.getItem('dyser_exam_active') === 'true';
  return isRecording || isExamInProgress;
}

/**
 * Ejecuta la actualización automática y transparente de los componentes y código.
 */
async function executeTransparentHotReload(remoteRelease: AppRuntimeRelease): Promise<void> {
  if (isUpdating) return;
  isUpdating = true;

  console.log(`[AppSync] Actualización automática detectada: "${remoteRelease.version}". Aplicando en segundo plano...`);

  try {
    // 1. PASO CRÍTICO: Asegurar todos los datos personales del usuario en IndexedDB antes de tocar nada
    await createPreUpdateSafetySnapshot();

    // 2. Limpiar únicamente las cachés de red del navegador para código JS/CSS (sin tocar IndexedDB ni localStorage protegido)
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        for (const key of cacheKeys) {
          // Solo borrar cachés de bundles de aplicación
          if (key.includes('dyser-code') || key.includes('vite') || key.includes('assets')) {
            await window.caches.delete(key);
          }
        }
      } catch (_) {}
    }

    // Guardar el nuevo ID de versión activa en la sesión del usuario
    sessionStorage.setItem(SESSION_STORAGE_KEY_CURRENT_BUILD, remoteRelease.buildId);

    // 3. Esperar un instante idóneo si el usuario está realizando una acción crítica
    if (isUserInCriticalAction()) {
      console.log('[AppSync] El usuario está en una sesión crítica (grabación/examen). Aplazando recarga transparente para cuando finalice.');
      const checkIdleInterval = setInterval(async () => {
        if (!isUserInCriticalAction()) {
          clearInterval(checkIdleInterval);
          applyReload();
        }
      }, 5000);
      return;
    }

    // 4. Aplicar la actualización de inmediato y de forma fluida
    applyReload();
  } catch (error) {
    console.warn('[AppSync] Fallo en el ciclo de actualización transparente:', error);
    isUpdating = false;
  }
}

function applyReload() {
  // Recarga transparente de la página para incorporar el nuevo bundle de código
  setTimeout(() => {
    window.location.reload();
  }, 300);
}

/**
 * Inicializa el Servicio Central de Actualizaciones Automáticas a través de Firebase.
 * Se suscribe a los cambios del documento en tiempo real y gestiona la sincronización.
 */
export function initAppSyncService(): () => void {
  if (typeof window === 'undefined' || isInitialized) {
    return () => {};
  }
  isInitialized = true;

  // 1. Verificar la integridad de los datos locales al arrancar
  verifyVaultIntegrity();

  // Guardar ID de build inicial en la sesión si no existía
  const activeBuild = sessionStorage.getItem(SESSION_STORAGE_KEY_CURRENT_BUILD);
  if (!activeBuild) {
    sessionStorage.setItem(SESSION_STORAGE_KEY_CURRENT_BUILD, CURRENT_LOCAL_RELEASE.buildId);
  }

  // 2. Publicar o verificar la versión actual en Firebase
  registerCurrentReleaseInFirebase();

  // 3. Suscribirse en tiempo real a Firebase Firestore para recibir actualizaciones de desarrollo
  try {
    const releaseDocRef = doc(db, 'app_system', 'runtime_release');

    unsubscribeSnapshot = onSnapshot(
      releaseDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const remoteRelease = snapshot.data() as AppRuntimeRelease;
        const currentActiveId = sessionStorage.getItem(SESSION_STORAGE_KEY_CURRENT_BUILD) || CURRENT_LOCAL_RELEASE.buildId;

        // Comprobar si hay una actualización pendiente más reciente
        if (
          remoteRelease.buildId &&
          remoteRelease.buildId !== currentActiveId &&
          (remoteRelease.buildTimestamp || 0) > CURRENT_LOCAL_RELEASE.buildTimestamp
        ) {
          executeTransparentHotReload(remoteRelease);
        }
      },
      (error) => {
        console.warn('[AppSync] Modo offline o listener de Firestore con error:', error?.message || error);
      }
    );
  } catch (err) {
    console.warn('[AppSync] No se pudo conectar el listener de actualización:', err);
  }

  // 4. Verificación de respaldo periódica por si el WebSocket de Firestore sufre microdesconexiones
  const intervalId = setInterval(() => {
    registerCurrentReleaseInFirebase();
  }, UPDATE_CHECK_INTERVAL_MS);

  return () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    clearInterval(intervalId);
    isInitialized = false;
  };
}

/**
 * Función ejecutada durante los prompts de desarrollo para transmitir una nueva actualización
 * a todos los dispositivos de los usuarios conectados a Firebase.
 */
export async function broadcastDevelopmentPromptUpdate(
  changeDescription: string,
  updatedModules?: Partial<AppRuntimeRelease['modules']>
): Promise<void> {
  const newRelease: AppRuntimeRelease = {
    ...CURRENT_LOCAL_RELEASE,
    buildId: `dyser-prompt-${Date.now()}`,
    buildTimestamp: Date.now(),
    description: changeDescription,
    modules: {
      ...CURRENT_LOCAL_RELEASE.modules,
      ...(updatedModules || {}),
    },
  };

  try {
    const releaseDocRef = doc(db, 'app_system', 'runtime_release');
    await setDoc(releaseDocRef, {
      ...newRelease,
      publishedAt: serverTimestamp(),
    });
    console.log(`[AppSync] Actualización por prompt emitida a Firebase Firestore: "${changeDescription}"`);
  } catch (err) {
    console.warn('[AppSync] Error transmitiendo actualización a Firebase:', err);
  }
}
