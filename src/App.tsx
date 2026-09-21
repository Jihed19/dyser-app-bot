import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';
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
import { ExpositionStudyView } from './components/views/ExpositionStudyView';
import { CommunityView } from './components/views/CommunityView';
import { OnboardingView } from './components/views/OnboardingView';
import { initialStudentProfile, initialAcademicTasks, STUDENT_AVATAR } from './data/mockData';
import { ActiveTab, AcademicTask, StudentProfile } from './types';
import { sounds } from './services/soundEffects';
import { trackGoalAction } from './services/academicGoals';
import {
  subscribeToAcademicTasks,
  saveAcademicTaskToFirestore,
  deleteAcademicTaskFromFirestore,
  subscribeToStudentProfile,
} from './services/firebase';
import {
  isUserSessionActive,
  getSavedSessionProfile,
  logoutUser,
  subscribeToAuthChanges,
} from './services/authService';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isUserSessionActive();
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const activeTabRef = useRef<ActiveTab>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubinterface, setIsSubinterface] = useState<boolean>(false);
  const [subinterfaceOrigin, setSubinterfaceOrigin] = useState<ActiveTab>('dashboard');

  const handleOpenSubinterface = (targetTab: ActiveTab, originTab?: ActiveTab) => {
    setSubinterfaceOrigin(originTab || activeTabRef.current);
    setIsSubinterface(true);
    setActiveTab(targetTab);
  };

  const handleExitSubinterface = () => {
    setIsSubinterface(false);
    setActiveTab(subinterfaceOrigin || 'dashboard');
  };

  const handleBottomNavSelect = (tab: ActiveTab) => {
    setIsSubinterface(false);
    setActiveTab(tab);
  };
  const [student, setStudent] = useState<StudentProfile>(() => {
    const saved = getSavedSessionProfile();
    return (
      saved || {
        name: '',
        avatar: STUDENT_AVATAR,
        program: 'Educación Superior',
        semester: 'Ciclo Académico 2026',
        gpa: 0.0,
        attendanceRate: 100,
        streakDays: 1,
        completedTasksCount: 0,
        onboardingCompleted: false,
      }
    );
  });
  // Inicialización en cero para que nuevos usuarios no arrastren tareas previas
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
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

  // Sincronización en tiempo real con Firebase Firestore aislada por UID del usuario autenticado
  useEffect(() => {
    let unsubTasks: (() => void) | null = null;
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = subscribeToAuthChanges((firebaseUser) => {
      // Limpiar suscripciones previas al cambiar de estado/usuario
      if (unsubTasks) {
        unsubTasks();
        unsubTasks = null;
      }
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        // Usuario autenticado en Firebase
        unsubTasks = subscribeToAcademicTasks((loadedTasks) => {
          // Si el usuario es nuevo, loadedTasks es [] y la interfaz carga completamente en cero
          setTasks(loadedTasks || []);
          if (loadedTasks && loadedTasks.length > 0) {
            const overdue = loadedTasks.filter((t) => t.isOverdue && t.status !== 'completada');
            if (overdue.length > 0) {
              notifyDeviceOverdueTasks(overdue);
            }
          }
        }, firebaseUser.uid);

        unsubProfile = subscribeToStudentProfile((loadedProfile) => {
          if (loadedProfile) {
            setStudent(loadedProfile);
            if (loadedProfile.onboardingCompleted) {
              setIsAuthenticated(true);
            }
          }
        }, firebaseUser.uid);
      } else {
        // Sin usuario autenticado en Firebase: verificar si hay sesión local
        const hasSession = isUserSessionActive();
        if (!hasSession) {
          setIsAuthenticated(false);
          setTasks([]);
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubTasks) unsubTasks();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Chequeo inicial de tareas retrasadas al cargar
  useEffect(() => {
    const overdue = tasks.filter((t) => t.isOverdue && t.status !== 'completada');
    if (overdue.length > 0) {
      notifyDeviceOverdueTasks(overdue);
    }

    const handleDyserNav = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveTab | { tab: ActiveTab; asSubinterface?: boolean; origin?: ActiveTab }>;
      if (customEvent.detail) {
        if (typeof customEvent.detail === 'string') {
          handleOpenSubinterface(customEvent.detail, activeTabRef.current);
        } else if (customEvent.detail.tab) {
          if (customEvent.detail.asSubinterface === false) {
            setIsSubinterface(false);
            setActiveTab(customEvent.detail.tab);
          } else {
            handleOpenSubinterface(customEvent.detail.tab, customEvent.detail.origin || activeTabRef.current);
          }
        }
      }
    };
    window.addEventListener('dyser-navigate', handleDyserNav);
    return () => window.removeEventListener('dyser-navigate', handleDyserNav);
  }, []);

  // Ciclo de Vida de Tareas Completadas (Regla de 7 Días):
  // Cada tarea completada cumple su propio ciclo individual de 7 días desde su finalización y se elimina automáticamente.
  useEffect(() => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const expiredTasks = tasks.filter(
      (t) => t.status === 'completada' && t.completedAt && now - t.completedAt > SEVEN_DAYS_MS
    );

    if (expiredTasks.length > 0) {
      expiredTasks.forEach((t) => {
        deleteAcademicTaskFromFirestore(t.id);
      });
      setTasks((prev) => prev.filter((t) => !expiredTasks.some((exp) => exp.id === t.id)));
    }
  }, [tasks]);

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
            completedAt: nextStatus === 'completada' ? Date.now() : undefined,
            isOverdue: nextStatus === 'completada' ? false : t.isOverdue,
          };
          saveAcademicTaskToFirestore(updatedTask);

          if (nextStatus === 'completada') {
            sounds.playSuccess();
            trackGoalAction('tasks');
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
            onInvestigateTask={(task) => {
              sessionStorage.setItem('dyser_investigate_task', JSON.stringify(task));
              handleOpenSubinterface('nasser-ia', 'tasks');
            }}
            onNavigateTo={(tab) => handleOpenSubinterface(tab, 'tasks')}
          />
        );
      case 'nasser-ia':
      case 'summary':
      case 'blackboard':
      case 'problem-solver':
        return (
          <NasserChatView
            key={`nasser-chat-${activeTab === 'summary' ? 'summary' : activeTab === 'blackboard' ? 'blackboard' : activeTab === 'problem-solver' ? 'calculator' : 'general'}`}
            studentName={student.name}
            initialChatMode={
              activeTab === 'summary'
                ? 'summary'
                : activeTab === 'blackboard'
                ? 'blackboard'
                : activeTab === 'problem-solver'
                ? 'calculator'
                : null
            }
            onNavigateTo={(tab) => handleOpenSubinterface(tab, activeTab)}
            onAddTask={handleAddTask}
            onShowToast={addToast}
          />
        );
      case 'multimedia':
        return <MultimediaCreatorView onShowToast={addToast} />;
      case 'class-recorder':
        return <ClassRecorderView onNavigateTo={(tab) => handleOpenSubinterface(tab, activeTab)} />;
      case 'study-rooms':
        return (
          <StudyRoomsView
            onNavigateTo={(tab) => handleOpenSubinterface(tab, activeTab)}
            onShowToast={addToast}
          />
        );
      case 'exam-simulator':
        return (
          <ExamSimulatorView
            onNavigateTo={(tab) => handleOpenSubinterface(tab, activeTab)}
            onShowToast={addToast}
          />
        );
      case 'exposition-study':
        return (
          <ExpositionStudyView
            onNavigateTo={(tab) => handleOpenSubinterface(tab, activeTab)}
            onShowToast={addToast}
          />
        );
      case 'community':
        return (
          <CommunityView
            student={student}
            onNavigateTo={(tab) => handleOpenSubinterface(tab, activeTab)}
            onShowToast={addToast}
          />
        );
      case 'onboarding':
        return (
          <OnboardingView
            onComplete={handleOnboardingComplete}
            initialStudent={student}
          />
        );
      case 'streak':
      case 'dashboard':
      default:
        return (
          <DashboardView
            student={student}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onNavigateTo={(tab) => {
              if (tab === 'tasks') {
                setIsSubinterface(false);
                setActiveTab('tasks');
              } else {
                handleOpenSubinterface(tab, 'dashboard');
              }
            }}
          />
        );
    }
  };

  const handleOnboardingComplete = (newProfile: StudentProfile) => {
    setStudent(newProfile);
    setIsAuthenticated(true);
    setIsSubinterface(false);
    setActiveTab('dashboard');
    addToast({
      title: '¡Bienvenido a Dyser!',
      message: `Perfil activado con éxito. Código Disser: ${newProfile.dyserNumber || newProfile.disserCode || ''}`,
      type: 'success',
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setIsSubinterface(false);
    setTasks([]);
    setStudent({
      name: '',
      avatar: STUDENT_AVATAR,
      program: 'Educación Superior',
      semester: 'Ciclo Académico 2026',
      gpa: 0.0,
      attendanceRate: 100,
      streakDays: 1,
      completedTasksCount: 0,
      onboardingCompleted: false,
    });
    addToast({
      title: 'Sesión finalizada',
      message: 'Has cerrado sesión en tu dispositivo de forma segura.',
      type: 'info',
    });
  };

  // Si no hay sesión activa en el dispositivo, mostrar el flujo de Bienvenida y Onboarding
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white font-sans">
        <OnboardingView
          onComplete={handleOnboardingComplete}
          initialStudent={student}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors duration-200 flex flex-col font-sans">
      <Header
        onOpenDrawer={() => setIsDrawerOpen(true)}
        activeTab={activeTab}
        onSelectTab={handleBottomNavSelect}
        unreadCount={hasOverdueTasks ? 1 : 0}
        student={student}
        onLogout={handleLogout}
        isSubinterface={isSubinterface}
        onExitSubinterface={handleExitSubinterface}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => handleOpenSubinterface(tab, activeTab)}
        student={student}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Main Academic Workspace Container con transiciones suaves framer-motion */}
      <main className={`flex-1 max-w-7xl w-full mx-auto pt-20 px-4 sm:px-6 transition-all duration-200 ${isSubinterface ? 'pb-4 lg:pb-6' : 'pb-24 lg:pb-12'}`}>
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

      {/* Mobile Bottom Navigation - oculto en modo subinterfaz pantalla completa */}
      {!isSubinterface && (
        <div className="lg:hidden">
          <BottomNav
            activeTab={activeTab}
            onSelectTab={handleBottomNavSelect}
            onOpenToolsDrawer={() => setIsDrawerOpen(true)}
            pendingTasksCount={pendingTasksCount}
            hasOverdueTasks={hasOverdueTasks}
          />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
