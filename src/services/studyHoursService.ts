import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface DayStudyData {
  day: string;
  shortDay: string;
  dayIndex: number; // 0 = Lunes, 6 = Domingo
  dateStr: string; // YYYY-MM-DD
  hours: number;
  subject: string;
  sessions: number;
  isToday?: boolean;
}

const DAY_NAMES = [
  { day: 'Lunes', shortDay: 'Lun' },
  { day: 'Martes', shortDay: 'Mar' },
  { day: 'Miércoles', shortDay: 'Mié' },
  { day: 'Jueves', shortDay: 'Jue' },
  { day: 'Viernes', shortDay: 'Vie' },
  { day: 'Sábado', shortDay: 'Sáb' },
  { day: 'Domingo', shortDay: 'Dom' },
];

/**
 * Calcula la clave de la semana en formato YYYY-Www (ej. 2026-W38)
 */
export function getWeekKey(weekOffset: 0 | 1 = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - weekOffset * 7);
  // Ajustar al lunes de esa semana
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const year = monday.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((monday.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((monday.getDay() + 1 + numberOfDays) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Genera la plantilla de días vacía (0 horas) para la semana solicitada
 */
export function getEmptyWeekDays(weekOffset: 0 | 1 = 0): DayStudyData[] {
  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7; // 0 = Lunes ... 6 = Domingo

  const d = new Date();
  d.setDate(d.getDate() - weekOffset * 7);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  return DAY_NAMES.map((item, idx) => {
    const curDate = new Date(monday);
    curDate.setDate(monday.getDate() + idx);
    const dateStr = curDate.toISOString().split('T')[0];
    const isToday = weekOffset === 0 && idx === todayDayIndex;

    return {
      day: item.day,
      shortDay: item.shortDay,
      dayIndex: idx,
      dateStr,
      hours: 0,
      subject: 'Sin sesiones',
      sessions: 0,
      isToday,
    };
  });
}

/**
 * Memoria volátil aislada por UID y semana para render instantáneo
 */
const studyHoursCache = new Map<string, DayStudyData[]>();

if (typeof window !== 'undefined') {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      studyHoursCache.clear();
    }
  });
}

/**
 * Carga síncrona inicial de horas de estudio de la semana (vacía en 0 si no hay registro)
 */
export function getInitialWeekStudyData(weekOffset: 0 | 1 = 0): DayStudyData[] {
  const uid = auth.currentUser?.uid;
  const weekKey = getWeekKey(weekOffset);
  if (uid && studyHoursCache.has(`${uid}_${weekKey}`)) {
    return studyHoursCache.get(`${uid}_${weekKey}`)!;
  }
  return getEmptyWeekDays(weekOffset);
}

/**
 * Suscripción reactiva en tiempo real a las horas de estudio del usuario en Firestore.
 * Si el usuario es nuevo o no tiene documentos, emite la semana completamente en 0 horas.
 */
export function subscribeToWeeklyStudyHours(
  weekOffset: 0 | 1,
  callback: (data: DayStudyData[]) => void
): () => void {
  const uid = auth.currentUser?.uid;
  const weekKey = getWeekKey(weekOffset);
  const emptyWeek = getEmptyWeekDays(weekOffset);

  if (!uid) {
    callback(emptyWeek);
    return () => {};
  }

  try {
    const docRef = doc(db, 'users', uid, 'study_weekly', weekKey);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rawDays: Record<string, { hours: number; sessions: number; subject?: string }> =
            docSnap.data()?.days || {};

          const merged = emptyWeek.map((dayItem) => {
            const saved = rawDays[String(dayItem.dayIndex)];
            if (saved) {
              return {
                ...dayItem,
                hours: Number(saved.hours || 0),
                sessions: Number(saved.sessions || 0),
                subject: saved.subject || 'Estudio individual',
              };
            }
            return dayItem;
          });

          studyHoursCache.set(`${uid}_${weekKey}`, merged);
          callback(merged);
        } else {
          // Cuenta nueva sin horas de estudio: emite 0 horas en toda la gráfica
          studyHoursCache.set(`${uid}_${weekKey}`, emptyWeek);
          callback(emptyWeek);
        }
      },
      (err) => {
        console.warn('[StudyHoursService] Error en snapshot de horas de estudio:', err);
        callback(emptyWeek);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[StudyHoursService] Error al suscribirse a horas de estudio:', err);
    callback(emptyWeek);
    return () => {};
  }
}

/**
 * Registra tiempo de estudio (en minutos) en Firestore bajo el usuario autenticado
 */
export async function logStudyMinutes(minutes: number, subject: string = 'Sesión Dyser'): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || minutes <= 0) return;

  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // 0 = Lunes
  const weekKey = getWeekKey(0);

  try {
    const docRef = doc(db, 'users', uid, 'study_weekly', weekKey);
    const snap = await getDoc(docRef);
    const existingDays = snap.exists() ? snap.data()?.days || {} : {};

    const currentDay = existingDays[String(dayIndex)] || { hours: 0, sessions: 0, subject };
    const addHours = Number((minutes / 60).toFixed(2));
    const newHours = Number((currentDay.hours + addHours).toFixed(1));
    const newSessions = currentDay.sessions + 1;

    existingDays[String(dayIndex)] = {
      hours: newHours,
      sessions: newSessions,
      subject,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(
      docRef,
      {
        weekKey,
        days: existingDays,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[StudyHoursService] Error guardando minutos de estudio en Firestore:', err);
  }
}
