import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChameleonSkinId, ChameleonMood } from '../../types';

interface VectorChameleonProps {
  skinId?: ChameleonSkinId;
  mood?: ChameleonMood;
  isTalking?: boolean;
  isPetted?: boolean;
  isBlinking?: boolean;
  lookX?: number; // -1 (left) to 1 (right)
  lookY?: number; // -1 (up) to 1 (down)
  showTongue?: boolean;
  celebrating?: boolean;
  className?: string;
}

export const VectorChameleon: React.FC<VectorChameleonProps> = ({
  skinId = 'classic_emerald',
  mood = 'happy',
  isTalking = false,
  isPetted = false,
  isBlinking = false,
  lookX = 0,
  lookY = 0,
  showTongue = false,
  celebrating = false,
  className = '',
}) => {
  // Paletas y gradientes vectoriales según la Skin
  const skinGradients = {
    classic_emerald: {
      id: 'grad-emerald',
      bodyStart: '#10b981',
      bodyMid: '#059669',
      bodyEnd: '#047857',
      bellyStart: '#bef264',
      bellyEnd: '#84cc16',
      crest: '#047857',
      eyeAccent: '#10b981',
      glow: '#10b981',
      spots: '#047857',
    },
    phoenix_fire: {
      id: 'grad-phoenix',
      bodyStart: '#ff8a00',
      bodyMid: '#fe6b00',
      bodyEnd: '#dc2626',
      bellyStart: '#fef08a',
      bellyEnd: '#f59e0b',
      crest: '#b91c1c',
      eyeAccent: '#fe6b00',
      glow: '#fe6b00',
      spots: '#991b1b',
    },
    royal_scholar: {
      id: 'grad-royal',
      bodyStart: '#fbbf24',
      bodyMid: '#f59e0b',
      bodyEnd: '#d97706',
      bellyStart: '#fef3c7',
      bellyEnd: '#fde68a',
      crest: '#92400e',
      eyeAccent: '#8b5cf6',
      glow: '#fbbf24',
      spots: '#78350f',
    },
    quantum_cyber: {
      id: 'grad-cyber',
      bodyStart: '#22d3ee',
      bodyMid: '#06b6d4',
      bodyEnd: '#2563eb',
      bellyStart: '#a5f3fc',
      bellyEnd: '#38bdf8',
      crest: '#1d4ed8',
      eyeAccent: '#06b6d4',
      glow: '#06b6d4',
      spots: '#1e40af',
    },
    cosmic_void: {
      id: 'grad-cosmic',
      bodyStart: '#a855f7',
      bodyMid: '#7c3aed',
      bodyEnd: '#4338ca',
      bellyStart: '#f472b6',
      bellyEnd: '#c084fc',
      crest: '#3730a3',
      eyeAccent: '#f43f5e',
      glow: '#8b5cf6',
      spots: '#312e81',
    },
    diamond_master: {
      id: 'grad-diamond',
      bodyStart: '#7dd3fc',
      bodyMid: '#38bdf8',
      bodyEnd: '#0284c7',
      bellyStart: '#f0f9ff',
      bellyEnd: '#bae6fd',
      crest: '#0369a1',
      eyeAccent: '#0ea5e9',
      glow: '#38bdf8',
      spots: '#075985',
    },
  }[skinId] || {
    id: 'grad-default',
    bodyStart: '#10b981',
    bodyMid: '#059669',
    bodyEnd: '#047857',
    bellyStart: '#bef264',
    bellyEnd: '#84cc16',
    crest: '#047857',
    eyeAccent: '#10b981',
    glow: '#10b981',
    spots: '#047857',
  };

  // Cálculo de desplazamiento de pupilas (mirar alrededor)
  const pupilOffsetX = lookX * 5;
  const pupilOffsetY = lookY * 4;

  return (
    <svg
      viewBox="0 0 200 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full drop-shadow-xl overflow-visible select-none ${className}`}
    >
      <defs>
        {/* Gradiente principal del cuerpo */}
        <linearGradient
          id={skinGradients.id}
          x1="30"
          y1="30"
          x2="170"
          y2="170"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={skinGradients.bodyStart} />
          <stop offset="50%" stopColor={skinGradients.bodyMid} />
          <stop offset="100%" stopColor={skinGradients.bodyEnd} />
        </linearGradient>

        {/* Gradiente de la barriguita */}
        <linearGradient
          id={`${skinGradients.id}-belly`}
          x1="80"
          y1="90"
          x2="150"
          y2="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={skinGradients.bellyStart} />
          <stop offset="100%" stopColor={skinGradients.bellyEnd} />
        </linearGradient>

        {/* Sombra suave interna */}
        <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.18" />
        </filter>

        {/* Filtro de brillo glow para skins especiales */}
        <filter id="skin-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={skinGradients.glow} floodOpacity="0.6" />
        </filter>
      </defs>

      {/* 1. COLA EN ESPIRAL (Animada: se enrosca, menea y vibra) */}
      <motion.g
        animate={
          celebrating
            ? { rotate: [0, -25, 15, -15, 0], scale: [1, 1.15, 1] }
            : isPetted
            ? { rotate: [-12, 16, -12, 10, 0] }
            : { rotate: [-4, 6, -4] }
        }
        transition={
          celebrating
            ? { duration: 1.2, repeat: Infinity }
            : isPetted
            ? { duration: 0.6 }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ transformOrigin: '75px 135px' }}
      >
        {/* Espiral de la cola */}
        <path
          d="M75 135 C 55 145, 30 145, 22 125 C 15 108, 25 88, 42 88 C 56 88, 62 100, 58 112 C 54 122, 42 124, 37 116 C 34 110, 38 102, 44 103"
          stroke={`url(#${skinGradients.id})`}
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#soft-shadow)"
        />
        {/* Punta interna de la espiral */}
        <circle cx="44" cy="103" r="6" fill={skinGradients.bodyStart} />
      </motion.g>

      {/* 2. PATA TRASERA */}
      <motion.ellipse
        cx="72"
        cy="156"
        rx="14"
        ry="8"
        fill={skinGradients.bodyEnd}
        animate={isPetted ? { scaleY: [1, 0.85, 1] } : {}}
      />
      <circle cx="63" cy="158" r="4" fill={skinGradients.bodyStart} />
      <circle cx="70" cy="160" r="4" fill={skinGradients.bodyStart} />

      {/* 3. CUERPO PRINCIPAL (Respiración continua + balanceo) */}
      <motion.g
        animate={
          celebrating
            ? { y: [0, -8, 0], scale: [1, 1.05, 1] }
            : isPetted
            ? { scale: [1, 1.08, 0.96, 1], y: [0, -6, 0] }
            : { scaleY: [1, 1.03, 1], y: [0, -2, 0] }
        }
        transition={{
          duration: isPetted ? 0.5 : 2.8,
          repeat: isPetted ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '110px 140px' }}
      >
        {/* Masa del torso */}
        <path
          d="M 68 135 C 65 95, 95 65, 135 65 C 165 65, 175 90, 170 125 C 165 152, 140 162, 105 160 C 80 158, 69 150, 68 135 Z"
          fill={`url(#${skinGradients.id})`}
          filter="url(#soft-shadow)"
        />

        {/* Motas/Pecas de camaleón */}
        <circle cx="95" cy="98" r="4" fill={skinGradients.spots} opacity="0.35" />
        <circle cx="110" cy="88" r="5" fill={skinGradients.spots} opacity="0.4" />
        <circle cx="85" cy="118" r="3.5" fill={skinGradients.spots} opacity="0.3" />

        {/* Barriguita suave contrastada (con forma ergonómica) */}
        <path
          d="M 100 105 C 115 105, 148 115, 155 138 C 150 152, 130 158, 110 155 C 95 153, 92 135, 100 105 Z"
          fill={`url(#${skinGradients.id}-belly)`}
        />

        {/* Líneas de costillas / textura suave en la barriguita */}
        <path d="M 112 120 C 122 124, 135 128, 144 135" stroke={skinGradients.bodyMid} strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
        <path d="M 108 132 C 118 136, 128 140, 136 146" stroke={skinGradients.bodyMid} strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      </motion.g>

      {/* 4. CRESTA DE LA CABEZA (Forma icónica dyser 'd' / Casco de camaleón) */}
      <motion.g
        animate={
          celebrating
            ? { rotate: [-4, 6, -4] }
            : isPetted
            ? { rotate: [0, -8, 4, 0] }
            : { rotate: [-1, 2, -1] }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '135px 65px' }}
      >
        {/* Cresta / Casque curva estilo dyser */}
        <path
          d="M 125 65 C 115 45, 120 28, 138 22 C 155 18, 168 32, 160 52 C 156 58, 150 63, 142 66 Z"
          fill={`url(#${skinGradients.id})`}
          filter="url(#soft-shadow)"
        />
        {/* Borde dorsal de la cresta */}
        <path
          d="M 132 26 C 145 22, 158 32, 153 48"
          stroke={skinGradients.crest}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* ACCESORIO EXCLUSIVO DE SKIN */}
        {/* Fénix de fuego: Llama mágica danzante */}
        {skinId === 'phoenix_fire' && (
          <motion.path
            d="M 144 24 C 140 10, 152 4, 148 -4 C 158 6, 164 16, 154 26 Z"
            fill="#facc15"
            animate={{ scaleY: [1, 1.3, 0.9, 1.2, 1], scaleX: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ transformOrigin: '148px 24px' }}
          />
        )}

        {/* Corona imperial (Royal Scholar) */}
        {skinId === 'royal_scholar' && (
          <g transform="translate(130, 8) scale(0.75)">
            <path
              d="M 0 16 L 6 0 L 14 10 L 22 0 L 28 16 Z"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="14" cy="6" r="2.5" fill="#8b5cf6" />
            <circle cx="6" cy="12" r="1.5" fill="#ef4444" />
            <circle cx="22" cy="12" r="1.5" fill="#3b82f6" />
          </g>
        )}

        {/* Antena / Visor Cibernético (Quantum Cyber) */}
        {skinId === 'quantum_cyber' && (
          <g>
            <line x1="145" y1="25" x2="155" y2="8" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
            <motion.circle
              cx="155"
              cy="8"
              r="4"
              fill="#22d3ee"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          </g>
        )}
      </motion.g>

      {/* 5. CABEZA, MEJILLAS Y HOCICO */}
      <motion.g
        animate={
          isTalking
            ? { y: [0, -3, 0] }
            : isPetted
            ? { rotate: [0, 4, -4, 0] }
            : {}
        }
        transition={{ duration: isTalking ? 0.25 : 0.6, repeat: isTalking ? Infinity : 0 }}
        style={{ transformOrigin: '140px 90px' }}
      >
        {/* Rostro / Hocico redondeado */}
        <path
          d="M 130 65 C 160 65, 185 78, 186 98 C 187 114, 172 126, 145 125 C 132 125, 126 115, 124 102 Z"
          fill={`url(#${skinGradients.id})`}
        />

        {/* Narina simpática */}
        <circle cx="180" cy="94" r="1.8" fill={skinGradients.bodyEnd} />

        {/* Mejilla sonrojada (se intensifica al acariciar o celebrar) */}
        <motion.ellipse
          cx="152"
          cy="110"
          rx="9"
          ry="6"
          fill="#f43f5e"
          animate={{
            opacity: isPetted ? 0.75 : mood === 'fire_streak' ? 0.5 : 0.25,
            scale: isPetted ? 1.3 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 6. BOCA & LENGUA CAMALEÓNICA (¡Habla y saca la lengua!) */}
        {/* Lengua disparada (Snap Tongue interactivo) */}
        <AnimatePresence>
          {showTongue && (
            <motion.g
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'backOut' }}
              style={{ transformOrigin: '175px 110px' }}
            >
              {/* Trayecto de la lengua retráctil */}
              <path
                d="M 175 110 Q 195 105, 218 108"
                stroke="#fb7185"
                strokeWidth="6.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Punta pegajosa atrapa-estrellas */}
              <circle cx="220" cy="108" r="6" fill="#f43f5e" />
              {/* Estrella / Chispa atrapada */}
              <motion.path
                d="M 226 102 L 228 106 L 232 107 L 229 110 L 230 114 L 226 111 L 222 114 L 223 110 L 220 107 L 224 106 Z"
                fill="#fbbf24"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Boca animada */}
        {isTalking ? (
          // Boca abierta hablando rítmicamente estilo Duolingo
          <motion.ellipse
            cx="170"
            cy="112"
            rx="6"
            ry="5"
            fill="#881337"
            animate={{ ry: [2, 6, 2], rx: [5, 7, 5] }}
            transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Dientecito o lengua visible dentro */}
            <ellipse cx="170" cy="114" rx="4" ry="2.5" fill="#f43f5e" />
          </motion.ellipse>
        ) : isPetted || celebrating ? (
          // Sonrisa súper alegre abierta
          <path
            d="M 160 108 Q 172 122, 182 108"
            stroke={skinGradients.crest}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="#881337"
          />
        ) : (
          // Sonrisa amistosa clásica
          <path
            d="M 163 107 C 168 112, 176 112, 181 106"
            stroke={skinGradients.crest}
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* 7. OJO DE CAMALEÓN (Torreta esférica + Párpados que pestañean + Pupila móvil) */}
        <g id="chameleon-eye">
          {/* Base abultada de la torreta del ojo */}
          <circle
            cx="140"
            cy="84"
            r="23"
            fill={`url(#${skinGradients.id})`}
            stroke={skinGradients.crest}
            strokeWidth="2.5"
            filter="url(#soft-shadow)"
          />

          {/* Anillo de escamas del ojo */}
          <circle cx="140" cy="84" r="18" fill={skinGradients.bodyStart} opacity="0.4" />

          {/* Esclerótica blanca y brillante */}
          <clipPath id="eye-clip">
            <circle cx="140" cy="84" r="15" />
          </clipPath>

          <g clipPath="url(#eye-clip)">
            {/* Fondo del ojo blanco brillante */}
            <circle cx="140" cy="84" r="15" fill="#ffffff" />

            {/* Pupila e Iris con movimiento y seguimiento */}
            <motion.g
              animate={{
                x: pupilOffsetX,
                y: pupilOffsetY,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Iris coloreado */}
              <circle
                cx="142"
                cy="84"
                r="9.5"
                fill={skinGradients.eyeAccent}
              />

              {/* Pupila negra profunda */}
              <circle
                cx="142"
                cy="84"
                r="6.5"
                fill="#0f172a"
              />

              {/* Brillo especular estilo anime/duolingo (¡lo hace ver vivo!) */}
              <circle cx="139" cy="81" r="2.8" fill="#ffffff" />
              <circle cx="144" cy="86" r="1.4" fill="#ffffff" />
            </motion.g>

            {/* PÁRPADOS QUE PESTAÑEAN NATURALMENTE */}
            <motion.rect
              x="120"
              y="65"
              width="40"
              height="38"
              fill={`url(#${skinGradients.id})`}
              initial={{ y: -38 }}
              animate={
                isPetted
                  ? { y: 0 } // Ojos cerrados de felicidad ^_^
                  : isBlinking
                  ? { y: [ -38, 0, -38 ] } // Pestañeo completo
                  : { y: -38 }
              }
              transition={
                isBlinking
                  ? { duration: 0.18, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
            />

            {/* Borde del párpado superior */}
            <motion.line
              x1="124"
              y1="84"
              x2="156"
              y2="84"
              stroke={skinGradients.crest}
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: isBlinking || isPetted ? 1 : 0 }}
            />
          </g>

          {/* Ojo cerrado curvo de alegría cuando está petted */}
          {isPetted && (
            <path
              d="M 130 84 Q 140 76, 150 84"
              stroke={skinGradients.crest}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      </motion.g>

      {/* 8. PATA DELANTERA (Saluda o descansa sobre la rama) */}
      <motion.g
        animate={
          celebrating
            ? { rotate: [-20, 25, -20], y: [-4, -12, -4] }
            : isPetted
            ? { rotate: [0, -15, 10, 0] }
            : { rotate: [-2, 3, -2] }
        }
        transition={
          celebrating
            ? { duration: 0.8, repeat: Infinity }
            : isPetted
            ? { duration: 0.5 }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ transformOrigin: '125px 145px' }}
      >
        {/* Brazo delantero */}
        <path
          d="M 125 140 C 135 142, 148 145, 146 156"
          stroke={`url(#${skinGradients.id})`}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        {/* Dedos en pinza (zygodactyly de camaleón) */}
        <circle cx="143" cy="158" r="4.5" fill={skinGradients.bodyStart} />
        <circle cx="150" cy="156" r="4.5" fill={skinGradients.bodyStart} />
      </motion.g>
    </svg>
  );
};
