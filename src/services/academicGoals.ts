import { ActiveTab } from '../types';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface AcademicGoal {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  unit: string;
  iconName: 'mic' | 'camera' | 'bot' | 'palette' | 'calculator' | 'graduation-cap' | 'file-text' | 'check-square' | 'users' | 'presentation';
  targetTab: ActiveTab;
  badgeLabel: string;
  accentColor: string; // Tailwind color class or hex
  category: 'captura' | 'investigacion' | 'creacion' | 'evaluacion';
}

export interface GoalProgressItem {
  id: string;
  current: number;
  completed: boolean;
}

// Memoria volátil aislada por UID para lectura síncrona instantánea en la UI
const memoryGoalsCache = new Map<string, Record<string, GoalProgressItem>>();

// Si cambia el usuario o cierra sesión, limpiar la memoria volátil
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      memoryGoalsCache.clear();
    }
  });
}

// Catálogo maestro de metas académicas vinculadas 100% a las herramientas reales de dyser
const MASTER_GOALS_CATALOG: AcademicGoal[] = [
  // 1. Captura & Audio
  {
    id: 'goal-record-classes',
    title: 'Graba 3 clases en vivo',
    description: 'Registra el audio de tu cátedra para que Nasser AI genere la transcripción y apuntes limpios.',
    targetCount: 3,
    unit: 'clases',
    iconName: 'mic',
    targetTab: 'class-recorder',
    badgeLabel: 'Grabación',
    accentColor: 'rose',
    category: 'captura',
  },
  {
    id: 'goal-record-single',
    title: 'Graba 1 clase magistral en vivo',
    description: 'Transcribe íntegramente la sesión docente sin perder ninguna advertencia de examen.',
    targetCount: 1,
    unit: 'clase',
    iconName: 'mic',
    targetTab: 'class-recorder',
    badgeLabel: 'Grabación',
    accentColor: 'rose',
    category: 'captura',
  },

  // 2. Visión & Pizarras
  {
    id: 'goal-blackboard-photos',
    title: 'Analiza 3 fotos de pizarra con Nasser AI',
    description: 'Fotografía el pizarrón o esquemas de clase para extraer fórmulas y conceptos explicados.',
    targetCount: 3,
    unit: 'fotos',
    iconName: 'camera',
    targetTab: 'blackboard',
    badgeLabel: 'Pizarra IA',
    accentColor: 'amber',
    category: 'captura',
  },
  {
    id: 'goal-blackboard-deep',
    title: 'Digitaliza 2 apuntes o pizarras',
    description: 'Convierte notas manuscritas o diagramas del docente en texto ordenado y comprensible.',
    targetCount: 2,
    unit: 'pizarras',
    iconName: 'camera',
    targetTab: 'blackboard',
    badgeLabel: 'Pizarra IA',
    accentColor: 'amber',
    category: 'captura',
  },

  // 3. Tutoría & Investigación Nasser AI
  {
    id: 'goal-nasser-topics',
    title: 'Investiga 4 temas en Nasser AI',
    description: 'Profundiza en conceptos complejos con rigor científico, fact-checking y lenguaje natural.',
    targetCount: 4,
    unit: 'temas',
    iconName: 'bot',
    targetTab: 'nasser-ia',
    badgeLabel: 'Nasser IA',
    accentColor: 'blue',
    category: 'investigacion',
  },
  {
    id: 'goal-nasser-questions',
    title: 'Formula 3 consultas a Nasser AI',
    description: 'Despeja dudas teóricas o pide desgloses analíticos para tu próxima cátedra.',
    targetCount: 3,
    unit: 'consultas',
    iconName: 'bot',
    targetTab: 'nasser-ia',
    badgeLabel: 'Nasser IA',
    accentColor: 'blue',
    category: 'investigacion',
  },

  // 4. Nasser AI Studio
  {
    id: 'goal-studio-slides',
    title: 'Crea una presentación o PDF en Nasser AI Studio',
    description: 'Genera diapositivas 16:9 o documentos A4 vectoriales con IA o edición manual de precisión.',
    targetCount: 1,
    unit: 'documento',
    iconName: 'palette',
    targetTab: 'multimedia',
    badgeLabel: 'AI Studio',
    accentColor: 'orange',
    category: 'creacion',
  },
  {
    id: 'goal-studio-infographic',
    title: 'Diseña 1 póster o infografía en Nasser AI Studio',
    description: 'Diseña material visual de apoyo para tus exposiciones con paleta cromática profesional.',
    targetCount: 1,
    unit: 'diseño',
    iconName: 'palette',
    targetTab: 'multimedia',
    badgeLabel: 'AI Studio',
    accentColor: 'orange',
    category: 'creacion',
  },

  // 5. Solucionador de Problemas
  {
    id: 'goal-problem-solver',
    title: 'Resuelve 2 problemas complejos paso a paso',
    description: 'Aplica el método analítico con deducción paso a paso y comprobación de resultados.',
    targetCount: 2,
    unit: 'problemas',
    iconName: 'calculator',
    targetTab: 'problem-solver',
    badgeLabel: 'Solucionador',
    accentColor: 'emerald',
    category: 'investigacion',
  },

  // 6. Simulador de Exámenes
  {
    id: 'goal-exam-simulator',
    title: 'Practica 1 simulacro en el Simulador de Exámenes',
    description: 'Evalúa tu retención real con preguntas de opción múltiple y justificación explicativa.',
    targetCount: 1,
    unit: 'simulacro',
    iconName: 'graduation-cap',
    targetTab: 'exam-simulator',
    badgeLabel: 'Simulador',
    accentColor: 'purple',
    category: 'evaluacion',
  },

  // 7. Resúmenes & Método Cornell
  {
    id: 'goal-summary-cornell',
    title: 'Genera 1 resumen con el Método Cornell',
    description: 'Sintetiza lecturas extensas en notas marginales y preguntas de evocación activa.',
    targetCount: 1,
    unit: 'resumen',
    iconName: 'file-text',
    targetTab: 'summary',
    badgeLabel: 'Resúmenes',
    accentColor: 'cyan',
    category: 'captura',
  },

  // 8. Tareas y Entregas
  {
    id: 'goal-complete-tasks',
    title: 'Completa 2 tareas académicas de tu lista',
    description: 'Avanza y liquida asignaciones pendientes para mantener tu promedio en la cumbre.',
    targetCount: 2,
    unit: 'tareas',
    iconName: 'check-square',
    targetTab: 'tasks',
    badgeLabel: 'Entregas',
    accentColor: 'amber',
    category: 'evaluacion',
  },

  // 9. Estudio de Exposición
  {
    id: 'goal-exposition-practice',
    title: 'Practica 1 sesión de exposición oral con IA',
    description: 'Entrena tu oratoria, modulación de tiempo y responde preguntas simuladas del jurado.',
    targetCount: 1,
    unit: 'ensayo',
    iconName: 'presentation',
    targetTab: 'exposition-study',
    badgeLabel: 'Exposición',
    accentColor: 'indigo',
    category: 'evaluacion',
  },

  // 10. Salas de Estudio
  {
    id: 'goal-study-rooms',
    title: 'Únete o estudia en una Sala de Estudio',
    description: 'Comparte sesión con compañeros de facultad para resolver dudas en comunidad.',
    targetCount: 1,
    unit: 'sesión',
    iconName: 'users',
    targetTab: 'study-rooms',
    badgeLabel: 'Salas',
    accentColor: 'teal',
    category: 'creacion',
  },
];

// Grupos funcionales para asegurar una tríada balanceada cada día:
// Bucket 1: Captura & Organización (Grabación, Pizarras, Resúmenes)
const BUCKET_CAPTURA = MASTER_GOALS_CATALOG.filter((g) => g.category === 'captura');
// Bucket 2: Razonamiento & IA (Nasser IA, Solucionador de Problemas)
const BUCKET_INVESTIGACION = MASTER_GOALS_CATALOG.filter((g) => g.category === 'investigacion');
// Bucket 3: Creación & Práctica (AI Studio, Exámenes, Exposición, Tareas, Salas)
const BUCKET_CREACION_Y_EVALUACION = MASTER_GOALS_CATALOG.filter(
  (g) => g.category === 'creacion' || g.category === 'evaluacion'
);

/**
 * Obtiene la clave de fecha YYYY-MM-DD local
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Algoritmo de rotación diaria inteligente:
 * - Cambia automáticamente cada día de la semana.
 * - Al terminar los 7 días de la semana, se recicla combinándose con un desfase alternado (weekCycle),
 *   asegurando que el lunes de la semana 2 tenga una combinación diferente al lunes de la semana 1.
 */
export function getDailyGoalsForDate(date: Date = new Date()): AcademicGoal[] {
  // Días transcurridos desde un epoch fijo
  const epoch = new Date(2026, 0, 1).getTime();
  const currentDays = Math.floor((date.getTime() - epoch) / (1000 * 60 * 60 * 24));
  const dayOfWeek = (date.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
  const weekCycle = Math.floor(currentDays / 7) % 4; // Ciclos alternos de semana 0, 1, 2, 3

  // Selección de 1 meta de cada bucket balanceado con desfase determinista
  const index1 = (dayOfWeek + weekCycle) % BUCKET_CAPTURA.length;
  const index2 = (dayOfWeek + (weekCycle * 2) + 1) % BUCKET_INVESTIGACION.length;
  const index3 = (dayOfWeek + (weekCycle * 3) + 2) % BUCKET_CREACION_Y_EVALUACION.length;

  return [
    BUCKET_CAPTURA[index1],
    BUCKET_INVESTIGACION[index2],
    BUCKET_CREACION_Y_EVALUACION[index3],
  ];
}

/**
 * Carga el progreso de las metas de hoy desde el estado en memoria o entrega 0s si el usuario es nuevo.
 */
export function loadDailyGoalsProgress(goals: AcademicGoal[], dateKey: string = getLocalDateKey()): GoalProgressItem[] {
  const uid = auth.currentUser?.uid;
  if (uid && memoryGoalsCache.has(`${uid}_${dateKey}`)) {
    const cachedMap = memoryGoalsCache.get(`${uid}_${dateKey}`)!;
    return goals.map((g) => {
      const item = cachedMap[g.id];
      if (item) return item;
      return { id: g.id, current: 0, completed: false };
    });
  }

  return goals.map((g) => ({ id: g.id, current: 0, completed: false }));
}

/**
 * Guarda el progreso en Firestore para el usuario autenticado (users/{uid}/daily_goals/{dateKey}).
 */
export async function saveDailyGoalsProgress(dateKey: string, items: GoalProgressItem[]): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const map: Record<string, GoalProgressItem> = {};
  items.forEach((item) => {
    map[item.id] = item;
  });

  // Actualizar caché de memoria por UID
  memoryGoalsCache.set(`${uid}_${dateKey}`, map);

  // Guardar en Firestore
  try {
    const goalDocRef = doc(db, 'users', uid, 'daily_goals', dateKey);
    await setDoc(
      goalDocRef,
      {
        dateKey,
        items: map,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[AcademicGoals] Error guardando metas en Firestore:', err);
  }
}

/**
 * Suscripción reactiva en tiempo real a las metas del día en Firestore.
 */
export function subscribeToDailyGoalsProgress(
  goals: AcademicGoal[],
  dateKey: string,
  callback: (items: GoalProgressItem[]) => void
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback(goals.map((g) => ({ id: g.id, current: 0, completed: false })));
    return () => {};
  }

  try {
    const goalDocRef = doc(db, 'users', uid, 'daily_goals', dateKey);
    const unsubscribe = onSnapshot(
      goalDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const itemsMap: Record<string, GoalProgressItem> = data.items || {};
          memoryGoalsCache.set(`${uid}_${dateKey}`, itemsMap);

          const result = goals.map((g) => {
            const item = itemsMap[g.id];
            if (item) return item;
            return { id: g.id, current: 0, completed: false };
          });
          callback(result);
        } else {
          // Usuario nuevo o día nuevo sin metas completadas aún: estado limpio en 0
          callback(goals.map((g) => ({ id: g.id, current: 0, completed: false })));
        }
      },
      (error) => {
        console.warn('[AcademicGoals] Error suscripción a metas en Firestore:', error);
        callback(goals.map((g) => ({ id: g.id, current: 0, completed: false })));
      }
    );

    return unsubscribe;
  } catch (err) {
    callback(goals.map((g) => ({ id: g.id, current: 0, completed: false })));
    return () => {};
  }
}

/**
 * Registra automáticamente el uso real de una herramienta o función de la app.
 * Completa de forma estricta y transparente las metas activas del día cuando
 * el usuario ejecuta la acción correspondiente (sin botones manuales de trampa).
 */
export function recordGoalProgress(
  targetTabOrCategory: ActiveTab | string,
  amount: number = 1
): { updated: boolean; completedGoals: AcademicGoal[] } {
  if (typeof window === 'undefined') return { updated: false, completedGoals: [] };

  const dateKey = getLocalDateKey();
  const goals = getDailyGoalsForDate();
  const currentProgress = loadDailyGoalsProgress(goals, dateKey);

  let didUpdate = false;
  const newlyCompleted: AcademicGoal[] = [];

  const updatedProgress = currentProgress.map((item) => {
    const goal = goals.find((g) => g.id === item.id);
    if (!goal) return item;

    // Detectar coincidencia con la pestaña destino, categoría o identificador
    const isMatch =
      goal.targetTab === targetTabOrCategory ||
      goal.category === targetTabOrCategory ||
      goal.id === targetTabOrCategory;

    if (isMatch && !item.completed) {
      const nextCurrent = Math.min(goal.targetCount, (item.current || 0) + amount);
      const isNowCompleted = nextCurrent >= goal.targetCount;

      if (isNowCompleted && !item.completed) {
        newlyCompleted.push(goal);
      }
      didUpdate = true;

      return {
        ...item,
        current: nextCurrent,
        completed: isNowCompleted,
      };
    }
    return item;
  });

  if (didUpdate) {
    saveDailyGoalsProgress(dateKey, updatedProgress);

    // Notificar a toda la interfaz que hubo avance en las metas
    window.dispatchEvent(
      new CustomEvent('dyser-goals-updated', {
        detail: { progress: updatedProgress, newlyCompleted },
      })
    );
  }

  return { updated: didUpdate, completedGoals: newlyCompleted };
}

/**
 * Función pública para registrar acciones de usuario en cualquier componente
 */
export function trackGoalAction(targetTab: ActiveTab | string, amount: number = 1): void {
  if (typeof window === 'undefined') return;
  recordGoalProgress(targetTab, amount);
}

// Inicializar listener global para eventos de navegación o tracking desacoplado
if (typeof window !== 'undefined') {
  window.addEventListener('dyser-track-goal', ((e: CustomEvent) => {
    if (e.detail?.tab) {
      trackGoalAction(e.detail.tab, e.detail.amount || 1);
    }
  }) as EventListener);
}
