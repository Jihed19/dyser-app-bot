import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Camera,
  Mic,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Zap,
  BookOpen,
  Award,
} from 'lucide-react';
import { ActiveTab, StudentProfile } from '../../types';
import { DyserLogo } from '../Header';
import { ChameleonAvatar } from '../chameleon/ChameleonAvatar';

interface OnboardingViewProps {
  onComplete: () => void;
  onNavigateTo: (tab: ActiveTab) => void;
  student: StudentProfile;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onComplete,
  onNavigateTo,
  student,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const pillars = [
    {
      id: 'nasser',
      title: 'Tutor Nasser IA en Tiempo Real',
      subtitle: 'Tutoría académica 24/7 con razonamiento profundo',
      description:
        'Resuelve teoremas, depura algoritmos, compara filosofías y te explica conceptos abstractos con analogías cotidianas y rigor universitario.',
      icon: Bot,
      color: 'bg-indigo-600',
      badge: 'Modelo Flash 3.8 Académico',
      metric: '99.4% precisión en dudas complejas',
      actionTab: 'nasser-ia' as ActiveTab,
      actionLabel: 'Probar Nasser IA',
    },
    {
      id: 'blackboard',
      title: 'Foto a la Pizarra (Visión IA)',
      subtitle: 'De tiza o marcador borroso a apuntes legendarios',
      description:
        'Sube o toma una foto del pizarrón de clase. dyser aísla fórmulas manuscritas, esquemas y diagramas, transformándolos en notas Markdown editables.',
      icon: Camera,
      color: 'bg-amber-600',
      badge: 'Visión Multimodal',
      metric: 'Transcripción punto por punto instantánea',
      actionTab: 'blackboard' as ActiveTab,
      actionLabel: 'Ver Digitalizador',
    },
    {
      id: 'recorder',
      title: 'Grabador de Clases en Vivo',
      subtitle: 'Nunca más te perderás lo que dijo el docente',
      description:
        'Escucha la clase del profesor en segundo plano, detecta frases textuales de alerta ("¡esto entra al examen!") y estructura los apuntes por bloques temáticos.',
      icon: Mic,
      color: 'bg-red-500',
      badge: 'Audio Transcription Live',
      metric: 'Detección automática de preguntas de examen',
      actionTab: 'class-recorder' as ActiveTab,
      actionLabel: 'Abrir Grabador',
    },
    {
      id: 'exam',
      title: 'Simulador de Exámenes & Voice Coach',
      subtitle: 'Llega al día del examen sabiendo que vas a sacar 10',
      description:
        'Genera exámenes simulados adaptativos basados en tu temario y entrena tus exposiciones orales con análisis de voz, ritmo y detección de muletillas.',
      icon: GraduationCap,
      color: 'bg-purple-600',
      badge: 'Evaluación Interactiva',
      metric: '+45% retención antes del parcial',
      actionTab: 'exam-simulator' as ActiveTab,
      actionLabel: 'Lanzar Simulador',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00164e] via-[#00236f] to-[#1e3a8a] text-white p-6 sm:p-10 shadow-2xl">
        {/* Glow circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#fe6b00]/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <DyserLogo size="sm" showText={true} textColor="text-white" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#fe6b00]" />
                Élite Académica
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Bienvenido a <span className="text-[#fe6b00]">Dyser</span>, {student.name.split(' ')[0]}
            </h1>

            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
              La plataforma de estudio académico más avanzada del mundo. Diseñada meticulosamente
              para que transformes horas de esfuerzo agotador en un rendimiento estudiantil legendario.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-full bg-[#fe6b00] hover:bg-[#e05e00] text-white font-bold text-sm shadow-lg shadow-[#fe6b00]/30 active:scale-95 transition flex items-center gap-2"
              >
                <span>Entrar al Panel de Control</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateTo('nasser-ia')}
                className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-blue-300" />
                <span>Hablar con Nasser IA</span>
              </button>
            </div>
          </div>

          {/* dyser Mascot / Chameleon Coach */}
          <div className="relative flex flex-col items-center shrink-0">
            <ChameleonAvatar
              skinId="phoenix_fire"
              mood="fire_streak"
              size="lg"
              interactive={true}
              showAura={true}
              speechText="¡Hola! Soy Chami, tu tutor"
            />
            <span className="mt-3 text-xs font-black uppercase tracking-widest text-[#fe6b00] bg-black/40 px-3 py-1 rounded-full border border-[#fe6b00]/30">
              Mascota dyser • Nivel 3
            </span>
          </div>
        </div>
      </div>

      {/* 4 Superpowers Showcase */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Los 4 Superpoderes de tu Carrera
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Explora las herramientas que multiplicarán tu productividad por 10
            </p>
          </div>

          <div className="flex gap-1.5 bg-gray-200/50 dark:bg-gray-800/60 p-1 rounded-xl self-start">
            {pillars.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setCurrentStep(idx)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  currentStep === idx
                    ? 'bg-white dark:bg-[#1a2333] text-[#00236f] dark:text-[#90a8ff] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                Pilar 0{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Pillar Card */}
        {(() => {
          const p = pillars[currentStep];
          const Icon = p.icon;
          return (
            <div className="rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800/90 p-6 sm:p-8 shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-[#00236f] dark:text-[#90a8ff]">
                      {p.badge}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {p.metric}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{p.title}</h3>
                  <p className="text-sm font-semibold text-[#fe6b00]">{p.subtitle}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="pt-3 flex items-center gap-3">
                    <button
                      onClick={() => onNavigateTo(p.actionTab)}
                      className="px-5 py-2.5 rounded-xl bg-[#00236f] dark:bg-[#1e3a8a] text-white text-xs font-bold hover:bg-[#1e3a8a] transition flex items-center gap-2 active:scale-95"
                    >
                      <span>{p.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setCurrentStep((currentStep + 1) % pillars.length)}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      Siguiente pilar →
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-gray-50 dark:bg-[#162035] border border-gray-100 dark:border-gray-800 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${p.color} text-white flex items-center justify-center shadow-lg mb-3`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Pilar Activo
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Optimizado para escritorio y móvil PWA
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Student Academic Blueprint Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#00236f] dark:text-[#90a8ff] flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">9.4 / 10</div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Promedio Ponderado</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-[#fe6b00] flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">14 días</div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Racha de Estudio Activo</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">Top 2%</div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Rendimiento en Carrera</div>
          </div>
        </div>
      </div>
    </div>
  );
};
