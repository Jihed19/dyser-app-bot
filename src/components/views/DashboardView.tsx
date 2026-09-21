import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Sparkles,
  Clock,
  ArrowRight,
  Star,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  Target,
  Award,
  FileText,
  Bot,
  Calculator,
  Presentation,
  Mic,
  Camera,
  BookOpen,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { ActiveTab, StudentProfile, AcademicTask } from '../../types';
import { sounds } from '../../services/soundEffects';
import { DailyGoalsSection } from '../dashboard/DailyGoalsSection';
import { WeeklyStudyBarChart } from '../dashboard/WeeklyStudyBarChart';
import { getLocalDateKey, getDailyGoalsForDate } from '../../services/academicGoals';
import { DyserLogo } from '../Header';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

/**
 * Comprueba si el usuario ya vio el popup de metas hoy.
 * Utiliza claves de fecha persistentes en localStorage por usuario y por fecha.
 */
function hasSeenGoalsPopupToday(userId: string, todayDateKey: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    // 1. Clave estándar por usuario: last_popup_date_{userId}
    const userLastDate = localStorage.getItem(`last_popup_date_${userId}`) || localStorage.getItem(`dyser_goals_last_popup_date_${userId}`);
    if (userLastDate === todayDateKey) return true;

    // 2. Clave con formato exacto de fecha solicitada: last_popup_date_YYYY-MM-DD
    if (localStorage.getItem(`last_popup_date_${todayDateKey}`) === 'true') return true;

    // 3. Clave compuesta por usuario y fecha
    if (localStorage.getItem(`last_popup_date_${userId}_${todayDateKey}`) === 'true') return true;
  } catch (e) {
    console.warn('Error comprobando registro local de popup de metas:', e);
  }
  return false;
}

/**
 * Registra que el popup de metas se mostró hoy para este usuario,
 * garantizando que al cerrar y volver a entrar ese mismo día NO se vuelva a mostrar.
 */
function markGoalsPopupAsSeenToday(userId: string, todayDateKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    // Guardar en localStorage con la fecha actual y las claves solicitadas
    localStorage.setItem(`last_popup_date_${userId}`, todayDateKey);
    localStorage.setItem(`dyser_goals_last_popup_date_${userId}`, todayDateKey);
    localStorage.setItem(`last_popup_date_${todayDateKey}`, 'true');
    localStorage.setItem(`last_popup_date_${userId}_${todayDateKey}`, 'true');
  } catch (e) {
    console.warn('Error guardando registro local de popup de metas:', e);
  }

  // Sincronizar en Firestore bajo el UID del usuario (users/{uid}/preferences/daily_goals_popup)
  if (userId && userId !== 'guest' && userId !== 'default_user') {
    try {
      const prefRef = doc(db, 'users', userId, 'preferences', 'daily_goals_popup');
      setDoc(
        prefRef,
        {
          lastShownDate: todayDateKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => {
        console.warn('[DashboardView] Error sincronizando fecha de popup en Firestore:', err);
      });
    } catch (_) {}
  }
}

interface SemesterTaskDonutChartProps {
  tasks: AcademicTask[];
  semesterName?: string;
  totalSemesterGoal?: number;
}

interface SliceData {
  name: string;
  count: number;
  color: string;
  gradientId: string;
  description: string;
}

export const SemesterTaskDonutChart: React.FC<SemesterTaskDonutChartProps> = ({
  tasks,
  semesterName = 'Semestre VI - 2026',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<SliceData | null>(null);
  const chartId = useId().replace(/:/g, '');

  const currentCompleted = tasks.filter((t) => t.status === 'completada').length;
  const currentPending = tasks.filter((t) => t.status === 'pendiente').length;
  const currentInProgress = tasks.filter((t) => t.status === 'en_progreso').length;

  const totalCompleted = currentCompleted;
  const totalPending = currentPending + currentInProgress;
  const totalTracked = totalCompleted + totalPending;

  const percentage = totalTracked > 0 ? Math.min(100, Math.round((totalCompleted / totalTracked) * 100)) : 0;

  const dataset: SliceData[] = [
    {
      name: 'Completadas',
      count: totalCompleted,
      color: '#10b981',
      gradientId: `grad-completed-${chartId}`,
      description: 'Entregas verificadas y aprobadas',
    },
    {
      name: 'En Progreso / Pendientes',
      count: totalPending,
      color: '#fe6b00',
      gradientId: `grad-pending-${chartId}`,
      description: 'Asignaciones activas con fecha límite',
    },
  ].filter((d) => d.count > 0);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 130;
    const height = 130;
    const margin = 4;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.70;

    const defs = svg.append('defs');

    const gradCompleted = defs
      .append('linearGradient')
      .attr('id', `grad-completed-${chartId}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    gradCompleted.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    gradCompleted.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    const gradPending = defs
      .append('linearGradient')
      .attr('id', `grad-pending-${chartId}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    gradPending.append('stop').attr('offset', '0%').attr('stop-color', '#fb923c');
    gradPending.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Anillo base sutil para cuando no hay tareas o como fondo
    const bgArc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    g.append('path')
      .attr('d', bgArc as any)
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', dataset.length === 0 ? '4 4' : 'none')
      .attr('class', 'dark:stroke-gray-800');

    if (dataset.length > 0) {
      const pie = d3
        .pie<SliceData>()
        .value((d) => d.count)
        .sort(null)
        .padAngle(0.04);

      const arc = d3
        .arc<d3.PieArcDatum<SliceData>>()
        .innerRadius(innerRadius)
        .outerRadius(radius)
        .cornerRadius(4);

      const arcHover = d3
        .arc<d3.PieArcDatum<SliceData>>()
        .innerRadius(innerRadius - 1)
        .outerRadius(radius + 4)
        .cornerRadius(5);

      g.selectAll('path.slice')
        .data(pie(dataset))
        .enter()
        .append('path')
        .attr('class', 'slice')
        .attr('d', arc)
        .attr('fill', (d) => `url(#${d.data.gradientId})`)
        .style('cursor', 'pointer')
        .style('filter', 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))')
        .on('mouseenter', function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arcHover as any)
            .style('filter', 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))');
          setHoveredSlice(d.data);
        })
        .on('mouseleave', function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arc as any)
            .style('filter', 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))');
          setHoveredSlice(null);
        });
    }
  }, [dataset, chartId]);

  return (
    <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-2xs h-[275px] sm:h-[300px] flex flex-col justify-between overflow-hidden transition-colors w-full">
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Award className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
            Progreso Semestre
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/40 px-1.5 py-0.5 rounded-md shrink-0">
          {percentage}% Meta
        </span>
      </div>

      {/* Círculo D3 Donut Chart central simétrico */}
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center relative my-1">
        <div className="relative w-[130px] h-[130px] flex items-center justify-center">
          <svg ref={svgRef} width={130} height={130} className="overflow-visible" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            {hoveredSlice ? (
              <div className="animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block truncate">
                  {hoveredSlice.name}
                </span>
                <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  {hoveredSlice.count}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  {percentage}%
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {totalCompleted} de {totalTracked}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pie de gráfico simétrico con chips de estado */}
      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-gray-100 dark:border-gray-800">
        <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 truncate">
          ✓ {totalCompleted} Listas
        </span>
        <span className="font-bold px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-[#fe6b00] truncate">
          ⏱ {totalPending} Activas
        </span>
      </div>
    </div>
  );
};

interface DashboardViewProps {
  student: StudentProfile;
  tasks: AcademicTask[];
  onToggleTask?: (taskId: string) => void;
  onNavigateTo: (tab: ActiveTab) => void;
  onOpenStreak?: () => void;
}

const STUDY_TIPS = [
  {
    title: 'Técnica Feynman',
    desc: 'Intenta explicar el concepto más difícil en palabras sencillas como si se lo enseñaras a un compañero novato. Las lagunas en tu explicación te indicarán exactamente qué temas necesitas reforzar.',
  },
  {
    title: 'Bloques Pomodoro y Descanso',
    desc: 'Estudiar en intervalos de 25 minutos de foco absoluto seguidos de 5 minutos de descanso activo previene la fatiga mental y maximiza la retención de memoria.',
  },
  {
    title: 'Evocación Activa (Active Recall)',
    desc: 'En lugar de releer apuntes de forma pasiva, cierra el material e intenta reconstruir mentalmente o por escrito todos los puntos clave. Fortalece las conexiones neuronales.',
  },
  {
    title: 'Repetición Espaciada',
    desc: 'Repasa el tema al día siguiente de aprenderlo, luego a los 3 días, a la semana y al mes. Esta frecuencia contrarresta la curva natural del olvido.',
  },
  {
    title: 'Preparación Previa a Clase',
    desc: 'Leer 10 minutos antes los temas del programa te permite asimilar la cátedra con mentalidad crítica y formular dudas de alto nivel con el docente.',
  },
  {
    title: 'Método de Notas Cornell',
    desc: 'Divide tu hoja en ideas clave a la izquierda, apuntes centrales a la derecha y un resumen de dos líneas al final para tener fichas de estudio listas.',
  },
  {
    title: 'Resolución Rigurosa de Ejercicios',
    desc: 'Antes de calcular, anota las variables conocidas, las incógnitas y el teorema aplicable. Desglosar por pasos previene el 80% de los fallos algebraicos.',
  },
  {
    title: 'Higiene del Sueño y Rendimiento',
    desc: 'Dormir entre 7 y 8 horas consolida la memoria de largo plazo en el hipocampo. Estudiar trasnochado reduce un 30% la capacidad analítica en evaluaciones.',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  tasks,
  onNavigateTo,
}) => {
  const pendingTasks = tasks.filter((t) => t.status !== 'completada');
  const completedTasks = tasks.filter((t) => t.status === 'completada');

  // El consejo cambia automáticamente cada vez que el estudiante ingresa al inicio
  const [tipIndex] = useState<number>(() => Math.floor(Math.random() * STUDY_TIPS.length));

  // Control inteligente del Modal de Metas (estrictamente una sola vez al día por usuario)
  const [dateKey] = useState<string>(() => getLocalDateKey());
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [isGoalsHighlighted, setIsGoalsHighlighted] = useState<boolean>(false);
  const goalsSectionRef = useRef<HTMLElement | null>(null);

  // Metas del día para la vista previa del modal
  const todayGoalsPreview = useMemo(() => getDailyGoalsForDate(), [dateKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const checkAndTriggerDailyPopup = async (uid: string) => {
      // 1. Verificación instantánea local (evita parpadeos al recargar la app)
      if (hasSeenGoalsPopupToday(uid, dateKey)) {
        return;
      }

      // 2. Si no está en local pero hay usuario autenticado en Firestore, consultar por si ya se mostró en otro dispositivo
      if (uid && uid !== 'guest' && uid !== 'default_user') {
        try {
          const prefRef = doc(db, 'users', uid, 'preferences', 'daily_goals_popup');
          const snap = await getDoc(prefRef);
          if (snap.exists() && snap.data()?.lastShownDate === dateKey) {
            markGoalsPopupAsSeenToday(uid, dateKey);
            return;
          }
        } catch (_) {}
      }

      if (!isMounted) return;

      // 3. No se ha mostrado hoy: se muestra el popup exactamente una vez al día
      setShowWelcomeModal(true);
      sounds.playNotification();

      // Guardar inmediatamente el registro de hoy para que al recargar la app NO vuelva a aparecer
      markGoalsPopupAsSeenToday(uid, dateKey);
    };

    const currentUid = auth.currentUser?.uid || student.id || (student.email ? btoa(student.email) : 'default_user');
    checkAndTriggerDailyPopup(currentUid);

    // Escuchar si el usuario de Firebase Auth termina de inicializarse
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser && firebaseUser.uid !== currentUid) {
        checkAndTriggerDailyPopup(firebaseUser.uid);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, [dateKey, student.id, student.email]);

  // Al cerrar el modal, se asegura el registro y se ejecuta el scroll suave hacia las metas
  const handleDismissWelcomeModal = () => {
    const currentUid = auth.currentUser?.uid || student.id || (student.email ? btoa(student.email) : 'default_user');
    markGoalsPopupAsSeenToday(currentUid, dateKey);

    setShowWelcomeModal(false);
    sounds.playPop();

    // Scroll automático suave directo hacia la sección inferior donde están las metas
    setTimeout(() => {
      if (goalsSectionRef.current) {
        goalsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsGoalsHighlighted(true);

        setTimeout(() => {
          setIsGoalsHighlighted(false);
        }, 3000);
      }
    }, 200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-12 transition-colors duration-200">
      {/* 1. MODAL DE BIENVENIDA DIARIA (VENTANA EMERGENTE ÚNICA, SOLO PRIMERA VEZ DEL DÍA) */}
      {showWelcomeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleDismissWelcomeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200/80 dark:border-gray-800 relative overflow-hidden text-center animate-in zoom-in-95 duration-200"
          >
            {/* Resplandor decorativo naranja de fondo */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-[#fe6b00]/25 via-orange-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Botón cerrar */}
            <button
              onClick={handleDismissWelcomeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 transition"
              aria-label="Cerrar modal de metas"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logotipo de dyser */}
            <div className="flex justify-center mb-3">
              <DyserLogo size="lg" showText={true} />
            </div>

            {/* Badge de Dyser Goals */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60 text-[#fe6b00] text-xs font-black mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dyser Goals • Registro Diario</span>
            </div>

            {/* Título Mandatorio */}
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Estas son tus metas de hoy
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
              El algoritmo de dyser ha configurado tus 3 objetivos académicos para la jornada. Se validarán y completarán automáticamente al usar las herramientas de la plataforma.
            </p>

            {/* Vista previa de las 3 metas activas de hoy */}
            <div className="mt-4 mb-6 space-y-2 text-left">
              {todayGoalsPreview.map((g, i) => (
                <div
                  key={g.id}
                  className="p-2.5 sm:p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/60 dark:to-blue-950/60 text-[#fe6b00] flex items-center justify-center shrink-0 font-black text-xs shadow-2xs">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-black text-gray-900 dark:text-white truncate">
                      {g.title}
                    </h5>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {g.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#00236f] dark:text-[#90a8ff] shrink-0">
                    Auto
                  </span>
                </div>
              ))}
            </div>

            {/* Botón CTA de acción */}
            <button
              onClick={handleDismissWelcomeModal}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#fe6b00] to-[#ff8533] hover:from-[#e55f00] hover:to-[#fe6b00] text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver mis metas de hoy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FILA 1 (SUPERIOR - MINI MÉTRICAS): LOS TRES EN DISPOSICIÓN HORIZONTAL */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Métrica 1: Promedio Escolar */}
        <div className="p-2.5 sm:p-3.5 rounded-2xl shadow-2xs flex flex-col justify-between border bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800 transition hover:border-amber-400/50">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
              Promedio
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-500" />
            </div>
          </div>
          <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              {student.gpa > 0 ? student.gpa.toFixed(1) : '0.0'}
            </span>
            <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400">/10</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {student.gpa >= 9.0 ? '★ Sobresaliente' : student.gpa >= 8.0 ? '★ Notable' : student.gpa > 0 ? 'En progreso' : '0.0 • Sin calificar'}
          </span>
        </div>

        {/* Métrica 2: Tareas y Entregas */}
        <div
          onClick={() => onNavigateTo('tasks')}
          className="p-2.5 sm:p-3.5 rounded-2xl shadow-2xs flex flex-col justify-between cursor-pointer border bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800 hover:border-[#fe6b00]/60 transition group active:scale-[0.98]"
          title="Ver tareas y entregas pendientes"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
              Tareas
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#fe6b00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#fe6b00]" />
            </div>
          </div>
          <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-[#fe6b00] tracking-tight leading-none">
              {pendingTasks.length}
            </span>
            <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 truncate">activas</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center gap-0.5 group-hover:text-[#fe6b00]">
            <span>{completedTasks.length} listas</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Métrica 3: Simulador de Exámenes */}
        <div
          onClick={() => onNavigateTo('exam-simulator')}
          className="p-2.5 sm:p-3.5 rounded-2xl shadow-2xs flex flex-col justify-between cursor-pointer border bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800 hover:border-purple-400/60 transition group active:scale-[0.98]"
          title="Practicar con el Simulador de Exámenes"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
              Simulador
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-1.5">
            <span className="text-xs sm:text-base font-black text-gray-900 dark:text-white tracking-tight leading-tight block truncate">
              Práctica
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-purple-600 dark:text-purple-400 truncate mt-0.5 flex items-center gap-0.5 group-hover:underline">
            <span>Iniciar test</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </section>

      {/* FILA 2 (CENTRAL - GRÁFICA Y CÍRCULO EN HORIZONTAL, UNO AL LADO DEL OTRO A LA MISMA MEDIDA) */}
      <section className="flex flex-row gap-2 sm:gap-3.5 items-stretch w-full">
        <div className="w-[49%] flex-1 min-w-0">
          <WeeklyStudyBarChart />
        </div>
        <div className="w-[49%] flex-1 min-w-0">
          <SemesterTaskDonutChart
            tasks={tasks}
            semesterName={`${student.semester} • ${student.program}`}
            totalSemesterGoal={32}
          />
        </div>
      </section>

      {/* FILA 3 (INFERIOR - LAS 3 METAS DIARIAS EN HORIZONTAL CON BRANDING OFICIAL) */}
      <DailyGoalsSection
        ref={goalsSectionRef}
        onNavigateTo={onNavigateTo}
        isHighlighted={isGoalsHighlighted}
      />

      {/* FILA 4 (AL ÚLTIMO - EL CONSEJO DINÁMICO DE ESTUDIO) */}
      <section className="p-4 sm:p-5 rounded-3xl bg-gray-50 dark:bg-[#0d1424] border border-gray-200/80 dark:border-gray-800 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#00236f] dark:bg-blue-600 text-white shrink-0 flex items-center justify-center shadow-2xs">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black text-[#00236f] dark:text-blue-400 uppercase tracking-wider">
              Consejo de Estudio
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00236f] dark:text-blue-300 truncate">
              {STUDY_TIPS[tipIndex].title}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 max-w-3xl leading-relaxed">
            {STUDY_TIPS[tipIndex].desc}
          </p>
        </div>
      </section>
    </div>
  );
};
