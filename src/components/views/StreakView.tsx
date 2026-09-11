import React, { useState } from 'react';
import {
  X,
  Share2,
  Flame,
  Shield,
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
  Sparkles,
  Zap,
  Users,
  Award,
  ArrowRight,
  Heart,
  Send,
} from 'lucide-react';
import { ActiveTab, StudentProfile } from '../../types';
import { sounds } from '../../services/soundEffects';

interface StreakViewProps {
  student: StudentProfile;
  onClose: () => void;
  onNavigateTo: (tab: ActiveTab) => void;
}

export const StreakView: React.FC<StreakViewProps> = ({
  student,
  onClose,
  onNavigateTo,
}) => {
  const [tab, setTab] = useState<'personal' | 'amigos'>('personal');
  const [streakProtectors, setStreakProtectors] = useState<number>(2);
  const [hasPracticedToday, setHasPracticedToday] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);
  const [friendPoked, setFriendPoked] = useState<{ [key: string]: boolean }>({});

  const streakDays = Math.max(student.streakDays || 14, 152); // Muestra racha notable estilo Duolingo

  // Amigos de la racha
  const friends = [
    { id: '1', name: 'Alejandro Valenzuela (Tú)', streak: streakDays, isUser: true, avatar: student.avatar },
    { id: '2', name: 'Sofía Mendoza', streak: 138, isUser: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
    { id: '3', name: 'Carlos Navarrete', streak: 94, isUser: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
    { id: '4', name: 'Valentina Cruz', streak: 81, isUser: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
    { id: '5', name: 'Mateo Silva', streak: 62, isUser: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
  ];

  const handleShare = () => {
    sounds.playPop();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`¡Tengo una racha de ${streakDays} días en dyser Académico! 🔥`);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 3000);
    }
  };

  const handlePracticeAction = () => {
    sounds.playLevelUp();
    setHasPracticedToday(true);
    onNavigateTo('exam-simulator');
  };

  const handlePokeFriend = (id: string) => {
    sounds.playPop();
    setFriendPoked(prev => ({ ...prev, [id]: true }));
  };

  // Días de septiembre 2026 (mes que muestra la captura de referencia)
  // Septiembre 2026 empieza en Martes (Ma=1)
  // Días del 1 al 7 con racha activa completada, 8 hoy
  const calendarDays = [
    { day: null }, { day: null }, // Dom, Lun vacíos
    { day: 1, hasStreak: true },
    { day: 2, hasStreak: true },
    { day: 3, hasStreak: true },
    { day: 4, hasStreak: true },
    { day: 5, hasStreak: true },
    { day: 6, hasStreak: true },
    { day: 7, hasStreak: true },
    { day: 8, isToday: true, hasStreak: hasPracticedToday },
    { day: 9 }, { day: 10 }, { day: 11 }, { day: 12 },
    { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 }, { day: 18 }, { day: 19 },
    { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 }, { day: 26 },
    { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] text-white overflow-y-auto flex flex-col font-sans animate-in fade-in duration-200">
      {/* Toast de compartir */}
      {sharedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-2xl bg-[#10b981] text-white text-xs font-black shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <Check className="w-4 h-4" />
          <span>¡Racha copiada al portapapeles! Lista para compartir</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 max-w-2xl w-full mx-auto">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition active:scale-95"
          aria-label="Cerrar racha"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
          Días de racha
        </h1>

        <button
          onClick={handleShare}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition active:scale-95"
          aria-label="Compartir racha"
          title="Compartir racha"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* TABS SELECTOR (PERSONAL / ENTRE AMIGOS) */}
      <div className="max-w-2xl w-full mx-auto px-4 pt-2">
        <div className="flex border-b-2 border-white/15">
          <button
            onClick={() => setTab('personal')}
            className={`flex-1 py-3 text-xs sm:text-sm font-black tracking-wider transition relative ${
              tab === 'personal'
                ? 'text-[#38bdf8]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            PERSONAL
            {tab === 'personal' && (
              <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-[#38bdf8] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setTab('amigos')}
            className={`flex-1 py-3 text-xs sm:text-sm font-black tracking-wider transition relative ${
              tab === 'amigos'
                ? 'text-[#38bdf8]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ENTRE AMIGOS
            {tab === 'amigos' && (
              <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-[#38bdf8] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        {tab === 'personal' ? (
          <>
            {/* HERO DE RACHA: ESTILO DUOLINGO CON ILUSTRACIÓN DE HIELO/FUEGO */}
            <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-blue-400/20">
              {/* Partículas y destellos de fondo */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-cyan-200 bg-cyan-900/50 px-3 py-1 rounded-full border border-cyan-400/30 inline-block mb-3">
                    SOCIEDAD DE RACHAS EXTENSAS
                  </span>

                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl font-black text-white tracking-tight drop-shadow-md">
                      {streakDays}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-blue-100 tracking-wide block mt-1">
                    días de racha
                  </span>
                </div>

                {/* Ilustración de Llama Helada / Duolingo Protector */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 relative flex items-center justify-center self-center sm:self-auto">
                  <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl animate-pulse" />
                  
                  {/* Arte vectorial SVG del Protector de Racha de Hielo */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                  >
                    {/* Cristal exterior de hielo */}
                    <polygon
                      points="50,5 88,25 95,65 50,95 5,65 12,25"
                      fill="#7dd3fc"
                      stroke="#bae6fd"
                      strokeWidth="3"
                    />
                    {/* Facetas de cristal */}
                    <polygon
                      points="50,5 88,25 65,55 50,95"
                      fill="#38bdf8"
                      opacity="0.8"
                    />
                    <polygon
                      points="50,5 65,55 35,55"
                      fill="#e0f2fe"
                      opacity="0.9"
                    />
                    {/* Gota de agua/fuego interior de salvación */}
                    <path
                      d="M50 30 C58 45 66 55 66 65 A16 16 0 0 1 34 65 C34 55 42 45 50 30 Z"
                      fill="#0284c7"
                    />
                    <ellipse cx="45" cy="62" rx="4" ry="7" fill="#38bdf8" opacity="0.8" />
                    {/* Destellos de brillo */}
                    <polygon points="32,28 35,24 38,28 35,32" fill="#ffffff" />
                    <polygon points="72,40 75,36 78,40 75,44" fill="#ffffff" />
                  </svg>
                </div>
              </div>

              {/* Tarjeta de aviso de protector */}
              <div className="mt-6 p-4 rounded-2xl bg-[#0b1329]/80 backdrop-blur-md border border-cyan-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Shield className="w-5 h-5 text-cyan-200 fill-cyan-200/20" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-100">
                      {hasPracticedToday
                        ? '¡Racha del día asegurada con éxito! Continúa mañana.'
                        : 'El Protector de racha te salvó ayer. Hoy depende de ti. ¡Practica ahora!'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePracticeAction}
                  className="px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#0f172a] text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-md shrink-0 text-center"
                >
                  {hasPracticedToday ? 'Practicar Más' : 'EMPEZAR LECCIÓN'}
                </button>
              </div>
            </div>

            {/* SECCIÓN CALENDARIO DE RACHA */}
            <div className="bg-[#1e293b] rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Calendario de racha
                </h2>

                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">
                    septiembre de 2026
                  </span>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-gray-400 mb-3">
                <span>D</span>
                <span>L</span>
                <span>Ma</span>
                <span>Mi</span>
                <span>J</span>
                <span>V</span>
                <span>S</span>
              </div>

              {/* Grilla del calendario con pines de racha estilo Duolingo */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((item, index) => {
                  if (!item.day) {
                    return <div key={`empty-${index}`} className="h-10 sm:h-12" />;
                  }

                  const isStreakDay = item.hasStreak;
                  const isToday = item.isToday;

                  return (
                    <div
                      key={`day-${item.day}`}
                      className="h-10 sm:h-12 flex items-center justify-center relative group"
                    >
                      {isStreakDay ? (
                        // Pin de racha estilo Duolingo
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#38bdf8] text-[#0f172a] font-black text-xs sm:text-sm flex items-center justify-center shadow-md relative group-hover:scale-110 transition-transform">
                          {/* Colita de gota / pin */}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#38bdf8] rotate-45" />
                          <span className="relative z-10">{item.day}</span>
                        </div>
                      ) : isToday ? (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white">
                          <span>{item.day}</span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-gray-200 transition">
                          {item.day}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN: SOCIEDAD DE RACHAS EXTENSAS */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white tracking-wide">
                Sociedad de rachas extensas
              </h2>

              {/* Tarjeta 1: 1 Protector extra */}
              <div className="p-5 rounded-3xl bg-[#1e293b] border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Icono de Protector de Hielo */}
                  <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <Shield className="w-8 h-8 text-[#38bdf8] fill-[#38bdf8]/30" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white">
                        1 Protector extra
                      </h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                        {streakProtectors} disponibles
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 max-w-sm">
                      Protección adicional para tu racha si no estudias por un día.
                    </p>
                    <span className="text-[11px] font-black text-cyan-400 tracking-wider block mt-2">
                      RECIBIRÁS UNO EN 48 DÍAS
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Recompensa 365 días (Candado) */}
              <div className="p-5 rounded-3xl bg-[#1e293b]/70 border border-white/10 flex items-center justify-between gap-4 opacity-85">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center shrink-0">
                    <Lock className="w-7 h-7 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-200">
                      365 días
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">
                      Alcanza una racha de 365 días para recibir este trofeo y aspecto exclusivo.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] font-black text-gray-400 tracking-wider">
                        NO OBTENIDA
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">
                        {streakDays} / 365 días
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB: ENTRE AMIGOS */
          <div className="space-y-4">
            <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Rachas de tus Amigos de Clase
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Estudien juntos, motívense y no dejen caer la racha de estudio.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div className="divide-y divide-white/10 mt-2">
                {friends.map((friend, idx) => (
                  <div
                    key={friend.id}
                    className={`py-3.5 flex items-center justify-between gap-3 ${
                      friend.isUser ? 'bg-cyan-950/40 -mx-3 px-3 rounded-2xl' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-400 w-4">
                        #{idx + 1}
                      </span>
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/40"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white block">
                          {friend.name}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {friend.isUser ? 'Tú mantienes el 1er lugar' : 'Semestre VI'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm font-black text-orange-400">
                        <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
                        <span>{friend.streak} d</span>
                      </div>

                      {!friend.isUser && (
                        <button
                          onClick={() => handlePokeFriend(friend.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            friendPoked[friend.id]
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-gray-200'
                          }`}
                        >
                          {friendPoked[friend.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>¡Animado!</span>
                            </>
                          ) : (
                            <>
                              <span>🙌 Animar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pacto de Racha */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white">
                  Pacto de Racha de Grupo
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Si todos los miembros completan 1 sesión diaria, obtienen +50 Gemas el domingo.
                </p>
              </div>
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-black shrink-0 hover:bg-cyan-400 transition"
              >
                Invitar Amigo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
