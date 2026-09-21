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
import { initialAcademicTasks, initialStudentProfile, initialNasserChatHistory, STUDENT_AVATAR } from '../data/mockData';
import { generateDisserCode } from './disserCodeService';
import { backupLocalTasksToVault } from './userVaultService';

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
// SESIÓN DE CHAT POR DEFECTO
// -------------------------------------------------------------
export const defaultInitialSession: ChatSession = {
  id: 'session-main',
  title: 'Nueva Conversación',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  topic: 'General',
  isFavorite: false,
};

// -------------------------------------------------------------
// HISTORIAL DE CHATS POR USUARIO (FIRESTORE: users/{uid}/chat_sessions)
// -------------------------------------------------------------

/**
 * Guarda o actualiza una sesión de chat en Firestore para el usuario autenticado.
 */
export async function saveChatSessionToFirestore(session: ChatSession, targetUid?: string): Promise<void> {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) return;

  try {
    const sessionRef = doc(db, 'users', uid, 'chat_sessions', session.id);
    await setDoc(sessionRef, {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt || Date.now(),
      topic: session.topic || 'General',
      isFavorite: !!session.isFavorite,
      messages: session.messages,
      userId: uid,
      lastSyncTimestamp: serverTimestamp(),
    }, { merge: true });
  } catch (error: any) {
    console.warn('[Firebase Firestore] Error guardando sesión de chat en la nube:', error?.message || error);
  }
}

/**
 * Elimina una sesión de chat de Firestore para el usuario autenticado.
 */
export async function deleteChatSessionFromFirestore(sessionId: string, targetUid?: string): Promise<void> {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) return;

  try {
    const sessionRef = doc(db, 'users', uid, 'chat_sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error: any) {
    console.warn('[Firebase Firestore] Error eliminando sesión:', error?.message || error);
  }
}

/**
 * Suscripción en tiempo real a las sesiones de chat del usuario autenticado en Firestore.
 */
export function subscribeToChatSessions(
  callback: (sessions: ChatSession[]) => void,
  targetUid?: string
): () => void {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) {
    callback([defaultInitialSession]);
    return () => {};
  }

  try {
    const sessionsCol = collection(db, 'users', uid, 'chat_sessions');
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
          callback(sessions);
        } else {
          // Si el usuario aún no tiene sesiones en Firestore, inicia limpio
          callback([defaultInitialSession]);
        }
      },
      (error) => {
        // En caso de que se requiera índice o reglas, reintentar sin orderBy
        try {
          onSnapshot(sessionsCol, (snap) => {
            const list: ChatSession[] = snap.docs.map(d => d.data() as ChatSession);
            list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            callback(list.length > 0 ? list : [defaultInitialSession]);
          });
        } catch (_) {
          callback([defaultInitialSession]);
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    callback([defaultInitialSession]);
    return () => {};
  }
}

// -------------------------------------------------------------
// PERSISTENCIA DE TAREAS ACADÉMICAS AISLADAS (FIRESTORE: users/{uid}/academic_tasks)
// -------------------------------------------------------------

export function getLocalAcademicTasks(): AcademicTask[] {
  // Retorna vacío por defecto para evitar arrastrar tareas globales previas
  return [];
}

/**
 * Guarda una tarea académica en Firestore filtrada por el UID único del usuario autenticado.
 */
export async function saveAcademicTaskToFirestore(task: AcademicTask, targetUid?: string): Promise<void> {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) {
    console.warn('[Firebase] No hay UID autenticado para guardar la tarea');
    return;
  }

  try {
    const taskRef = doc(db, 'users', uid, 'academic_tasks', task.id);
    await setDoc(taskRef, {
      ...task,
      userId: uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e: any) {
    console.warn('[Firebase Firestore] Error guardando tarea en la nube:', e?.message || e);
  }
}

/**
 * Elimina una tarea académica de Firestore para el usuario autenticado.
 */
export async function deleteAcademicTaskFromFirestore(taskId: string, targetUid?: string): Promise<void> {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) return;

  try {
    await deleteDoc(doc(db, 'users', uid, 'academic_tasks', taskId));
  } catch (e: any) {
    console.warn('[Firebase Firestore] Error borrando tarea en nube:', e?.message || e);
  }
}

/**
 * Suscripción en tiempo real a las tareas del usuario autenticado en Firestore.
 * Si el usuario es nuevo y no tiene registros, entrega [] exactamente (interfaz en cero).
 */
export function subscribeToAcademicTasks(
  callback: (tasks: AcademicTask[]) => void,
  targetUid?: string
): () => void {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }

  try {
    const tasksCol = collection(db, 'users', uid, 'academic_tasks');
    const unsubscribe = onSnapshot(
      tasksCol,
      (snapshot) => {
        const remoteTasks: AcademicTask[] = snapshot.docs.map(d => d.data() as AcademicTask);
        // Si no hay tareas, se entrega lista vacía [] sin arrastrar tareas globales
        remoteTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
        callback(remoteTasks);
      },
      (error) => {
        console.warn('[Firebase Firestore] Error en suscripción de tareas:', error?.message || error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (err) {
    callback([]);
    return () => {};
  }
}

// -------------------------------------------------------------
// PERSISTENCIA DE PERFIL DEL ESTUDIANTE (FIRESTORE: student_profiles/{uid})
// -------------------------------------------------------------

export function getLocalStudentProfile(): StudentProfile | null {
  return null;
}

/**
 * Guarda o actualiza el perfil del estudiante en Firestore vinculado al UID único.
 */
export async function saveStudentProfileToFirestore(
  profile: StudentProfile,
  targetUid?: string
): Promise<StudentProfile> {
  const uid = targetUid || profile.id || auth.currentUser?.uid;
  if (!uid) {
    throw new Error('No hay UID autenticado para guardar el perfil');
  }

  const disserCode = profile.dyserNumber || profile.disserCode || generateDisserCode(profile.name);
  const enrichedProfile: StudentProfile = {
    ...profile,
    id: uid,
    dyserNumber: disserCode,
    dyserCode: disserCode,
    disserCode: disserCode,
  };

  try {
    const profileRef = doc(db, 'student_profiles', uid);
    await setDoc(profileRef, {
      ...enrichedProfile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e: any) {
    console.warn('[Firebase Firestore] Error guardando perfil en nube:', e?.message || e);
  }

  return enrichedProfile;
}

export async function registerStudentProfile(
  profileData: Partial<StudentProfile> & { name: string },
  targetUid?: string
): Promise<StudentProfile> {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) {
    throw new Error('No hay sesión de usuario autenticada');
  }

  const cleanName = profileData.name.trim();
  const disserCode = generateDisserCode(cleanName);

  const fullProfile: StudentProfile = {
    id: uid,
    name: cleanName,
    avatar: STUDENT_AVATAR,
    program: profileData.program || 'Educación Superior',
    semester: profileData.semester || 'Ciclo Académico 2026',
    gpa: profileData.gpa ?? 0.0,
    attendanceRate: profileData.attendanceRate ?? 100,
    streakDays: profileData.streakDays ?? 1,
    completedTasksCount: 0,
    dyserNumber: disserCode,
    dyserCode: disserCode,
    disserCode: disserCode,
    onboardingCompleted: true,
    ...profileData,
  };

  return await saveStudentProfileToFirestore(fullProfile, uid);
}

/**
 * Suscripción en tiempo real al perfil del usuario autenticado en Firestore (student_profiles/{uid}).
 * Si el usuario es nuevo y no tiene perfil previo, entrega null (sin arrastrar a Alejandro).
 */
export function subscribeToStudentProfile(
  callback: (profile: StudentProfile | null) => void,
  targetUid?: string
): () => void {
  const uid = targetUid || auth.currentUser?.uid;
  if (!uid) {
    callback(null);
    return () => {};
  }

  try {
    const profileRef = doc(db, 'student_profiles', uid);
    const unsubscribe = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StudentProfile;
          const disserCode = data.dyserNumber || data.disserCode || generateDisserCode(data.name);
          const synchronizedProfile: StudentProfile = {
            ...data,
            id: uid,
            dyserNumber: disserCode,
            dyserCode: disserCode,
            disserCode: disserCode,
          };
          callback(synchronizedProfile);
        } else {
          // Aislamiento estricto: no sembramos datos de prueba
          callback(null);
        }
      },
      (error) => {
        console.warn('[Firebase Firestore] Error leyendo perfil del usuario:', error?.message || error);
        callback(null);
      }
    );

    return unsubscribe;
  } catch (err) {
    callback(null);
    return () => {};
  }
}
