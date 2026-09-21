/**
 * Servicio de Autenticación y Gestión de Sesión para Dyser PWA
 * Integra Firebase Authentication (Google + Email/Password) con Firestore y el almacenamiento local.
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, saveStudentProfileToFirestore } from './firebase';
import { StudentProfile } from '../types';
import { generateDisserCode } from './disserCodeService';
import { STUDENT_AVATAR } from '../data/mockData';

export const AUTH_STORAGE_KEYS = {
  AUTHENTICATED: 'dyser_user_authenticated',
  SESSION_PROFILE: 'dyser_user_session_profile',
  ONBOARDING_DONE: 'dyser_onboarding_completed',
} as const;

export interface OnboardingAnswers {
  studyLevel: 'primaria' | 'secundaria' | 'universidad';
  goalReason: string;
  dailyStudyMinutes: number;
  motivationalQuote: string;
  userName?: string;
  authProvider?: 'google' | 'password' | 'guest';
}

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
};

/**
 * Traduce códigos de error nativos de Firebase Auth a mensajes claros en español.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Contraseña incorrecta. Por favor verifica tu contraseña e inténtalo de nuevo.';
    case 'auth/user-not-found':
      return 'No existe ninguna cuenta registrada con este correo electrónico. Por favor regístrate en "Crear Cuenta".';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo electrónico. Inicia sesión con tu contraseña o continúa con Google.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'El formato de correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido inhabilitada. Contacta a soporte.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, espera unos momentos antes de reintentar.';
    case 'auth/network-request-failed':
      return 'Error de conexión a internet. Verifica tu red e inténtalo nuevamente.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'popup-closed';
    case 'auth/operation-not-allowed':
      return 'El método de autenticación no está habilitado en Firebase console.';
    default:
      return error.message || 'Error de autenticación. Por favor verifica tus datos.';
  }
}

/**
 * Inicia sesión con Google usando el proveedor oficial de Google Auth de Firebase.
 * Abre el selector de cuentas del dispositivo (prompt: 'select_account'),
 * captura el correo electrónico verificado del usuario y lo guarda vinculado a su UID en Firestore.
 */
export async function loginWithGoogle(): Promise<{
  user: AuthUser;
  isNewUser: boolean;
  profile?: StudentProfile;
}> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  provider.addScope('email');
  provider.addScope('profile');

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const cleanEmail = user.email || 'estudiante@dyser.edu';
    const cleanName = (user.displayName || cleanEmail.split('@')[0] || 'Estudiante Dyser').trim();
    const avatarUrl = user.photoURL || STUDENT_AVATAR;

    // 1. Guardar y vincular la cuenta en /users/{uid} en Firestore
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: cleanEmail,
          displayName: cleanName,
          photoURL: avatarUrl,
          emailVerified: user.emailVerified ?? true,
          authProvider: 'google',
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (usersErr) {
      console.warn('[AuthService] Advertencia guardando en /users:', usersErr);
    }

    // 2. Verificar y vincular el perfil del estudiante en Firestore
    const userDocRef = doc(db, 'student_profiles', user.uid);
    let userDocSnap;
    try {
      userDocSnap = await getDoc(userDocRef);
    } catch (snapErr) {
      console.warn('[AuthService] Advertencia consultando student_profiles por UID:', snapErr);
    }

    let isNewUser = true;
    let existingProfile: StudentProfile | undefined;

    if (userDocSnap && userDocSnap.exists()) {
      const data = userDocSnap.data() as StudentProfile;
      const disserCode = data.dyserNumber || data.disserCode || generateDisserCode(cleanName);

      existingProfile = {
        ...data,
        id: user.uid,
        email: cleanEmail,
        name: data.name || cleanName,
        avatar: avatarUrl || data.avatar || STUDENT_AVATAR,
        dyserNumber: disserCode,
        dyserCode: disserCode,
        disserCode: disserCode,
        authProvider: 'google',
      };

      try {
        await setDoc(
          userDocRef,
          {
            email: cleanEmail,
            avatar: existingProfile.avatar,
            name: existingProfile.name,
            authProvider: 'google',
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (updateErr) {
        console.warn('[AuthService] Advertencia actualizando student_profiles:', updateErr);
      }

      if (data.onboardingCompleted) {
        isNewUser = false;
        persistLocalSession(existingProfile);
      }
    } else {
      // Usuario nuevo con Google: sin datos previos, estado en cero
      const disserCode = generateDisserCode(cleanName);
      const draftProfile: StudentProfile = {
        id: user.uid,
        email: cleanEmail,
        name: cleanName,
        avatar: avatarUrl,
        program: 'Educación Superior',
        semester: 'Ciclo Académico 2026',
        gpa: 0.0,
        attendanceRate: 100,
        streakDays: 1,
        completedTasksCount: 0,
        dailyStudyMinutes: 0,
        dyserNumber: disserCode,
        dyserCode: disserCode,
        disserCode: disserCode,
        onboardingCompleted: false,
        authProvider: 'google',
      };

      try {
        await setDoc(
          userDocRef,
          {
            ...draftProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (createErr) {
        console.warn('[AuthService] Advertencia creando draft en student_profiles:', createErr);
      }

      existingProfile = draftProfile;
      isNewUser = true;
    }

    const authUser: AuthUser = {
      uid: user.uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: avatarUrl,
    };

    return { user: authUser, isNewUser, profile: existingProfile };
  } catch (error: any) {
    console.warn('[AuthService] Firebase Google signInWithPopup:', error?.code, error?.message);

    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      const canceledError = new Error('popup-closed');
      (canceledError as any).code = error.code;
      throw canceledError;
    }

    throw error;
  }
}

/**
 * Inicia sesión con Correo y Contraseña en Firebase Authentication.
 * Valida obligatoriamente la contraseña contra Firebase. Si es incorrecta o no coincide,
 * deniega el acceso con un error visible. Si es correcta, permite el acceso.
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{
  user: AuthUser;
  isNewUser: boolean;
  profile?: StudentProfile;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Por favor ingresa tu correo electrónico.');
  }
  if (!pass) {
    throw new Error('Por favor ingresa tu contraseña.');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = cred.user;

    // Consultar en Firestore el perfil por el UID estricto
    const userDocRef = doc(db, 'student_profiles', user.uid);
    const docSnap = await getDoc(userDocRef);

    let isNewUser = true;
    let profile: StudentProfile | undefined;

    if (docSnap.exists()) {
      const data = docSnap.data() as StudentProfile;
      if (data.onboardingCompleted) {
        isNewUser = false;
        profile = {
          ...data,
          id: user.uid,
          email: cleanEmail,
        };
        persistLocalSession(profile);
      }
    }

    const authUser: AuthUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || cleanEmail.split('@')[0],
      photoURL: user.photoURL || STUDENT_AVATAR,
    };

    return { user: authUser, isNewUser, profile };
  } catch (error: any) {
    console.warn('[AuthService] Error en loginWithEmail:', error?.code, error?.message);
    const friendlyMsg = getFriendlyAuthErrorMessage(error);
    const customErr = new Error(friendlyMsg);
    (customErr as any).code = error?.code;
    throw customErr;
  }
}

/**
 * Crea una cuenta nueva con Correo y Contraseña en Firebase Authentication.
 * Valida y exige una contraseña real guardada en Firebase Auth.
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  name?: string
): Promise<{
  user: AuthUser;
  isNewUser: true;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Por favor ingresa tu correo electrónico.');
  }
  if (!pass || pass.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const user = cred.user;
    const cleanName = (name || cleanEmail.split('@')[0] || 'Estudiante Dyser').trim();

    try {
      await updateProfile(user, {
        displayName: cleanName,
      });
    } catch (_) {}

    // Registrar en /users/{uid} en Firestore
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: cleanEmail,
          displayName: cleanName,
          photoURL: STUDENT_AVATAR,
          authProvider: 'password',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (uErr) {
      console.warn('[AuthService] Advertencia guardando en /users:', uErr);
    }

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: cleanName,
        photoURL: STUDENT_AVATAR,
      },
      isNewUser: true,
    };
  } catch (error: any) {
    console.warn('[AuthService] Error en registerWithEmail:', error?.code, error?.message);
    const friendlyMsg = getFriendlyAuthErrorMessage(error);
    const customErr = new Error(friendlyMsg);
    (customErr as any).code = error?.code;
    throw customErr;
  }
}

/**
 * Guarda las respuestas del cuestionario interactivo y crea el perfil en Firestore
 * vinculado estrictamente al UID del usuario autenticado.
 */
export async function completeStudentOnboarding(
  user: { uid?: string; email?: string | null; displayName?: string | null; photoURL?: string | null },
  answers: OnboardingAnswers
): Promise<StudentProfile> {
  const currentUid = user.uid || auth.currentUser?.uid;
  if (!currentUid) {
    throw new Error('No hay una sesión de usuario autenticada');
  }

  const studentName = (answers.userName || user.displayName || user.email?.split('@')[0] || 'Estudiante Dyser').trim();
  const disserCode = generateDisserCode(studentName);

  const programName =
    answers.studyLevel === 'universidad'
      ? 'Educación Superior Universitaria'
      : answers.studyLevel === 'secundaria'
      ? 'Secundaria y Bachillerato'
      : 'Educación Primaria Escolar';

  const fullProfile: StudentProfile = {
    id: currentUid,
    email: user.email || auth.currentUser?.email || '',
    name: studentName,
    avatar: user.photoURL || auth.currentUser?.photoURL || STUDENT_AVATAR,
    program: programName,
    semester: answers.studyLevel === 'universidad' ? '1er Semestre' : 'Ciclo Académico 2026',
    gpa: 0.0,
    attendanceRate: 100,
    streakDays: 1,
    completedTasksCount: 0,
    dyserNumber: disserCode,
    dyserCode: disserCode,
    disserCode: disserCode,
    onboardingCompleted: true,
    studyLevel: answers.studyLevel,
    goalReason: answers.goalReason,
    dailyStudyMinutes: answers.dailyStudyMinutes || 120,
    motivationalQuote: answers.motivationalQuote,
    authProvider: answers.authProvider || (auth.currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'password'),
  };

  // 1. Guardar en Firestore con identificador del UID en student_profiles y users
  try {
    const userRef = doc(db, 'student_profiles', currentUid);
    await setDoc(userRef, {
      ...fullProfile,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    const userAccountRef = doc(db, 'users', currentUid);
    await setDoc(userAccountRef, {
      uid: currentUid,
      email: fullProfile.email,
      displayName: fullProfile.name,
      photoURL: fullProfile.avatar,
      authProvider: fullProfile.authProvider,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[AuthService] Advertencia guardando en Firestore:', err);
  }

  // 2. Guardar a través del servicio de perfil de Firebase
  const savedProfile = await saveStudentProfileToFirestore(fullProfile, currentUid);

  // 3. Persistir sesión activa en el dispositivo
  persistLocalSession(savedProfile);

  return savedProfile;
}

/**
 * Guarda los indicadores de sesión en localStorage para persistencia segura.
 */
export function persistLocalSession(profile: StudentProfile): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTHENTICATED, 'true');
    localStorage.setItem(AUTH_STORAGE_KEYS.ONBOARDING_DONE, 'true');
    localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.warn('[AuthService] Error al guardar sesión local:', e);
  }
}

/**
 * Comprueba si existe una sesión activa y completada en el dispositivo.
 */
export function isUserSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  const isAuth = localStorage.getItem(AUTH_STORAGE_KEYS.AUTHENTICATED) === 'true';
  const isDone = localStorage.getItem(AUTH_STORAGE_KEYS.ONBOARDING_DONE) === 'true';
  return isAuth && isDone;
}

/**
 * Obtiene el perfil de la sesión actual almacenada en el dispositivo.
 */
export function getSavedSessionProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

/**
 * Cierra la sesión activa en Firebase y limpia las claves de sesión local,
 * asegurando aislamiento total entre usuarios.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('[AuthService] Error al cerrar sesión en Firebase:', e);
  }

  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.AUTHENTICATED);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ONBOARDING_DONE);
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_PROFILE);
    // Limpiar claves legacy para garantizar cero arrastre entre cuentas
    localStorage.removeItem('dyser_firebase_academic_tasks_v1');
    localStorage.removeItem('dyser_firebase_student_profile_v1');
    localStorage.removeItem('dyser_firebase_chat_sessions_v1');
    localStorage.removeItem('dyser_vault_tasks_immutable_backup');
    sessionStorage.clear();
  } catch (_) {}
}

/**
 * Escucha cambios de estado de Firebase Auth.
 */
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
