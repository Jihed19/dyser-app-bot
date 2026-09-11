import React, { useState, useEffect, useRef, useId } from 'react';
import * as d3 from 'd3';
import {
  Sparkles,
  Clock,
  ArrowRight,
  Flame,
  Star,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  Target,
  Award,
  Timer,
  BellOff,
  FileText,
  Bot,
  Calculator,
  Presentation,
  Mic,
  Camera,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { ActiveTab, StudentProfile, AcademicTask } from '../../types';
import { sounds } from '../../services/soundEffects';
import { useFocus } from '../../context/FocusContext';
import { PomodoroFocusCard } from '../focus/PomodoroFocusCard';
import { DyserSubmark } from '../DyserSubmark';
import { QuickStudyActions } from '../dashboard/QuickStudyActions';
import { WeeklyStudyBarChart } from '../dashboard/WeeklyStudyBarChart';

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
  totalSemesterGoal = 32,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<SliceData | null>(null);
  const chartId = useId().replace(/:/g, '');

  const currentCompleted = tasks.filter((t) => t.status === 'completada').length;
  const currentPending = tasks.filter((t) => t.status === 'pendiente').length;
  const currentInProgress = tasks.filter((t) => t.status === 'en_progreso').length;

  const historicalCompleted = 18;
  const totalCompleted = historicalCompleted + currentCompleted;
  const totalPending = currentPending + currentInProgress;
  const totalTracked = Math.max(totalCompleted + totalPending, totalSemesterGoal);
  const remainingToGoal = Math.max(0, totalTracked - totalCompleted);

  const percentage = Math.min(100, Math.round((totalCompleted / totalTracked) * 100));

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
    {
      name: 'Por Asignar en Semestre',
      count: remainingToGoal,
      color: '#94a3b8',
      gradientId: `grad-remaining-${chartId}`,
      description: 'Hitos proyectados en el calendario',
    },
  ].filter((d) => d.count > 0);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 240;
    const height = 240;
    const margin = 12;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.72;

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

    const gradRemaining = defs
      .append('linearGradient')
      .attr('id', `grad-remaining-${chartId}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    gradRemaining.append('stop').attr('offset', '0%').attr('stop-color', '#94a3b8');
    gradRemaining.append('stop').attr('offset', '100%').attr('stop-color', '#64748b');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie<SliceData>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.04);

    const arc = d3
      .arc<d3.PieArcDatum<SliceData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6);

    const arcHover = d3
      .arc<d3.PieArcDatum<SliceData>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius + 6)
      .cornerRadius(8);

    g.selectAll('path')
      .data(pie(dataset))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => `url(#${d.data.gradientId})`)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.08))')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover as any)
          .style('filter', 'drop-shadow(0px 8px 12px rgba(0, 0, 0, 0.2))');
        setHoveredSlice(d.data);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any)
          .style('filter', 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.08))');
        setHoveredSlice(null);
      });
  }, [dataset, chartId]);

  return (
    <div className="w-full p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1220] border border-gray-200/80 dark:border-gray-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Métricas D3 • Desempeño
          </span>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Progreso Académico del Semestre
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{semesterName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            <svg ref={svgRef} width={240} height={240} className="overflow-visible" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {hoveredSlice ? (
                <div className="animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {hoveredSlice.name}
                  </span>
                  <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {hoveredSlice.count}
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 line-clamp-1">
                    {hoveredSlice.description}
                  </span>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Progreso
                  </span>
                  <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    {percentage}%
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {totalCompleted} de {totalTracked} tareas
                  </span>
                </div>
              )}
            </div>
          </div>
          <span className="text-[11px] text-gray-400 mt-1">
            Pasa el cursor sobre los arcos para inspeccionar
          </span>
        </div>

        <div className="md:col-span-7 space-y-3.5">
          <div
            onMouseEnter={() => setHoveredSlice(dataset[0] || null)}
            onMouseLeave={() => setHoveredSlice(null)}
            className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-default"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">
                    Tareas y Entregas Aprobadas
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Laboratorios, ensayos y evaluaciones completadas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                  {totalCompleted}
                </span>
                <span className="text-[10px] text-gray-400 block">
                  {Math.round((totalCompleted / totalTracked) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div
            onMouseEnter={() => setHoveredSlice(dataset[1] || null)}
            onMouseLeave={() => setHoveredSlice(null)}
            className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 transition hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-default"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fe6b00] text-white flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">
                    Tareas Activas & Por Entregar
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    En curso con fecha programada este ciclo
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#fe6b00]">
                  {totalPending}
                </span>
                <span className="text-[10px] text-gray-400 block">
                  {Math.round((totalPending / totalTracked) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div
            onMouseEnter={() => setHoveredSlice(dataset[2] || null)}
            onMouseLeave={() => setHoveredSlice(null)}
            className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#161f31] border border-gray-200/80 dark:border-gray-800 transition hover:bg-gray-100/70 dark:hover:bg-[#1a253a] cursor-default"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-700 dark:bg-slate-600 text-white flex items-center justify-center shadow-xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">
                    Meta Total del Semestre
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Proyección de créditos y evaluaciones totales
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-gray-900 dark:text-white">
                  {totalTracked}
                </span>
                <span className="text-[10px] text-gray-400 block">
                  100% del ciclo
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 px-1">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Promedio acumulado:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">9.4 / 10</strong>
              </span>
            </div>
            <span className="text-[11px] font-bold text-gray-400">D3 Engine v7</span>
          </div>
        </div>
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
  onOpenStreak = () => {},
}) => {
  const { isFocusMode, toggleFocusMode } = useFocus();
  const pendingTasks = tasks.filter((t) => t.status !== 'completada');
  const completedTasks = tasks.filter((t) => t.status === 'completada');

  // El consejo cambia automáticamente cada vez que el estudiante ingresa al inicio
  const [tipIndex] = useState<number>(() => Math.floor(Math.random() * STUDY_TIPS.length));

  return (
    <div
      className={`w-full max-w-5xl mx-auto space-y-6 pb-12 transition-colors duration-200 ${
        isFocusMode
          ? 'p-4 sm:p-6 rounded-3xl bg-[#f2f7f4]/90 dark:bg-[#081510]/95 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs'
          : ''
      }`}
    >
      {/* 0. MODO FOCUS ACTIVO - TEMPORIZADOR POMODORO */}
      {isFocusMode && (
        <section className="animate-in fade-in slide-in-from-top-3 duration-300">
          <PomodoroFocusCard onExitFocus={() => toggleFocusMode(false)} />
        </section>
      )}

      {/* 1. LOGOTIPO OFICIAL DE SUBMARCA CENTRADO BIEN GRANDE Y BONITO */}
      <section className="flex flex-col items-center justify-center text-center pt-2 pb-1 animate-in fade-in duration-300">
        <div className="relative group p-2">
          <DyserSubmark
            size={200}
            showWordmark={true}
            className="drop-shadow-sm transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Accesos rápidos esenciales: Pomodoro Focus y Racha de Estudio */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
          {/* Botón de Modo Focus (Pomodoro) */}
          <button
            onClick={() => toggleFocusMode()}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border shadow-xs transition active:scale-95 group text-left cursor-pointer ${
              isFocusMode
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 dark:border-emerald-600'
                : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border-emerald-200/80 dark:border-emerald-900/60'
            }`}
            title={
              isFocusMode
                ? 'Desactivar Modo Focus'
                : 'Activar Modo Focus: Silencia notificaciones y activa bloques Pomodoro'
            }
          >
            {isFocusMode ? (
              <BellOff className="w-4 h-4 text-white" />
            ) : (
              <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            <div>
              <span
                className={`text-xs font-black leading-none block ${
                  isFocusMode ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}
              >
                {isFocusMode ? 'Focus Activo' : 'Modo Focus'}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isFocusMode ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isFocusMode ? 'Silencioso' : 'Pomodoro'}
              </span>
            </div>
          </button>

          {/* Días de Racha y Constancia */}
          <button
            onClick={onOpenStreak}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border shadow-xs transition active:scale-95 group text-left cursor-pointer ${
              isFocusMode
                ? 'bg-white/80 dark:bg-slate-900/60 border-emerald-200/70 dark:border-emerald-900/50 hover:bg-white dark:hover:bg-slate-800'
                : 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/80 dark:border-orange-900/60 hover:bg-orange-100/80 dark:hover:bg-orange-900/50'
            }`}
            title="Ver constancia de estudio y días de actividad"
          >
            <Flame className="w-4 h-4 text-[#fe6b00] fill-[#fe6b00] group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xs font-black text-gray-900 dark:text-white leading-none block">
                {student.streakDays || 152} días
              </span>
              <span className="text-[10px] font-semibold text-[#fe6b00]">Racha activa 🔥</span>
            </div>
          </button>
        </div>
      </section>

      {/* 2. TRES TARJETAS MÉTRICAS CLAVE */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Promedio General */}
        <div
          className={`p-5 rounded-3xl shadow-xs flex flex-col justify-between transition group border ${
            isFocusMode
              ? 'bg-white/90 dark:bg-[#0c1813] border-emerald-200/80 dark:border-emerald-800/70'
              : 'bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Promedio Escolar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {student.gpa}
              </span>
              <span className="text-xs font-semibold text-gray-400">/ 10</span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              ★ Rendimiento Sobresaliente
            </p>
          </div>
        </div>

        {/* Tareas Pendientes */}
        <div
          onClick={() => onNavigateTo('tasks')}
          className={`p-5 rounded-3xl shadow-xs flex flex-col justify-between cursor-pointer transition group border ${
            isFocusMode
              ? 'bg-white/90 dark:bg-[#0c1813] border-emerald-200/80 dark:border-emerald-800/70 hover:border-emerald-400'
              : 'bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800 hover:border-[#fe6b00]/40'
          }`}
          title="Ir a Tareas y Entregas"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Tareas y Entregas</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#fe6b00] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#fe6b00] tracking-tight">
                {pendingTasks.length}
              </span>
              <span className="text-xs font-semibold text-gray-400">pendientes</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <span>{completedTasks.length} completadas</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </div>

        {/* Simulador de Exámenes */}
        <div
          onClick={() => onNavigateTo('exam-simulator')}
          className={`p-5 rounded-3xl shadow-xs flex flex-col justify-between cursor-pointer transition group border ${
            isFocusMode
              ? 'bg-white/90 dark:bg-[#0c1813] border-emerald-200/80 dark:border-emerald-800/70 hover:border-emerald-400'
              : 'bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800 hover:border-purple-400/40'
          }`}
          title="Practicar con el Simulador de Exámenes"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Simulador de Exámenes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">
              Prácticas y Evaluaciones
            </span>
            <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
              <span>Practicar examen ahora</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. TARJETAS DE ACCESO RÁPIDO (1 CLIC): GRABACIÓN DE CLASES Y ESCANEO DE PIZARRAS */}
      <QuickStudyActions onNavigateTo={onNavigateTo} />

      {/* 4. GRÁFICO DE BARRAS RECHARTS: HORAS DE ESTUDIO SEMANALES */}
      <section>
        <WeeklyStudyBarChart />
      </section>

      {/* 5. GRÁFICO CIRCULAR D3.js DE CUMPLIMIENTO SEMESTRAL */}
      <section>
        <SemesterTaskDonutChart
          tasks={tasks}
          semesterName={`${student.semester} • ${student.program}`}
          totalSemesterGoal={32}
        />
      </section>

      {/* 6. CONSEJOS DE ESTUDIO (SE CAMBIA AUTOMÁTICAMENTE AL VOLVER AL INICIO, SIN BOTÓN MANUAL) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-gray-50 dark:bg-[#0d1424] border border-gray-200/80 dark:border-gray-800 flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-[#00236f] dark:bg-blue-600 text-white shrink-0 flex items-center justify-center shadow-xs">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#00236f] dark:text-blue-400 uppercase tracking-wider">
              Consejo de Estudio
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00236f] dark:text-blue-300">
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
