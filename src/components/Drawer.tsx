import React from 'react';
import {
  X,
  Bot,
  FileText,
  Mic,
  Calculator,
  Camera,
  GraduationCap,
  Users,
  Palette,
  Sun,
  Moon,
  MessageSquareQuote,
  Layers,
} from 'lucide-react';
import { ActiveTab, StudentProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { DyserLogo } from './Header';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  student: StudentProfile;
  pendingTasksCount?: number;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  student,
}) => {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const sections = [
    {
      title: 'Tutor y Asistencia de IA',
      items: [
        {
          id: 'nasser-ia' as ActiveTab,
          label: 'Nasser AI',
          icon: Bot,
          badge: 'IA',
          badgeColor: 'bg-blue-50 text-[#00236f] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40',
        },
        {
          id: 'multimedia' as ActiveTab,
          label: 'Nasser AI Studio',
          icon: Palette,
          badge: 'Studio',
          badgeColor: 'bg-orange-50 text-[#fe6b00] dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200/50 dark:border-orange-900/40',
        },
      ],
    },
    {
      title: 'Estudio y Creación',
      items: [
        {
          id: 'summary' as ActiveTab,
          label: 'Resúmenes y Apuntes',
          icon: FileText,
        },
        {
          id: 'class-recorder' as ActiveTab,
          label: 'Grabación de clases en vivo',
          icon: Mic,
        },
        {
          id: 'exam-simulator' as ActiveTab,
          label: 'Simulador de Exámenes',
          icon: GraduationCap,
        },
        {
          id: 'exposition-study' as ActiveTab,
          label: 'Estudio de exposición',
          icon: Layers,
        },
        {
          id: 'blackboard' as ActiveTab,
          label: 'Digitalizar Pizarra',
          icon: Camera,
        },
        {
          id: 'problem-solver' as ActiveTab,
          label: 'Calculador',
          icon: Calculator,
        },
      ],
    },
    {
      title: 'Comunidad y Salas',
      items: [
        {
          id: 'community' as ActiveTab,
          label: 'Comunidad',
          icon: MessageSquareQuote,
        },
        {
          id: 'study-rooms' as ActiveTab,
          label: 'Salas de Estudio',
          icon: Users,
          badge: 'En vivo',
          badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40',
        },
      ],
    },
  ];

  const handleItemClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Fondo oscuro con difuminado suave */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-[#0e1320] border-r border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
        
        {/* Cabecera del Drawer */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DyserLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-[#00236f] dark:text-white">Dyser</span>
                <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-[#fe6b00]/10 text-[#fe6b00] border border-[#fe6b00]/20">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Plataforma Académica
              </p>
            </div>
          </div>

          <button
            id="drawer-close-button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfil del Estudiante */}
        <div className="p-4 mx-3 mt-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00236f]/20 shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
              {student.name}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {student.program}
            </p>
          </div>
        </div>

        {/* Menú de Navegación Organizado en Secciones */}
        <nav id="drawer-nav-container" className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {sections.map(sec => (
            <div key={sec.title} className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 block">
                {sec.title}
              </span>
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`drawer-nav-item-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer active:scale-[0.99] ${
                      isActive
                        ? 'bg-[#00236f] text-white shadow-xs'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-[#00236f] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Pie del Drawer con Tema */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0c101b] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            Tema {theme === 'light' ? 'Claro' : 'Oscuro'}
          </span>

          <button
            id="drawer-theme-toggle"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition cursor-pointer"
            title="Alternar tema claro/oscuro"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-[#00236f]" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

      </div>
    </div>
  );
};
