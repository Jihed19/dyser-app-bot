import React from 'react';
import { LayoutDashboard, CheckSquare, Bot, Users, MessageSquareQuote } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenToolsDrawer: () => void;
  pendingTasksCount: number;
  hasOverdueTasks: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingTasksCount,
  hasOverdueTasks,
}) => {
  return (
    <nav
      id="bottom-app-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#f7f9fb]/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-t border-gray-200/70 dark:border-gray-800/80 transition-colors duration-200 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto h-16 px-2 flex items-center justify-around">
        {/* Inicio */}
        <button
          onClick={() => onSelectTab('dashboard')}
          aria-label="Ir a Inicio"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-[#00236f] dark:text-[#90a8ff] font-bold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">Inicio</span>
        </button>

        {/* Tareas */}
        <button
          onClick={() => onSelectTab('tasks')}
          aria-label="Ir a Tareas"
          className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-all ${
            activeTab === 'tasks'
              ? 'text-[#fe6b00] font-bold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5" />
            {pendingTasksCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white shadow-xs ${
                  hasOverdueTasks ? 'bg-red-500 animate-pulse' : 'bg-[#fe6b00]'
                }`}
              >
                {pendingTasksCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight font-semibold">Tareas</span>
        </button>

        {/* Nasser IA */}
        <button
          onClick={() => onSelectTab('nasser-ia')}
          aria-label="Consultar a Nasser IA"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'nasser-ia'
              ? 'text-[#00236f] dark:text-[#90a8ff] font-bold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-gray-900" />
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Nasser IA</span>
        </button>

        {/* Salas */}
        <button
          onClick={() => onSelectTab('study-rooms')}
          aria-label="Ir a Salas de Estudio"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'study-rooms'
              ? 'text-[#00236f] dark:text-[#90a8ff] font-bold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">Salas</span>
        </button>

        {/* Comunidad */}
        <button
          onClick={() => onSelectTab('community')}
          aria-label="Ir a Comunidad Estudiantil"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'community'
              ? 'text-[#00236f] dark:text-[#90a8ff] font-bold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquareQuote className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">Comunidad</span>
        </button>
      </div>
    </nav>
  );
};
