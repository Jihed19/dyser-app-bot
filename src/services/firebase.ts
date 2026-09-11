import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { ChatSession, AcademicTask, StudentProfile } from '../types';
import { initialAcademicTasks, initialStudentProfile, initialNasserChatHistory } from '../data/mockData';

// Silenciar logs y advertencias internas de reconexión de Firestore para entornos en iframes o modo offline
setLogLevel('silent');

// Configuración provista por el usuario para dyser PWA
export const firebaseConfig = {
  apiKey: "AIzaSyDVYcCPprqScrPFgUi1ttqdyZFnkFgfIDI",
  authDomain: "dyser-c37d4.firebaseapp.com",
  projectId: "dyser-c37d4",
  storageBucket: "dyser-c37d4.firebasestorage.app",
  messagingSenderId: "319031093486",
  appId: "1:319031093486:web:e39398b034b533b336ebff",
  measurementId: "G-SDCSF823V9"
};

// Inicialización de la App de Firebase (Singleton)
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicialización de Firestore con Long Polling HTTP forzado para evitar fallos de WebChannel en iframes y proxies
export const db = (() => {
  try {
    return initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    });
  } catch (_) {
    return getFirestore(firebaseApp);
  }
})();

// Inicialización de Firebase Auth
export const auth = getAuth(firebaseApp);

// Inicialización de Analytics si el entorno lo soporta (evita errores en SSR o iframes restringidos)
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      try {
        getAnalytics(firebaseApp);
        console.log('[Firebase] Analytics inicializado correctamente para dyser.');
      } catch (err) {
        console.warn('[Firebase] Analytics no pudo activarse:', err);
      }
    }
  }).catch(() => {
    // Silencioso si no está disponible
  });
}

// -------------------------------------------------------------
// CLAVES DE CACHÉ LOCAL PARA RESILIENCIA OFFLINE
// -------------------------------------------------------------
const LOCAL_STORAGE_KEYS = {
  SESSIONS: 'dyser_firebase_chat_sessions_v1',
  TASKS: 'dyser_firebase_academic_tasks_v1',
  PROFILE: 'dyser_firebase_student_profile_v1',
};

// Sesión por defecto inicial (sin mensaje de bienvenida automático)
export const defaultInitialSession: ChatSession = {
  id: 'session-main',
  title: 'Nueva Conversación',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [], // Sin mensaje de bienvenida automático al iniciar el chat
  topic: 'General',
  isFavorite: false,
};

// -------------------------------------------------------------
// HISTORIAL DE CHATS MULTISESIÓN (FIRESTORE + CACHÉ LOCAL)
// -------------------------------------------------------------

/**
 * Guarda o actualiza una sesión completa de chat en Firebase Firestore.
 */
export async function saveChatSessionToFirestore(session: ChatSession): Promise<void> {
  // 1. Guardado en caché local inmediato para respuesta instantánea
  try {
    const localSessions = getLocalChatSessions();
    const existingIdx = localSessions.findIndex(s => s.id === session.id);
    if (existingIdx >= 0) {
      localSessions[existingIdx] = session;
    } else {
      localSessions.unshift(session);
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(localSessions));
  } catch (localErr) {
    console.warn('[Firebase] Fallo guardando en localStorage:', localErr);
  }

  // 2. Guardado en Firebase Firestore
  try {
    const sessionRef = doc(db, 'chat_sessions', session.id);
    await setDoc(sessionRef, {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt || Date.now(),
      topic: session.topic || 'General',
      isFavorite: !!session.isFavorite,
      messages: session.messages,
      lastSyncTimestamp: serverTimestamp(),
    }, { merge: true });
    console.log(`[Firebase Firestore] Sesión "${session.title}" guardada exitosamente en dyser-c37d4.`);
  } catch (error: any) {
    console.warn('[Firebase Firestore] Error sincronizando sesión a la nube (los datos se mantienen en caché local):', error?.message || error);
  }
}

/**
 * Elimina una sesión de chat tanto de Firestore como de la caché local.
 */
export async function deleteChatSessionFromFirestore(sessionId: string): Promise<void> {
  // 1. Limpieza local
  try {
    const localSessions = getLocalChatSessions().filter(s => s.id !== sessionId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(localSessions));
  } catch (err) {
    console.warn('[Firebase] Error al limpiar sesión local:', err);
  }

  // 2. Borrado en Firestore
  try {
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    await deleteDoc(sessionRef);
    console.log(`[Firebase Firestore] Sesión ${sessionId} eliminada en dyser-c37d4.`);
  } catch (error: any) {
    console.warn('[Firebase Firestore] Error eliminando en la nube:', error?.message || error);
  }
}

/**
 * Obtiene las sesiones guardadas localmente.
 */
export function getLocalChatSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Garantizar que ninguna sesión arranque con el mensaje de bienvenida de plantilla
        const sanitized = parsed.map((s: ChatSession) => ({
          ...s,
          messages: (s.messages || []).filter(m =>
            m && m.text &&
            !m.text.includes('Soy Nasser IA') &&
            !m.text.includes('Hola, Alejandro') &&
            m.id !== 'init-1'
          ),
        }));
        return sanitized;
      }
    }
  } catch (e) {
    console.warn('[Firebase] Error leyendo sesiones locales:', e);
  }
  return [defaultInitialSession];
}

/**
 * Suscripción en tiempo real a las sesiones de chat desde Firestore.
 * Si Firestore está vacío inicialmente, siembra la sesión por defecto.
 */
export function subscribeToChatSessions(callback: (sessions: ChatSession[]) => void): () => void {
  // Emitir inmediatamente lo local para evitar pantalla en blanco
  const localInitial = getLocalChatSessions();
  callback(localInitial);

  try {
    const sessionsCol = collection(db, 'chat_sessions');
    const q = query(sessionsCol, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const sessions: ChatSession[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: data.id || docSnap.id,
              title: data.title || 'Conversación sin título',
              createdAt: data.createdAt || Date.now(),
              updatedAt: data.updatedAt || Date.now(),
              messages: (Array.isArray(data.messages) ? data.messages : []).filter(
                (m: any) =>
                  m &&
                  m.text &&
                  !m.text.includes('Soy Nasser IA') &&
                  !m.text.includes('Hola, Alejandro') &&
                  m.id !== 'init-1'
              ),
              topic: data.topic,
              isFavorite: data.isFavorite,
            };
          });

          // Actualizar caché local
          localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
          callback(sessions);
        } else {
          // Si está vacía en Firestore, sembramos la sesión inicial
          saveChatSessionToFirestore(defaultInitialSession);
        }
      },
      (error) => {
        console.warn('[Firebase Firestore] onSnapshot no disponible (modo offline o reglas estrictas):', error?.message || error);
        // Mantiene los datos locales fluidos
        callback(getLocalChatSessions());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase] Fallo al suscribirse a chat_sessions:', err);
    return () => {};
  }
}

// -------------------------------------------------------------
// PERSISTENCIA DE TAREAS ACADÉMICAS (FIRESTORE + CACHÉ LOCAL)
// -------------------------------------------------------------

export function getLocalAcademicTasks(): AcademicTask[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Firebase] Error leyendo tareas locales:', e);
  }
  return initialAcademicTasks;
}

export async function saveAcademicTaskToFirestore(task: AcademicTask): Promise<void> {
  // Local first
  try {
    const tasks = getLocalAcademicTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.unshift(task);
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('[Firebase] Error guardando tarea local:', e);
  }

  // Firestore
  try {
    const taskRef = doc(db, 'academic_tasks', task.id);
    await setDoc(taskRef, {
      ...task,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e: any) {
    console.warn('[Firebase Firestore] Error guardando tarea en la nube:', e?.message || e);
  }
}

export async function deleteAcademicTaskFromFirestore(taskId: string): Promise<void> {
  try {
    const tasks = getLocalAcademicTasks().filter(t => t.id !== taskId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('[Firebase] Error borrando tarea local:', e);
  }

  try {
    await deleteDoc(doc(db, 'academic_tasks', taskId));
  } catch (e: any) {
    console.warn('[Firebase Firestore] Error borrando tarea en nube:', e?.message || e);
  }
}

export function subscribeToAcademicTasks(callback: (tasks: AcademicTask[]) => void): () => void {
  callback(getLocalAcademicTasks());

  try {
    const tasksCol = collection(db, 'academic_tasks');
    const unsubscribe = onSnapshot(
      tasksCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const tasks: AcademicTask[] = snapshot.docs.map(d => d.data() as AcademicTask);
          localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
          callback(tasks);
        } else {
          // Sembrar tareas iniciales en Firestore si la colección está vacía
          initialAcademicTasks.forEach(task => saveAcademicTaskToFirestore(task));
        }
      },
      (error) => {
        console.warn('[Firebase Firestore] Fallback local para tareas:', error?.message || error);
        callback(getLocalAcademicTasks());
      }
    );

    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// -------------------------------------------------------------
// PERSISTENCIA DE PERFIL DEL ESTUDIANTE
// -------------------------------------------------------------

export function getLocalStudentProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Firebase] Error leyendo perfil local:', e);
  }
  return initialStudentProfile;
}

export async function saveStudentProfileToFirestore(profile: StudentProfile): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {}

  try {
    const profileRef = doc(db, 'student_profiles', 'current_student');
    await setDoc(profileRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e: any) {
    console.warn('[Firebase Firestore] Error guardando perfil en nube:', e?.message || e);
  }
}

export function subscribeToStudentProfile(callback: (profile: StudentProfile) => void): () => void {
  callback(getLocalStudentProfile());

  try {
    const profileRef = doc(db, 'student_profiles', 'current_student');
    const unsubscribe = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StudentProfile;
          localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(data));
          callback(data);
        } else {
          saveStudentProfileToFirestore(initialStudentProfile);
        }
      },
      (error) => {
        console.warn('[Firebase Firestore] Fallback local para perfil:', error?.message || error);
        callback(getLocalStudentProfile());
      }
    );

    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}
