import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Check,
  Calendar,
  X,
  Sparkles,
  Atom,
  Dna,
  FlaskConical,
  Calculator,
  Activity,
  BookOpen,
  Globe,
  GraduationCap,
  Layers,
  ArrowRight,
  Search,
} from 'lucide-react';
import { AcademicTask, TaskPriority, ActivityType, ActiveTab } from '../../types';
import { sounds } from '../../services/soundEffects';

interface TasksViewProps {
  tasks: AcademicTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (newTask: Omit<AcademicTask, 'id'>) => void;
  onInvestigateTask?: (task: AcademicTask) => void;
  onNavigateTo?: (tab: ActiveTab) => void;
}

// Materias oficiales del usuario con sus identidades visuales
interface SubjectItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeText: string;
  activeColor: string;
}

const USER_SUBJECTS: SubjectItem[] = [
  {
    id: 'fisica',
    name: 'Física',
    icon: Atom,
    color: 'text-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/50',
    badgeText: 'text-sky-700 dark:text-sky-300',
    activeColor: 'bg-sky-600',
  },
  {
    id: 'biologia',
    name: 'Biología',
    icon: Dna,
    color: 'text-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    activeColor: 'bg-emerald-600',
  },
  {
    id: 'quimica',
    name: 'Química',
    icon: FlaskConical,
    color: 'text-violet-500',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/50',
    badgeText: 'text-violet-700 dark:text-violet-300',
    activeColor: 'bg-violet-600',
  },
  {
    id: 'matematicas',
    name: 'Matemáticas',
    icon: Calculator,
    color: 'text-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    activeColor: 'bg-amber-600',
  },
  {
    id: 'educacion-fisica',
    name: 'Educación Física',
    icon: Activity,
    color: 'text-rose-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
    badgeText: 'text-rose-700 dark:text-rose-300',
    activeColor: 'bg-rose-600',
  },
  {
    id: 'castellano',
    name: 'Castellano',
    icon: BookOpen,
    color: 'text-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    activeColor: 'bg-indigo-600',
  },
  {
    id: 'ghc',
    name: 'GHC',
    icon: Globe,
    color: 'text-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/50',
    badgeText: 'text-orange-700 dark:text-orange-300',
    activeColor: 'bg-orange-600',
  },
];

// Helper para determinar el tipo de actividad con retrocompatibilidad
const getActivityType = (task: AcademicTask): ActivityType => {
  if (task.activityType) return task.activityType;
  const titleLower = task.title.toLowerCase();
  if (
    titleLower.includes('examen') ||
    titleLower.includes('quiz') ||
    titleLower.includes('parcial') ||
    titleLower.includes('prueba') ||
    titleLower.includes('evaluación') ||
    titleLower.includes('evaluacion')
  ) {
    return 'examen';
  }
  if (
    titleLower.includes('exposición') ||
    titleLower.includes('exposicion') ||
    titleLower.includes('defensa') ||
    titleLower.includes('presentación') ||
    titleLower.includes('presentacion') ||
    titleLower.includes('seminario') ||
    titleLower.includes('ponencia') ||
    titleLower.includes('oratoria')
  ) {
    return 'exposicion';
  }
  return 'tarea';
};

// 3 opciones solicitadas: Examen, Tarea y Exposición
const ACTIVITY_TABS: {
  id: ActivityType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}[] = [
  {
    id: 'examen',
    label: 'Examen',
    icon: GraduationCap,
    tag: 'Simulacros & Pruebas',
  },
  {
    id: 'tarea',
    label: 'Tarea',
    icon: CheckSquare,
    tag: 'Entregas & Trabajos',
  },
  {
    id: 'exposicion',
    label: 'Exposición',
    icon: Layers,
    tag: 'Oratoria & Láminas',
  },
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onInvestigateTask,
  onNavigateTo,
}) => {
  // Filtro de Materia (Todas o una de las 7 materias del usuario)
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Filtro de Tipo de Actividad (Examen | Tarea | Exposición)
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType>('tarea');

  // Filtro de estado (pendientes, completadas, urgentes o todas)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');

  // Búsqueda rápida
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de nueva actividad
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newActivityType, setNewActivityType] = useState<ActivityType>('tarea');
  const [newSubject, setNewSubject] = useState(USER_SUBJECTS[0].name);
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('alta');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(45);
  const [newDescription, setNewDescription] = useState('');

  // Navegación segura hacia pestañas de la app
  const triggerNavigation = (tab: ActiveTab) => {
    if (onNavigateTo) {
      onNavigateTo(tab);
    } else {
      window.dispatchEvent(new CustomEvent('dyser-navigate', { detail: tab }));
    }
  };

  // Filtrado compuesto
  const filteredTasks = tasks.filter((task) => {
    // 1. Filtro por tipo de actividad
    const taskType = getActivityType(task);
    if (taskType !== selectedActivityType) return false;

    // 2. Filtro por materia seleccionada
    if (selectedSubject !== 'all' && task.subject !== selectedSubject) {
      return false;
    }

    // 3. Filtro por estado
    if (statusFilter === 'pending' && task.status === 'completada') return false;
    if (statusFilter === 'completed' && task.status !== 'completada') return false;
    if (statusFilter === 'urgent' && task.priority !== 'alta' && !task.isOverdue) return false;

    // 4. Búsqueda opcional
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchSubj = task.subject.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSubj) return false;
    }

    return true;
  });

  // Métricas del contexto filtrado
  const currentTotal = tasks.filter((task) => {
    if (selectedSubject !== 'all' && task.subject !== selectedSubject) return false;
    return getActivityType(task) === selectedActivityType;
  });
  const currentPending = currentTotal.filter((t) => t.status !== 'completada').length;
  const currentCompleted = currentTotal.filter((t) => t.status === 'completada').length;
  const currentUrgent = currentTotal.filter((t) => t.status !== 'completada' && (t.priority === 'alta' || t.isOverdue)).length;

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      subject: newSubject,
      activityType: newActivityType,
      dueDate: newDueDate || 'Esta semana',
      dueTimestamp: Date.now() + 1000 * 60 * 60 * 48,
      priority: newPriority,
      status: 'pendiente',
      estimatedMinutes: Number(newEstimatedMinutes) || 40,
      description: newDescription.trim() || 'Sin descripción adicional.',
      isOverdue: false,
    });

    sounds.playLevelUp();
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  // Encontrar configuración visual de materia
  const getSubjectMeta = (subjName: string): SubjectItem => {
    const found = USER_SUBJECTS.find(
      (s) => s.name.toLowerCase() === subjName.toLowerCase()
    );
    return (
      found || {
        id: 'custom',
        name: subjName,
        icon: BookOpen,
        color: 'text-blue-500',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        activeColor: 'bg-blue-600',
      }
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-16 animate-in fade-in duration-300">
      
      {/* 1. JERARQUÍA DE TÍTULOS Y CABECERA LIMPIA (SIN TEXTO SECUNDARIO ESTORBOSO) */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <h1
          id="academic-panel-title"
          className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight"
        >
          Panel académico
        </h1>

        <button
          id="btn-nueva-actividad"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fe6b00] hover:bg-[#e05e00] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#fe6b00]/25 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Actividad</span>
        </button>
      </div>

      {/* 2. BARRA HORIZONTAL DESLIZABLE DE MATERIAS (Física, Biología, Química, Matemáticas, Educación Física, Castellano, GHC) */}
      <div className="space-y-1.5">
        <div className="relative -mx-3 px-3 sm:mx-0 sm:px-0">
          <div
            id="subjects-horizontal-bar"
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x"
          >
            {/* Opción 'Todas' */}
            <button
              id="subject-pill-all"
              onClick={() => {
                sounds.playPop();
                setSelectedSubject('all');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-[#00236f] text-white shadow-md shadow-[#00236f]/25 scale-[1.03]'
                  : 'bg-white dark:bg-[#111728] text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Todas</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedSubject === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {tasks.length}
              </span>
            </button>

            {/* 7 Materias del Usuario */}
            {USER_SUBJECTS.map((subj) => {
              const SubjIcon = subj.icon;
              const isSelected = selectedSubject === subj.name;
              const subjectCount = tasks.filter((t) => t.subject === subj.name).length;

              return (
                <button
                  key={subj.id}
                  id={`subject-pill-${subj.id}`}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedSubject(subj.name);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#00236f] text-white shadow-md shadow-[#00236f]/25 scale-[1.03]'
                      : 'bg-white dark:bg-[#111728] text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <SubjIcon
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-white' : subj.color
                    }`}
                  />
                  <span>{subj.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {subjectCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. SELECTOR DE TIPOS DE ACTIVIDAD (Examen, Tarea y Exposición) */}
      <div
        id="activity-type-selector"
        className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-gray-100/90 dark:bg-[#0d1424] border border-gray-200/80 dark:border-gray-800"
      >
        {ACTIVITY_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = selectedActivityType === tab.id;

          // Conteo específico para este tipo y materia activa
          const count = tasks.filter((t) => {
            if (selectedSubject !== 'all' && t.subject !== selectedSubject) return false;
            return getActivityType(t) === tab.id;
          }).length;

          return (
            <button
              key={tab.id}
              id={`tab-activity-${tab.id}`}
              onClick={() => {
                sounds.playPop();
                setSelectedActivityType(tab.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-[#161f33] text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <TabIcon
                className={`w-4 h-4 shrink-0 ${
                  isSelected
                    ? tab.id === 'examen'
                      ? 'text-[#fe6b00]'
                      : tab.id === 'tarea'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <span className="truncate">{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected
                    ? tab.id === 'examen'
                      ? 'bg-orange-100 text-[#fe6b00] dark:bg-orange-950/70 dark:text-orange-300'
                      : tab.id === 'tarea'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                    : 'bg-gray-200/70 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. TARJETAS DE CONTADORES DINÁMICOS */}
      <div id="counter-cards-container" className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Tarjeta 1: Pendientes */}
        <div
          id="counter-card-pendientes"
          onClick={() => {
            sounds.playPop();
            setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending');
          }}
          className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111728] border transition-all cursor-pointer text-center flex flex-col items-center justify-center shadow-xs hover:border-gray-300 dark:hover:border-gray-700 active:scale-95 ${
            statusFilter === 'pending'
              ? 'border-orange-500/80 ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-[#151c30]'
              : 'border-gray-200/80 dark:border-gray-800'
          }`}
        >
          <span className="text-3xl sm:text-4xl font-black text-[#fe6b00] tracking-tight leading-none">
            {currentPending}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
            Pendientes
          </span>
        </div>

        {/* Tarjeta 2: Completadas */}
        <div
          id="counter-card-completadas"
          onClick={() => {
            sounds.playPop();
            setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed');
          }}
          className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111728] border transition-all cursor-pointer text-center flex flex-col items-center justify-center shadow-xs hover:border-gray-300 dark:hover:border-gray-700 active:scale-95 ${
            statusFilter === 'completed'
              ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-[#151c30]'
              : 'border-gray-200/80 dark:border-gray-800'
          }`}
        >
          <span className="text-3xl sm:text-4xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight leading-none">
            {currentCompleted}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
            Completadas
          </span>
        </div>

        {/* Tarjeta 3: Urgentes */}
        <div
          id="counter-card-urgentes"
          onClick={() => {
            sounds.playPop();
            setStatusFilter(statusFilter === 'urgent' ? 'all' : 'urgent');
          }}
          className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111728] border transition-all cursor-pointer text-center flex flex-col items-center justify-center shadow-xs hover:border-gray-300 dark:hover:border-gray-700 active:scale-95 ${
            statusFilter === 'urgent'
              ? 'border-slate-500/80 ring-2 ring-slate-500/20 bg-slate-50/20 dark:bg-[#151c30]'
              : 'border-gray-200/80 dark:border-gray-800'
          }`}
        >
          <span className="text-3xl sm:text-4xl font-black text-gray-400 dark:text-slate-300 tracking-tight leading-none">
            {currentUrgent}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
            Urgentes
          </span>
        </div>
      </div>

      {/* Frase sutil sobre ciclo de vida de tareas completadas */}
      <div className="flex items-center justify-between px-1 text-[11px] text-gray-400 dark:text-gray-500">
        <span>Las tareas completadas se limpian automáticamente tras una semana.</span>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="text-[#00236f] dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            Mostrar todas ({currentTotal.length})
          </button>
        )}
      </div>

      {/* Barra de Búsqueda Rápida y Filtro Activo */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Buscar en ${
            selectedActivityType === 'examen'
              ? 'exámenes'
              : selectedActivityType === 'tarea'
              ? 'tareas'
              : 'exposiciones'
          } de ${selectedSubject === 'all' ? 'todas las materias' : selectedSubject}...`}
          className="w-full text-xs sm:text-sm pl-9 pr-24 py-2.5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00236f] dark:focus:ring-blue-500 shadow-2xs"
        />
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00236f] dark:text-blue-400 hover:underline px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60"
          >
            Ver todas
          </button>
        )}
      </div>

      {/* 4. LISTADO FILTRADO SEGÚN EL TIPO DE ACTIVIDAD Y MATERIA */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-[#111728] rounded-3xl border border-gray-200/80 dark:border-gray-800">
            {selectedActivityType === 'examen' && (
              <GraduationCap className="w-12 h-12 mx-auto text-orange-400/60 dark:text-orange-400/40 mb-3" />
            )}
            {selectedActivityType === 'tarea' && (
              <CheckSquare className="w-12 h-12 mx-auto text-blue-400/60 dark:text-blue-400/40 mb-3" />
            )}
            {selectedActivityType === 'exposicion' && (
              <Layers className="w-12 h-12 mx-auto text-purple-400/60 dark:text-purple-400/40 mb-3" />
            )}

            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
              No hay {selectedActivityType === 'examen' ? 'exámenes' : selectedActivityType === 'tarea' ? 'tareas' : 'exposiciones'} en esta vista
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {selectedSubject !== 'all'
                ? `No se encontraron elementos de tipo ${selectedActivityType} registrados para ${selectedSubject}.`
                : `Todo está al día o aún no has programado elementos de esta categoría.`}
            </p>

            <button
              onClick={() => {
                setNewActivityType(selectedActivityType);
                if (selectedSubject !== 'all') {
                  setNewSubject(selectedSubject);
                }
                setShowAddModal(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                Agregar {selectedActivityType === 'examen' ? 'Examen' : selectedActivityType === 'tarea' ? 'Tarea' : 'Exposición'}
              </span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completada';
            const subjectMeta = getSubjectMeta(task.subject);
            const SubjIcon = subjectMeta.icon;
            const taskType = getActivityType(task);

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111728] border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-gray-200/60 dark:border-gray-800/60 opacity-60 bg-gray-50/50 dark:bg-gray-900/30'
                    : 'border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                {/* Lado izquierdo: Checkbox y Detalle de la Actividad */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => {
                      sounds.playPop();
                      onToggleTask(task.id);
                    }}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#fe6b00] bg-white dark:bg-gray-800'
                    }`}
                    aria-label={`Marcar ${task.title}`}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm sm:text-base font-bold text-gray-900 dark:text-white ${
                          isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      {/* Materia con Icono */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${subjectMeta.badgeBg} ${subjectMeta.badgeText}`}
                      >
                        <SubjIcon className="w-3 h-3" />
                        <span>{task.subject}</span>
                      </span>

                      {/* Fecha de entrega / examen / exposición */}
                      <span
                        className={`text-[11px] font-semibold flex items-center gap-1 ${
                          task.isOverdue && !isCompleted
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{task.dueDate}</span>
                      </span>

                      {/* Tiempo estimado */}
                      <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.estimatedMinutes} min</span>
                      </span>

                      {/* Badge de Prioridad */}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full ${
                          task.priority === 'alta'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                            : task.priority === 'media'
                            ? 'bg-orange-100 dark:bg-orange-950/60 text-[#fe6b00]'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Acciones Específicas por Tipo de Actividad */}
                <div className="self-end sm:self-center shrink-0 flex items-center gap-2">
                  
                  {/* ACCIÓN PARA TAREAS: BOTÓN INVESTIGAR MANTENIDO INTACTO */}
                  {taskType === 'tarea' && (
                    <button
                      id={`btn-investigar-task-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playChirp();
                        if (onInvestigateTask) {
                          onInvestigateTask(task);
                        } else {
                          sessionStorage.setItem(
                            'dyser_investigate_task',
                            JSON.stringify({
                              title: task.title,
                              subject: task.subject,
                              id: task.id,
                              description: task.description,
                              dueDate: task.dueDate,
                              activityType: taskType,
                            })
                          );
                          triggerNavigation('nasser-ia');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00236f] to-[#1e3a8a] hover:from-[#fe6b00] hover:to-[#ea580c] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 group cursor-pointer"
                      title={`Iniciar investigación académica de "${task.title}" con Nasser AI`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform animate-pulse" />
                      <span>Investigar</span>
                    </button>
                  )}

                  {/* ACCIÓN PARA EXÁMENES: PRACTICAR EXAMEN & INVESTIGAR */}
                  {taskType === 'examen' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playPop();
                          sessionStorage.setItem('dyser_active_exam_topic', task.title);
                          sessionStorage.setItem('dyser_active_exam_subject', task.subject);
                          triggerNavigation('exam-simulator');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fe6b00] hover:bg-[#e05e00] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
                        title={`Practicar simulación de examen de "${task.title}"`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Practicar Examen</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playChirp();
                          sessionStorage.setItem(
                            'dyser_investigate_task',
                            JSON.stringify({
                              title: `Temario de Examen: ${task.title}`,
                              subject: task.subject,
                              id: task.id,
                              description: task.description,
                              dueDate: task.dueDate,
                              activityType: 'examen',
                            })
                          );
                          triggerNavigation('nasser-ia');
                        }}
                        className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
                        title="Investigar temario con Nasser IA"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>
                  )}

                  {/* ACCIÓN PARA EXPOSICIONES: PREPARAR EXPOSICIÓN & LÁMINA */}
                  {taskType === 'exposicion' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playPop();
                          sessionStorage.setItem('dyser_active_expo_topic', task.title);
                          sessionStorage.setItem('dyser_active_expo_subject', task.subject);
                          triggerNavigation('exposition-study');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
                        title={`Preparar oratoria y puntos de exposición de "${task.title}"`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Preparar Exposición</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playChirp();
                          sessionStorage.setItem('dyser_multimedia_topic', task.title);
                          triggerNavigation('multimedia');
                        }}
                        className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
                        title="Crear lámina mental en Nasser Studio"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL DE NUEVA ACTIVIDAD ADAPTADO A EXAMEN, TAREA Y EXPOSICIÓN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111728] w-full max-w-lg rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-[#fe6b00] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Registrar en Panel Académico
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              
              {/* Selector de Tipo de Actividad en el Modal */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tipo de Actividad *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isSelected = newActivityType === tab.id;
                    return (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setNewActivityType(tab.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Título o Tema *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    newActivityType === 'examen'
                      ? 'Ej: Examen Parcial: Leyes de Newton y Dinámica...'
                      : newActivityType === 'exposicion'
                      ? 'Ej: Defensa Oral: Mitosis y Ciclo Celular...'
                      : 'Ej: Guía Práctica: Estequiometría de Reacciones...'
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                />
              </div>

              {/* Materia y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Materia *
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                  >
                    {USER_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Fecha programada
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="Ej: Jueves, 14:00"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                  />
                </div>
              </div>

              {/* Prioridad y Tiempo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Tiempo estimado (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={newEstimatedMinutes}
                    onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notas o descripción
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles sobre lo que pide el docente o puntos de evaluación..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#fe6b00] hover:bg-[#e05e00] text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  Guardar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
