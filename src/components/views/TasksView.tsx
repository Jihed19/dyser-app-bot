import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Check,
  Calendar,
  X,
  Tag,
  Filter,
  Sparkles,
} from 'lucide-react';
import { AcademicTask, TaskPriority } from '../../types';
import { sounds } from '../../services/soundEffects';

interface TasksViewProps {
  tasks: AcademicTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (newTask: Omit<AcademicTask, 'id'>) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulario de nueva tarea
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Sistemas Distribuidos');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('alta');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(45);
  const [newDescription, setNewDescription] = useState('');

  const subjects = ['all', ...Array.from(new Set(tasks.map(t => t.subject)))];

  const filteredTasks = tasks.filter(task => {
    if (filterTab === 'pending' && task.status === 'completada') return false;
    if (filterTab === 'completed' && task.status !== 'completada') return false;
    if (selectedSubject !== 'all' && task.subject !== selectedSubject) return false;
    return true;
  });

  const pendingCount = tasks.filter(t => t.status !== 'completada').length;
  const completedCount = tasks.filter(t => t.status === 'completada').length;
  const overdueCount = tasks.filter(t => t.isOverdue && t.status !== 'completada').length;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      subject: newSubject,
      dueDate: newDueDate || 'En 2 días',
      dueTimestamp: Date.now() + 1000 * 60 * 60 * 48,
      priority: newPriority,
      status: 'pendiente',
      estimatedMinutes: Number(newEstimatedMinutes) || 30,
      description: newDescription.trim() || 'Sin descripción adicional.',
      isOverdue: false,
    });

    sounds.playLevelUp();
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. ENCABEZADO Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#fe6b00]">
            Organizador Académico
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Tareas y Entregas
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Mantén tus asignaturas bajo control y al día con recordatorios claros.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fe6b00] hover:bg-[#e05e00] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#fe6b00]/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* 2. CONTADORES RÁPIDOS */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-center shadow-xs">
          <span className="text-2xl sm:text-3xl font-black text-[#fe6b00]">
            {pendingCount}
          </span>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mt-0.5">
            Pendientes
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-center shadow-xs">
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </span>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mt-0.5">
            Completadas
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-center shadow-xs">
          <span className={`text-2xl sm:text-3xl font-black ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {overdueCount}
          </span>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mt-0.5">
            Urgentes
          </span>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS LIMPIA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111728] p-3 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        {/* Pestañas de estado */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
          <button
            onClick={() => setFilterTab('pending')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === 'pending'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === 'completed'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Completadas ({completedCount})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === 'all'
                ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Todas ({tasks.length})
          </button>
        </div>

        {/* Filtro por materia */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#fe6b00]"
          >
            <option value="all">Todas las materias</option>
            {subjects.filter(s => s !== 'all').map(subj => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. LISTA DE TAREAS SIMPLIFICADA */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111728] rounded-3xl border border-gray-200/80 dark:border-gray-800">
            <CheckSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
              No hay tareas en esta vista
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Todo está en orden o aún no has creado tareas para esta materia.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'completada';
            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111728] border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-gray-200/60 dark:border-gray-800/60 opacity-60 bg-gray-50/50 dark:bg-gray-900/30'
                    : 'border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => {
                      sounds.playPop();
                      onToggleTask(task.id);
                    }}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#fe6b00] bg-white dark:bg-gray-800'
                    }`}
                    aria-label={`Marcar ${task.title}`}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <h3
                      className={`text-sm sm:text-base font-bold text-gray-900 dark:text-white ${
                        isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Materia */}
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#00236f] dark:text-[#90a8ff]">
                        {task.subject}
                      </span>

                      {/* Fecha de entrega */}
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
                    </div>
                  </div>
                </div>

                {/* Prioridad */}
                <div className="self-end sm:self-center shrink-0">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                      task.priority === 'alta'
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                        : task.priority === 'media'
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-[#fe6b00]'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Prioridad {task.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL DE NUEVA TAREA LIMPIO Y SENCILLO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111728] w-full max-w-lg rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-[#fe6b00] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Crear Nueva Tarea
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Título de la tarea *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: Informe de Laboratorio #2..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Materia
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Ej: Sistemas Distribuidos"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Entrega
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    placeholder="Ej: Mañana, 18:00"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as TaskPriority)}
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
                    onChange={e => setNewEstimatedMinutes(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fe6b00]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notas o descripción adicional
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Detalles sobre lo que pide el docente..."
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
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
