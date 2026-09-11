import React from 'react';

interface DyserSubmarkProps {
  size?: number | string;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Logotipo oficial de Dyser:
 * Compuesto por el isotipo circular (anillo exterior azul marino profundo con corte superior
 * y letra 'd' naranja con panza concéntrica y asta ascendente curvada en aleta)
 * y el wordmark oficial 'Dyser' en tipografía institucional bold.
 */
export const DyserSubmark: React.FC<DyserSubmarkProps> = ({
  size = 200,
  className = '',
  showWordmark = true,
  wordmarkClassName = '',
}) => {
  // Determinamos el aspect ratio: si lleva wordmark el viewBox es más alto (400x470)
  const viewBox = showWordmark ? '0 0 400 470' : '0 0 400 370';
  const width = size;
  const height =
    typeof size === 'number'
      ? showWordmark
        ? Math.round(size * 1.175)
        : size
      : size;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      role="img"
      aria-label="Logotipo oficial de Dyser"
    >
      <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-102 drop-shadow-xs"
      >
        <defs>
          {/* Sombra sutil para dar relieve y nitidez gráfica */}
          <filter id="dyserGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#183375" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* 1. ANILLO EXTERIOR AZUL MARINO INSTITUCIONAL (#183375)         */}
        {/* Corte superior exacto dejando paso al asta de la 'd'           */}
        {/* Centro (200, 195), Radio = 146, Grosor = 36                   */}
        {/* ------------------------------------------------------------- */}
        <path
          d="
            M 305 92
            A 146 146 0 1 1 240 56
          "
          stroke="#183375"
          strokeWidth="36"
          strokeLinecap="butt"
          fill="none"
          className="dark:stroke-[#2b4c9e]"
        />

        {/* ------------------------------------------------------------- */}
        {/* 2. LETRA 'd' EN NARANJA CORPORATIVO (#fe6b00 / #f56209)       */}
        {/* Panza circular concéntrica en (200, 195), Radio = 76, Trazo = 38 */}
        {/* ------------------------------------------------------------- */}
        <circle
          cx="200"
          cy="195"
          r="76"
          stroke="#fe6b00"
          strokeWidth="38"
          fill="none"
        />

        {/* ------------------------------------------------------------- */}
        {/* 3. ASTA ASCENDENTE ESTILIZADA DE LA 'd'                       */}
        {/* Tangente al lado derecho exterior, asciende y culmina en la    */}
        {/* curva cóncava característica que se afina hacia arriba/derecha */}
        {/* ------------------------------------------------------------- */}
        <path
          d="
            M 257 195
            L 257 136
            C 257 78, 276 40, 295 18
            C 297 19, 298 22, 298 28
            L 298 195
            Z
          "
          fill="#fe6b00"
        />

        {/* ------------------------------------------------------------- */}
        {/* 4. WORDMARK OFICIAL 'Dyser'                                    */}
        {/* Tipografía sans-serif bold geométrica en azul marino          */}
        {/* ------------------------------------------------------------- */}
        {showWordmark && (
          <text
            x="200"
            y="435"
            textAnchor="middle"
            fill="#183375"
            className="dark:fill-white font-extrabold"
            style={{
              fontFamily:
                "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontSize: '84px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Dyser
          </text>
        )}
      </svg>
    </div>
  );
};

export default DyserSubmark;
