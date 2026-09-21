import React, { useState, useEffect, forwardRef } from 'react';
import {
  Mic,
  Camera,
  Bot,
  Palette,
  Calculator,
  GraduationCap,
  FileText,
  CheckSquare,
  Users,
  Presentation,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Trophy,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import {
  AcademicGoal,
  GoalProgressItem,
  getDailyGoalsForDate,
  getLocalDateKey,
  loadDailyGoalsProgress,
  subscribeToDailyGoalsProgress,
} from '../../services/academicGoals';

interface DailyGoalsSectionProps {
  onNavigateTo: (tab: ActiveTab) => void;
  isHighlighted?: boolean;
}

export const DailyGoalsSection = forwardRef<HTMLElement, DailyGoalsSectionProps>(
  ({ onNavigateTo, isHighlighted = false }, ref) => {
    const [dateKey] = useState<string>(() => getLocalDateKey());
    const [goals, setGoals] = useState<AcademicGoal[]>(() => getDailyGoalsForDate());
    const [progress, setProgress] = useState<GoalProgressItem[]>(() =>
      loadDailyGoalsProgress(getDailyGoalsForDate(), getLocalDateKey())
    );

    useEffect(() => {
      const todayGoals = getDailyGoalsForDate();
      setGoals(todayGoals);

      const unsubscribe = subscribeToDailyGoalsProgress(todayGoals, dateKey, (updated) => {
        setProgress(updated);
      });

      const handleGoalsUpdated = () => {
        setProgress(loadDailyGoalsProgress(todayGoals, dateKey));
      };

      window.addEventListener('dyser-goals-updated', handleGoalsUpdated);
      return () => {
        unsubscribe();
        window.removeEventListener('dyser-goals-updated', handleGoalsUpdated);
      };
    }, [dateKey]);

    // Formatear fecha actual en español
    const formattedDate = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());

    const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    const completedCount = progress.filter((p) => p.completed).length;
    const allCompleted = goals.length > 0 && completedCount === goals.length;

    const renderBrandIcon = (iconName: AcademicGoal['iconName'], isCompleted: boolean) => {
      const iconClasses = `w-5 h-5 ${
        isCompleted
          ? 'text-emerald-500 fill-emerald-500/10'
          : 'text-[#fe6b00] group-hover:scale-110 transition-transform'
      }`;

      switch (iconName) {
        case 'mic':
          return <Mic className={iconClasses} />;
        case 'camera':
          return <Camera className={iconClasses} />;
        case 'bot':
          return <Bot className={iconClasses} />;
        case 'palette':
          return <Palette className={iconClasses} />;
        case 'calculator':
          return <Calculator className={iconClasses} />;
        case 'graduation-cap':
          return <GraduationCap className={iconClasses} />;
        case 'file-text':
          return <FileText className={iconClasses} />;
        case 'check-square':
          return <CheckSquare className={iconClasses} />;
        case 'users':
          return <Users className={iconClasses} />;
        case 'presentation':
          return <Presentation className={iconClasses} />;
        default:
          return <Sparkles className={iconClasses} />;
      }
    };

    return (
      <section
        ref={ref}
        id="daily-goals-section"
        className={`w-full space-y-2.5 rounded-3xl transition-all duration-500 p-0.5 ${
          isHighlighted
            ? 'ring-4 ring-[#fe6b00] ring-offset-2 ring-offset-white dark:ring-offset-[#090d16] bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl p-2'
            : ''
        }`}
      >
        {/* CABECERA COMPACTA DE METAS */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#fe6b00]/10 text-[#fe6b00] border border-[#fe6b00]/25 shrink-0">
              Dyser Goals
            </span>
            <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
              Estas son tus metas de hoy
            </h2>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 text-[10px] sm:text-xs font-black text-gray-800 dark:text-gray-100 shrink-0 shadow-2xs">
            <Trophy
              className={`w-3.5 h-3.5 ${
                allCompleted
                  ? 'text-amber-500 fill-amber-500 animate-bounce'
                  : 'text-[#fe6b00]'
              }`}
            />
            <span>
              {completedCount} de {goals.length} listas
            </span>
          </div>
        </div>

        {/* TRES TARJETAS EN DISPOSICIÓN ESTRICTAMENTE HORIZONTAL */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 w-full">
          {goals.map((goal, idx) => {
            const itemProgress = progress.find((p) => p.id === goal.id) || {
              id: goal.id,
              current: 0,
              completed: false,
            };
            const isDone = itemProgress.completed;
            const currentCount = itemProgress.current || 0;
            const progressPercent = Math.min(
              100,
              Math.round((currentCount / goal.targetCount) * 100)
            );

            return (
              <div
                key={goal.id}
                onClick={() => onNavigateTo(goal.targetTab)}
                className={`p-2 sm:p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-xs h-[142px] sm:h-[155px] ${
                  isDone
                    ? 'bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/30 dark:to-[#0f1626] border-emerald-300/80 dark:border-emerald-800/70'
                    : 'bg-white dark:bg-[#111728] border-gray-200/80 dark:border-gray-800 hover:border-[#fe6b00]/60 dark:hover:border-[#fe6b00]/60'
                }`}
              >
                {/* Acento superior de marca dyser */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-colors ${
                    isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#fe6b00] to-orange-400'
                  }`}
                />

                {/* Encabezado de la Tarjeta */}
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-orange-50 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60'
                      }`}
                    >
                      {renderBrandIcon(goal.iconName, isDone)}
                    </div>

                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-orange-50 dark:bg-orange-950/60 text-[#fe6b00]'
                      }`}
                    >
                      {isDone ? 'Listo ✓' : `#${idx + 1}`}
                    </span>
                  </div>

                  {/* Título de la Meta */}
                  <h3
                    className={`text-[11px] sm:text-xs font-black mt-2 leading-tight tracking-tight line-clamp-2 ${
                      isDone
                        ? 'text-emerald-900 dark:text-emerald-200'
                        : 'text-gray-900 dark:text-white group-hover:text-[#fe6b00] transition-colors'
                    }`}
                  >
                    {goal.title}
                  </h3>
                </div>

                {/* Pie: Barra de Progreso y Enlace */}
                <div>
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                    <span>
                      {currentCount}/{goal.targetCount}
                    </span>
                    <span className={isDone ? 'text-emerald-600' : 'text-[#fe6b00]'}>
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-[#fe6b00] to-orange-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[9px] sm:text-[10px] font-bold text-[#fe6b00]">
                    <span className="truncate">{goal.badgeLabel}</span>
                    <ArrowRight className="w-2.5 h-2.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
);

DailyGoalsSection.displayName = 'DailyGoalsSection';
