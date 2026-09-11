import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { FocusProvider } from './context/FocusContext';
import { Header } from './components/Header';
import { Drawer } from './components/Drawer';
import { BottomNav } from './components/BottomNav';
import { ToastContainer, ToastItem } from './components/Toast';
import { DashboardView } from './components/views/DashboardView';
import { TasksView } from './components/views/TasksView';
import { NasserChatView } from './components/views/NasserChatView';
import { SummaryView } from './components/views/SummaryView';
import { MultimediaCreatorView } from './components/views/MultimediaCreatorView';
import { BlackboardView } from './components/views/BlackboardView';
import { ClassRecorderView } from './components/views/ClassRecorderView';
import { ProblemSolverView } from './components/views/ProblemSolverView';
import { StudyRoomsView } from './components/views/StudyRoomsView';
import { ExamSimulatorView } from './components/views/ExamSimulatorView';
import { CommunityView } from './components/views/CommunityView';
import { OnboardingView } from './components/views/OnboardingView';
import { initialStudentProfile, initialAcademicTasks } from './data/mockData';
import { ActiveTab, AcademicTask, StudentProfile } from './types';
import { StreakView } from './components/views/StreakView';
import { sounds } from './services/soundEffects';
import {
  subscribeToAcademicTasks,
  saveAcademicTaskToFirestore,
  subscribeToStudentProfile,
} from './services/firebase';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [student, setStudent] = useState<StudentProfile>(initialStudentProfile);
  const [tasks, setTasks] = useState<AcademicTask[]>(initialAcademicTasks);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const hasNotifiedOverdueRef = useRef<boolean>(false);

  // Gestión del sistema local de Toast
  const addToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    const duration = toast.duration ?? 4500;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Notificación al teléfono / dispositivo cuando una tarea está retrasada
  const notifyDeviceOverdueTasks = (overdueTasks: AcademicTask[]) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      overdueTasks.forEach((task) => {
        const notifKey = `dyser-notified-overdue-${task.id}`;
        if (sessionStorage.getItem(notifKey)) return;
        sessionStorage.setItem(notifKey, 'true');

        try {
          const n = new Notification('⚠️ Tarea Retrasada en Dyser', {
            body: `La tarea "${task.title}" (${task.subject}) tiene su plazo de entrega vencido.`,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: `overdue-${task.id}`,
          });
          n.onclick = () => {
            window.focus();
            setActiveTab('tasks');
          };
        } catch (err) {
          console.warn('Error al emitir notificación al dispositivo:', err);
        }
      });
    } else if (Notification.permission === 'default' && !hasNotifiedOverdueRef.current) {
      hasNotifiedOverdueRef.current = true;
      addToast({
        title: '⚠️ Tareas retrasadas detectadas',
        message: `Tienes ${overdueTasks.length} entrega(s) fuera de plazo. Activa los avisos para recibirlos en tu teléfono.`,
        type: 'warning',
        duration: 9000,
        action: {
          label: 'Activar avisos en teléfono',
          onClick: async () => {
            try {
              const res = await Notification.requestPermission();
              if (res === 'granted') {
                notifyDeviceOverdueTasks(overdueTasks);
                addToast({
                  title: '¡Avisos en móvil activados! 🔔',
                  message: 'Recibirás notificaciones push cuando venza una entrega académica.',
                  type: 'success',
                });
              }
            } catch (e) {
              console.warn('Permiso no concedido', e);
            }
          },
        },
      });
    }
  };

  // Sincronización en tiempo real con Firebase Firestore
  useEffect(() => {
    const unsubTasks = subscribeToAcademicTasks((loadedTasks) => {
      if (loadedTasks && loadedTasks.length > 0) {
        setTasks(loadedTasks);
        // Revisar y notificar tareas atrasadas
        const overdue = loadedTasks.filter((t) => t.isOverdue && t.status !== 'completada');
        if (overdue.length > 0) {
          notifyDeviceOverdueTasks(overdue);
        }
      }
    });

    const unsubProfile = subscribeToStudentProfile((loadedProfile) => {
      if (loadedProfile) {
        setStudent(loadedProfile);
      }
    });

    return () => {
      unsubTasks();
      unsubProfile();
    };
  }, []);

  // Chequeo inicial de tareas retrasadas al cargar
  useEffect(() => {
    const overdue = tasks.filter((t) => t.isOverdue && t.status !== 'completada');
    if (overdue.length > 0) {
      notifyDeviceOverdueTasks(overdue);
    }
  }, []);

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completada').length;
  const hasOverdueTasks = tasks.some((t) => t.isOverdue && t.status !== 'completada');

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completada' ? 'pendiente' : 'completada';
          const updatedTask: AcademicTask = {
            ...t,
            status: nextStatus,
            isOverdue: nextStatus === 'completada' ? false : t.isOverdue,
          };
          saveAcademicTaskToFirestore(updatedTask);

          if (nextStatus === 'completada') {
            sounds.playSuccess();
            addToast({
              title: '¡Tarea completada! 🎉',
              message: `Has terminado "${t.title}". ¡Sumaste +50 XP a tu progreso académico!`,
              type: 'success',
            });
          } else {
            addToast({
              title: 'Tarea reactivada',
              message: `"${t.title}" volvió a tu lista de tareas pendientes.`,
              type: 'info',
            });
          }

          return updatedTask;
        }
        return t;
      })
    );
  };

  const handleAddTask = (newTask: Omit<AcademicTask, 'id'>) => {
    const task: AcademicTask = {
      ...newTask,
      id: `task-${Date.now()}`,
    };
    setTasks((prev) => [task, ...prev]);
    saveAcademicTaskToFirestore(task);
    sounds.playNotification();

    // Confirmación local mediante Toast
    addToast({
      title: '¡Nueva tarea registrada! 📅',
      message: `"${task.title}" (${task.subject}) fue añadida a tu agenda académica.`,
      type: 'success',
    });

    // Si la nueva tarea nace retrasada, avisar
    if (task.isOverdue) {
      notifyDeviceOverdueTasks([task]);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TasksView
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
          />
        );
      case 'nasser-ia':
        return (
          <NasserChatView
            studentName={student.name}
            onNavigateTo={(tab) => setActiveTab(tab)}
          />
        );
      case 'summary':
        return <SummaryView />;
      case 'multimedia':
        return <MultimediaCreatorView />;
      case 'blackboard':
        return <BlackboardView />;
      case 'class-recorder':
        return <ClassRecorderView />;
      case 'problem-solver':
        return <ProblemSolverView />;
      case 'study-rooms':
        return <StudyRoomsView />;
      case 'exam-simulator':
        return <ExamSimulatorView />;
      case 'community':
        return <CommunityView />;
      case 'streak':
        return (
          <StreakView
            student={student}
            onClose={() => setActiveTab('dashboard')}
            onNavigateTo={(tab) => setActiveTab(tab)}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardView
            student={student}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onNavigateTo={(tab) => setActiveTab(tab)}
            onOpenStreak={() => setIsStreakOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors duration-200 flex flex-col font-sans">
      <Header
        onOpenDrawer={() => setIsDrawerOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadCount={hasOverdueTasks ? 1 : 0}
        onOpenStreak={() => setIsStreakOpen(true)}
        streakDays={student.streakDays || 152}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        student={student}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Main Academic Workspace Container con transiciones suaves framer-motion */}
      <main className="flex-1 max-w-7xl w-full mx-auto pt-20 pb-24 lg:pb-12 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="w-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sistema de Notificaciones Toast flotante */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Modal de Días de Estudio y Constancia */}
      {isStreakOpen && (
        <StreakView
          student={student}
          onClose={() => setIsStreakOpen(false)}
          onNavigateTo={(tab) => {
            setIsStreakOpen(false);
            setActiveTab(tab);
          }}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenToolsDrawer={() => setIsDrawerOpen(true)}
          pendingTasksCount={pendingTasksCount}
          hasOverdueTasks={hasOverdueTasks}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <FocusProvider>
        <AppContent />
      </FocusProvider>
    </ThemeProvider>
  );
}
