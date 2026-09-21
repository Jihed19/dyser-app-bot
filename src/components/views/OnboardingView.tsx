import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Camera,
  Mic,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  User as UserIcon,
  ChevronRight,
  BookOpen,
  School,
  Globe2,
  Rocket,
  Clock,
  Flame,
  Award,
  Volume2,
  VolumeX,
  Trophy,
  Cpu,
  Zap,
  Target,
  Layers,
  X,
  AlertCircle,
} from 'lucide-react';
import { StudentProfile } from '../../types';
import { DyserLogo } from '../Header';
import { sounds } from '../../services/soundEffects';
import { STUDENT_AVATAR } from '../../data/mockData';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  completeStudentOnboarding,
  OnboardingAnswers,
} from '../../services/authService';

interface OnboardingViewProps {
  onComplete: (profile: StudentProfile) => void;
  initialStudent?: StudentProfile;
}

type OnboardingStage = 'carousel' | 'auth_options' | 'email_form' | 'questionnaire' | 'celebration';

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  // Estado de Navegación y Vistas
  const [stage, setStage] = useState<OnboardingStage>('carousel');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Estado de Autenticación
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  } | null>(null);
  const [authProviderType, setAuthProviderType] = useState<'google' | 'password'>('password');

  // Estado del Cuestionario estilo Duolingo
  const [questionStep, setQuestionStep] = useState<1 | 2 | 3>(1);
  const [selectedLevel, setSelectedLevel] = useState<'primaria' | 'secundaria' | 'universidad' | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(sounds.getIsMuted());

  // Diapositivas de la Presentación Inicial (Onboarding visual con fondo oscuro e iconografía corporativa Dyser)
  const carouselSlides = [
    {
      id: 'nasser-ai',
      badge: 'Tutor Académico 24/7',
      title: 'Tutor Nasser IA en Tiempo Real',
      subtitle: 'Respuestas directas con razonamiento profundo sin rodeos',
      description:
        'Resuelve teoremas paso a paso, depura algoritmos, analiza textos científicos y explica conceptos complejos con la precisión de un profesor de élite.',
      icon: Bot,
      accentColor: 'text-[#fe6b00]',
      gradient: 'from-[#00164e] via-[#00236f] to-[#090d16]',
      glowColor: 'bg-[#fe6b00]/25',
      metric: 'Razonamiento Flash 3.8 Integrado',
    },
    {
      id: 'blackboard',
      badge: 'Visión Multimodal IA',
      title: 'Digitalizador de Pizarras de Aula',
      subtitle: 'De tiza o marcador borroso a apuntes y fórmulas LaTeX',
      description:
        'Toma una foto del pizarrón y dyser aísla fórmulas, tablas y esquemas al instante, estructurándolos en documentos Markdown y fichas descargables.',
      icon: Camera,
      accentColor: 'text-amber-400',
      gradient: 'from-[#00236f] via-[#09122c] to-[#090d16]',
      glowColor: 'bg-amber-500/20',
      metric: 'Transcripción punto por punto instantánea',
    },
    {
      id: 'class-recorder',
      badge: 'Audio y Alertas de Examen',
      title: 'Grabación de Clases en Vivo',
      subtitle: 'Nunca más te perderás lo que dijo el docente',
      description:
        'Graba la clase en tu propio dispositivo, transcribe de forma íntegra sin sesgos y detecta alertas textuales de lo que realmente entrará al examen.',
      icon: Mic,
      accentColor: 'text-red-400',
      gradient: 'from-[#1e1548] via-[#00236f] to-[#090d16]',
      glowColor: 'bg-red-500/20',
      metric: 'Detección inteligente de preguntas de parcial',
    },
    {
      id: 'exam-simulator',
      badge: 'Evaluación y Práctica Oral',
      title: 'Simulador de Exámenes y Racha',
      subtitle: 'Entrena con rigor para obtener una calificación de 10',
      description:
        'Genera pruebas tipo test personalizadas, entrena tu oratoria para exposiciones y mantén tu racha diaria de estudio activo en un entorno gamificado.',
      icon: GraduationCap,
      accentColor: 'text-emerald-400',
      gradient: 'from-[#00236f] via-[#092635] to-[#090d16]',
      glowColor: 'bg-emerald-500/20',
      metric: '+45% retención antes de cualquier evaluación',
    },
  ];

  const currentSlide = carouselSlides[carouselIndex];

  // Alternar sonido
  const handleToggleSound = () => {
    const isNowMuted = sounds.toggleMute();
    setSoundMuted(isNowMuted);
    if (!isNowMuted) {
      sounds.playTap();
    }
  };

  // -------------------------------------------------------------
  // FLUJO DE AUTENTICACIÓN
  // -------------------------------------------------------------

  const handleGoogleSignIn = async () => {
    // Limpiar cualquier error estático previo inmediatamente
    setAuthError(null);
    setIsAuthenticating(true);
    sounds.playTap();

    try {
      const result = await loginWithGoogle();
      if (!result?.user) return;

      // Si el correo ya existía con onboarding completado, entrar directo a Dyser
      if (!result.isNewUser && result.profile) {
        sounds.playSuccess();
        onComplete(result.profile);
        return;
      }

      // Si es un usuario nuevo, iniciar el cuestionario personalizado
      setAuthenticatedUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      setAuthProviderType('google');
      if (result.user.displayName) {
        setName(result.user.displayName);
      }
      sounds.playChime();
      setStage('questionnaire');
    } catch (err: any) {
      // Si el usuario simplemente cerró o canceló la ventana de Google, no mostramos error
      if (
        err?.message === 'popup-closed' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        setAuthError(null);
        return;
      }
      console.warn('[Onboarding] Error Google:', err);
      setAuthError(err.message || 'No se pudo completar la autenticación con Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      setAuthError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    sounds.playTap();

    try {
      if (emailMode === 'login') {
        // Iniciar Sesión de Usuario Existente
        const result = await loginWithEmail(email, password);
        if (!result.isNewUser && result.profile) {
          sounds.playSuccess();
          onComplete(result.profile);
          return;
        }

        // Si existe la cuenta pero no había completado el onboarding
        setAuthenticatedUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || email.split('@')[0],
        });
        setAuthProviderType('password');
        setStage('questionnaire');
      } else {
        // Crear Cuenta de Usuario Nuevo -> Cuestionario inmediato
        const result = await registerWithEmail(email, password, name);
        setAuthenticatedUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: name.trim() || result.user.displayName || email.split('@')[0],
        });
        setAuthProviderType('password');
        sounds.playChime();
        setStage('questionnaire');
      }
    } catch (err: any) {
      console.warn('[Onboarding] Error Email:', err);
      let friendlyMsg = 'Error al procesar la solicitud.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMsg = 'Contraseña incorrecta. Por favor verifica tu contraseña e inténtalo de nuevo.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyMsg = 'No existe ninguna cuenta registrada con este correo electrónico. Selecciona "Crear Cuenta".';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMsg = 'Este correo ya está registrado en Dyser. Selecciona "Iniciar Sesión".';
      } else if (err.code === 'auth/weak-password') {
        friendlyMsg = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMsg = 'El formato de correo no es válido.';
      } else if (err.message) {
        friendlyMsg = err.message;
      }
      setAuthError(friendlyMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // -------------------------------------------------------------
  // FINALIZACIÓN DEL CUESTIONARIO DUOLINGO
  // -------------------------------------------------------------

  const handleFinishQuestionnaire = async () => {
    if (!selectedLevel || !selectedReason || !selectedMinutes) return;

    sounds.playSuccess();
    setStage('celebration');

    const quote =
      selectedMinutes <= 10
        ? '¡Paso a paso se forjan los grandes hábitos!'
        : selectedMinutes <= 20
        ? '¡Ritmo ideal para dominar temas clave sin saturarte!'
        : '¡Enfoque de alto rendimiento para alcanzar el 10!';

    const answers: OnboardingAnswers = {
      studyLevel: selectedLevel,
      goalReason: selectedReason,
      dailyStudyMinutes: selectedMinutes,
      motivationalQuote: quote,
      userName: authenticatedUser?.displayName || name || email.split('@')[0] || 'Estudiante Dyser',
      authProvider: authProviderType,
    };

    try {
      const savedProfile = await completeStudentOnboarding(
        authenticatedUser || { email, displayName: name },
        answers
      );

      setTimeout(() => {
        sounds.playLevelUp();
        onComplete(savedProfile);
      }, 2200);
    } catch (err) {
      console.error('[Onboarding] Error guardando perfil:', err);
      // Fallback seguro
      setTimeout(() => {
        onComplete({
          name: answers.userName || 'Estudiante Dyser',
          avatar: STUDENT_AVATAR,
          program: 'Educación Superior',
          semester: 'Ciclo Académico 2026',
          gpa: 0.0,
          attendanceRate: 100,
          streakDays: 1,
          completedTasksCount: 0,
          onboardingCompleted: true,
          studyLevel: selectedLevel,
          goalReason: selectedReason,
          dailyStudyMinutes: selectedMinutes,
        });
      }, 2000);
    }
  };

  // Mensaje motivacional dinámico según el tiempo seleccionado
  const getMotivationalQuoteForMinutes = (mins: number | null) => {
    switch (mins) {
      case 5:
        return '⚡ ¡Paso a paso! 5 minutos diarios son suficientes para crear un hábito inquebrantable sin agobios.';
      case 10:
        return '🌱 ¡Gran constancia! Un repaso ágil que mantendrá tu memoria activa y tus materias al día.';
      case 15:
        return '🔥 ¡El ritmo ideal! Tiempo perfecto para afianzar conceptos difíciles y sostener tu racha de honor.';
      case 30:
        return '🚀 ¡Alto rendimiento! Prepárate para subir significativamente tu promedio y dominar tus tareas.';
      case 60:
        return '🏆 ¡Nivel Legendario! Dedicación de élite académica para liderar tu curso y asegurar notas de 10.';
      default:
        return 'Selecciona tu compromiso diario para recibir tu plan de estudio personalizado.';
    }
  };

  // Renderizado de ilustraciones corporativas minimalistas Dyser
  const renderSlideCorporateGraphic = (slideId: string) => {
    switch (slideId) {
      case 'nasser-ai':
        return (
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-[#00236f]/40 border border-[#fe6b00]/30 animate-pulse" />
            <div className="absolute inset-3 rounded-2xl bg-gradient-to-tr from-[#00164e] to-[#00236f] border border-blue-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(254,107,0,0.25)]">
              <div className="relative flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#fe6b00] to-amber-400 flex items-center justify-center shadow-lg shadow-[#fe6b00]/40">
                  <Bot className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                </div>
                <div className="mt-2 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black text-blue-200 uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#fe6b00]" />
                  <span>Nasser 3.8</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-[#090d16] border border-[#fe6b00]/50 text-[10px] sm:text-[11px] font-black text-amber-300 shadow-md flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#fe6b00]" />
              <span>24/7 Razonamiento</span>
            </div>
          </div>
        );
      case 'blackboard':
        return (
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-[#00236f]/40 border border-amber-500/30" />
            <div className="absolute inset-3 rounded-2xl bg-[#0a1224] border border-amber-400/30 p-3 flex flex-col justify-between shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold text-gray-300">Scanner Pizarra</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">100% OCR</span>
              </div>
              <div className="space-y-1 font-mono text-[10px] text-amber-200/90 text-left bg-black/40 p-2 rounded-xl border border-white/5">
                <p className="text-blue-300 font-bold">\int f(x)dx = F(x) + C</p>
                <p className="text-gray-400 text-[9px]">\nabla \cdot \vec{"{E}"} = \frac{"{\\rho}"}{"{\\varepsilon_0}"}</p>
              </div>
              <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold">
                <span>LaTeX + Markdown</span>
                <span className="text-amber-400">Pizarra Limpia</span>
              </div>
            </div>
          </div>
        );
      case 'class-recorder':
        return (
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-[#00236f]/40 border border-red-500/30" />
            <div className="absolute inset-3 rounded-2xl bg-[#0a1224] border border-red-400/30 p-3.5 flex flex-col items-center justify-between shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">REC EN VIVO</span>
                </div>
                <Mic className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex items-end gap-1 h-10 sm:h-12 w-full justify-center px-1">
                {[35, 70, 50, 85, 95, 60, 80, 45, 90, 65, 45, 75].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-red-500 via-[#fe6b00] to-amber-300"
                  />
                ))}
              </div>
              <div className="w-full text-center px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] sm:text-[10px] font-bold text-red-200">
                ⚠️ Alerta de Parcial Detectada
              </div>
            </div>
          </div>
        );
      case 'exam-simulator':
        return (
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-[#00236f]/40 border border-emerald-500/30" />
            <div className="absolute inset-3 rounded-2xl bg-[#0a1224] border border-emerald-400/30 p-3.5 flex flex-col items-center justify-between shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-black text-xs">
                  Nota: 10 / 10
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#fe6b00]/20 border border-[#fe6b00]/30 text-[#fe6b00] font-black text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Racha</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Simulador de Examen Real
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-white flex flex-col justify-between selection:bg-[#fe6b00]/30 selection:text-[#fe6b00]">
      {/* Barra Superior con Logo Dyser y Control de Sonido */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <DyserLogo size="md" showText={true} textColor="text-white" />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#00236f] border border-blue-500/30 text-blue-200">
            Plataforma Académica
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition border border-white/10"
            title={soundMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {stage === 'carousel' && (
            <button
              onClick={() => {
                sounds.playTap();
                setAuthError(null);
                setStage('auth_options');
              }}
              className="text-xs font-bold text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              Saltar
            </button>
          )}
        </div>
      </header>

      {/* Contenedor Principal con Transición Animada */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full max-w-4xl mx-auto z-10">
        <AnimatePresence mode="wait">
          {/* =========================================================
              FASE 1: CARRUSEL VISUAL DE BIENVENIDA (PRESENTACIÓN INICIAL)
             ========================================================= */}
          {stage === 'carousel' && (
            <motion.div
              key="carousel-stage"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full max-w-2xl relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#00164e]/90 via-[#00236f]/60 to-[#0c1322] border border-white/10 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
                {/* Resplandor decorativo */}
                <div className={`absolute -right-16 -top-16 w-56 h-56 rounded-full ${currentSlide.glowColor} blur-3xl pointer-events-none transition-colors duration-500`} />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                  {/* Ilustración Corporativa Dyser del Pilar */}
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                    <motion.div
                      key={currentSlide.id}
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {renderSlideCorporateGraphic(currentSlide.id)}
                    </motion.div>
                  </div>

                  {/* Badge de Pilar */}
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-blue-200">
                    <Sparkles className="w-3.5 h-3.5 text-[#fe6b00]" />
                    <span>{currentSlide.badge}</span>
                  </div>

                  {/* Título y Descripción del Pilar */}
                  <div className="space-y-2 max-w-lg">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                      {currentSlide.title}
                    </h2>
                    <p className={`text-sm sm:text-base font-semibold ${currentSlide.accentColor}`}>
                      {currentSlide.subtitle}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed pt-1">
                      {currentSlide.description}
                    </p>
                  </div>

                  {/* Indicadores de Puntos (Dots Interactivos) */}
                  <div className="flex items-center gap-2 pt-2">
                    {carouselSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          sounds.playTap();
                          setCarouselIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          carouselIndex === idx
                            ? 'w-8 bg-[#fe6b00] shadow-[0_0_12px_rgba(254,107,0,0.6)]'
                            : 'w-2 bg-white/25 hover:bg-white/40'
                        }`}
                        aria-label={`Ir al pilar ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Botones de Navegación del Carrusel */}
                  <div className="w-full pt-4 flex items-center justify-between gap-4">
                    {carouselIndex > 0 ? (
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setCarouselIndex((prev) => prev - 1);
                        }}
                        className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {carouselIndex < carouselSlides.length - 1 ? (
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setCarouselIndex((prev) => prev + 1);
                        }}
                        className="px-7 py-3.5 rounded-2xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-sm font-bold shadow-lg shadow-[#00236f]/50 hover:shadow-blue-500/20 active:scale-95 transition flex items-center gap-2 ml-auto"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4 text-[#fe6b00]" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setAuthError(null);
                          setStage('auth_options');
                        }}
                        className="px-9 py-3.5 rounded-2xl bg-[#fe6b00] hover:bg-[#e05e00] text-white text-sm font-black shadow-xl shadow-[#fe6b00]/30 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2 ml-auto cursor-pointer"
                      >
                        <span>Empezar</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================
              FASE 2: OPCIONES DE ACCESO Y AUTENTICACIÓN
             ========================================================= */}
          {stage === 'auth_options' && (
            <motion.div
              key="auth-options-stage"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md relative overflow-hidden rounded-3xl bg-[#111728]/95 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
            >
              {/* Resplandor decorativo */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#fe6b00]/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-[#00236f] border border-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-900/40">
                  <img src="/icon.svg" alt="Dyser" className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Comienza con Dyser</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Tu espacio académico personal con IA de nivel legendario
                  </p>
                </div>

                {authError && (
                  <div className="w-full p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start justify-between gap-2 animate-fadeIn">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthError(null)}
                      className="text-red-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                      title="Cerrar aviso"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Botones Principales de Acceso */}
                <div className="w-full space-y-3 pt-2">
                  {/* Continuar con Google */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isAuthenticating}
                    className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm shadow-md transition flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isAuthenticating ? 'Conectando...' : 'Continuar con Google'}</span>
                  </button>

                  {/* Continuar con Email */}
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setAuthError(null);
                      setStage('email_form');
                    }}
                    disabled={isAuthenticating}
                    className="w-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
                  >
                    <Mail className="w-4 h-4 text-[#fe6b00]" />
                    <span>Continuar con email</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 pt-2">
                  Al continuar, aceptas el protocolo de excelencia y privacidad académica de Dyser.
                </p>

                <button
                  onClick={() => setStage('carousel')}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition pt-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Volver a la presentación</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* =========================================================
              FASE 2.B: FORMULARIO DE ACCESO CON EMAIL
             ========================================================= */}
          {stage === 'email_form' && (
            <motion.div
              key="email-form-stage"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md relative overflow-hidden rounded-3xl bg-[#111728]/95 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="relative z-10 flex flex-col space-y-5">
                {/* Selector Iniciar Sesión / Crear Cuenta */}
                <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setEmailMode('login');
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      emailMode === 'login'
                        ? 'bg-[#00236f] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setEmailMode('register');
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      emailMode === 'register'
                        ? 'bg-[#fe6b00] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Crear Cuenta
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    {emailMode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu perfil de estudiante'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {emailMode === 'login'
                      ? 'Accede directamente a tus apuntes y panel académico'
                      : 'Configura tu cuenta y personaliza tu tutor Nasser IA'}
                  </p>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start justify-between gap-2 animate-fadeIn">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthError(null)}
                      className="text-red-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                      title="Cerrar aviso"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                  {emailMode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-300">Nombre completo</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej. Sofía Herrera"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white text-sm focus:outline-none focus:border-[#fe6b00] transition"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu_correo@universidad.edu"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white text-sm focus:outline-none focus:border-[#fe6b00] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Contraseña</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        autoComplete={emailMode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={emailMode === 'login' ? 'Introduce tu contraseña' : 'Mínimo 6 caracteres'}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white text-sm focus:outline-none focus:border-[#fe6b00] transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className={`w-full py-3 px-4 rounded-2xl text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                      emailMode === 'login'
                        ? 'bg-[#00236f] hover:bg-[#1e3a8a] shadow-[#00236f]/40'
                        : 'bg-[#fe6b00] hover:bg-[#e05e00] shadow-[#fe6b00]/40'
                    }`}
                  >
                    <span>
                      {isAuthenticating
                        ? 'Verificando en Firebase...'
                        : emailMode === 'login'
                        ? 'Iniciar Sesión'
                        : 'Crear Cuenta y Continuar'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setStage('auth_options');
                    }}
                    className="text-xs text-gray-400 hover:text-white transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Volver a opciones de acceso</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================
              FASE 3: CUESTIONARIO INTERACTIVO ESTILO DUOLINGO
             ========================================================= */}
          {stage === 'questionnaire' && (
            <motion.div
              key={`question-step-${questionStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-xl relative overflow-hidden rounded-3xl bg-[#111728]/95 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
            >
              {/* Barra de Progreso Superior estilo Duolingo */}
              <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                <button
                  onClick={() => {
                    sounds.playTap();
                    if (questionStep > 1) {
                      setQuestionStep((prev) => (prev - 1) as 1 | 2 | 3);
                    } else {
                      setAuthError(null);
                      setStage('auth_options');
                    }
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition"
                  title="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex-1 h-3.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#fe6b00] to-amber-400 shadow-[0_0_10px_rgba(254,107,0,0.5)]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(questionStep / 3) * 100}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>

                <span className="text-xs font-black text-[#fe6b00] tracking-wider">
                  {questionStep}/3
                </span>
              </div>

              {/* Guía Corporativa Asistente Académico Dyser */}
              <div className="flex items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00164e] to-[#00236f] border border-[#fe6b00]/40 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-[#fe6b00]/20">
                  <Bot className="w-7 h-7 text-[#fe6b00]" />
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-xs text-gray-200 flex-1">
                  <span className="font-bold text-[#fe6b00] mr-1">Dyser IA:</span>
                  {questionStep === 1 && '¡Hola! Primero cuéntame tu nivel educativo para calibrar las explicaciones.'}
                  {questionStep === 2 && '¡Excelente! ¿Cuál es tu meta principal con Dyser en este ciclo?'}
                  {questionStep === 3 && '¡Ya casi terminamos! Define tu tiempo de dedicación diaria para sostener tu racha.'}
                </div>
              </div>

              {/* CONTENIDO: PREGUNTA 1 */}
              {questionStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-white">¿Qué estudias?</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      {
                        id: 'primaria' as const,
                        label: 'Educación Primaria',
                        sub: 'Grado escolar, conceptos iniciales y tareas',
                        icon: School,
                        color: 'from-amber-500/20 to-orange-500/10',
                      },
                      {
                        id: 'secundaria' as const,
                        label: 'Secundaria o Bachillerato',
                        sub: 'Preparatoria, exámenes de admisión y ciencias básicas',
                        icon: BookOpen,
                        color: 'from-blue-500/20 to-indigo-500/10',
                      },
                      {
                        id: 'universidad' as const,
                        label: 'Universidad o Superior',
                        sub: 'Licenciatura, ingeniería, posgrado e investigación formal',
                        icon: GraduationCap,
                        color: 'from-purple-500/20 to-pink-500/10',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedLevel === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            sounds.playPop();
                            setSelectedLevel(item.id);
                          }}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                            isSelected
                              ? 'bg-gradient-to-r ' + item.color + ' border-[#fe6b00] shadow-lg shadow-[#fe6b00]/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                                isSelected ? 'bg-[#fe6b00] text-white' : 'bg-white/10 text-gray-300'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{item.label}</div>
                              <div className="text-xs text-gray-400">{item.sub}</div>
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#fe6b00] border-[#fe6b00] text-white'
                                : 'border-white/30 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CONTENIDO: PREGUNTA 2 */}
              {questionStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    ¿Por qué decidiste descargar Dyser?
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      {
                        id: 'Me lo recomendaron amigos o docentes',
                        icon: Globe2,
                        text: 'Me lo recomendaron mis compañeros o docentes',
                      },
                      {
                        id: 'Quiero viajar e intercambios académicos',
                        icon: Rocket,
                        text: 'Quiero viajar e intercambios de estudio',
                      },
                      {
                        id: 'Quiero avanzar más en mis estudios',
                        icon: Award,
                        text: 'Quiero avanzar más en mis estudios y subir mi promedio',
                      },
                      {
                        id: 'Digitalizar pizarras y organizar clases con IA',
                        icon: Camera,
                        text: 'Digitalizar pizarras y organizar mis clases con IA',
                      },
                      {
                        id: 'Eliminar el estrés antes de exámenes',
                        icon: Sparkles,
                        text: 'Eliminar el estrés y preparar exámenes con seguridad',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedReason === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            sounds.playPop();
                            setSelectedReason(item.id);
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                            isSelected
                              ? 'bg-[#00236f]/60 border-[#fe6b00] shadow-md shadow-[#fe6b00]/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-5 h-5 ${isSelected ? 'text-[#fe6b00]' : 'text-gray-400'}`}
                            />
                            <span className="text-xs sm:text-sm font-semibold text-gray-200">
                              {item.text}
                            </span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#fe6b00] border-[#fe6b00] text-white'
                                : 'border-white/30 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CONTENIDO: PREGUNTA 3 */}
              {questionStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    ¿Cuánto tiempo de estudio vas a dedicarle?
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { minutes: 5, label: '5 min', tag: 'Rápido' },
                      { minutes: 10, label: '10 min', tag: 'Constante' },
                      { minutes: 15, label: '15 min', tag: 'Recomendado' },
                      { minutes: 30, label: '30 min', tag: 'Enfoque' },
                      { minutes: 60, label: '1 hora', tag: 'Élite' },
                    ].map((item) => {
                      const isSelected = selectedMinutes === item.minutes;
                      return (
                        <button
                          key={item.minutes}
                          onClick={() => {
                            sounds.playPop();
                            setSelectedMinutes(item.minutes);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-[#fe6b00] text-white border-[#fe6b00] shadow-lg shadow-[#fe6b00]/30'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <Clock className="w-4 h-4 mb-1 opacity-80" />
                          <span className="text-sm font-black">{item.label}</span>
                          <span
                            className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full mt-1 ${
                              isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                            }`}
                          >
                            {item.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mensaje motivacional dinámico en pantalla */}
                  <motion.div
                    key={selectedMinutes || 'none'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-[#00236f]/50 to-indigo-950/40 border border-blue-400/30 flex items-start gap-3"
                  >
                    <Flame className="w-5 h-5 text-[#fe6b00] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                        Estrategia de Racha Dyser
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed font-medium">
                        {getMotivationalQuoteForMinutes(selectedMinutes)}
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Botón Inferior estilo Duolingo (Continuar) */}
              <div className="pt-6 border-t border-white/10 mt-6 flex justify-end">
                <button
                  disabled={
                    (questionStep === 1 && !selectedLevel) ||
                    (questionStep === 2 && !selectedReason) ||
                    (questionStep === 3 && !selectedMinutes)
                  }
                  onClick={() => {
                    sounds.playTap();
                    if (questionStep < 3) {
                      setQuestionStep((prev) => (prev + 1) as 1 | 2 | 3);
                    } else {
                      handleFinishQuestionnaire();
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#fe6b00] hover:bg-[#e05e00] disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#fe6b00]/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{questionStep === 3 ? 'Completar y Entrar' : 'Continuar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* =========================================================
              FASE 4: CELEBRACIÓN DE BIENVENIDA Y ACCESO AL DASHBOARD
             ========================================================= */}
          {stage === 'celebration' && (
            <motion.div
              key="celebration-stage"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full max-w-md text-center p-8 rounded-3xl bg-gradient-to-b from-[#00236f] to-[#090d16] border border-blue-500/30 shadow-2xl space-y-6"
            >
              <div className="w-28 h-28 mx-auto relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#fe6b00] to-amber-400 opacity-25 blur-xl animate-pulse" />
                <motion.div
                  className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#fe6b00] to-amber-500 border-2 border-amber-300/40 p-4 flex items-center justify-center shadow-[0_10px_30px_rgba(254,107,0,0.5)]"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Trophy className="w-12 h-12 text-white" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Perfil Académico Creado!</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  ¡Todo Listo para Triunfar!
                </h3>
                <p className="text-xs sm:text-sm text-blue-200">
                  Guardando tus preferencias en Firebase. Entrando a tu panel de estudio...
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-[#fe6b00]" />
                <span className="text-xs font-bold text-white">+100 XP por inicio de racha académica</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Pie de página con versión */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-3 text-center text-[11px] text-gray-500 z-10">
        dyser Academic Platform • Desarrollado con tecnología Nasser IA y Firebase Real-Time
      </footer>
    </div>
  );
};
