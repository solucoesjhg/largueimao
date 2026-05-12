interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Larguei Mão — Icon (cuia + bomba)
 * Minimal, geometric stroke-based mark. Uses currentColor so it inherits
 * the brand color via Tailwind text classes (e.g. text-brand).
 */
export const LargueiMaoIcon = ({ size = 64, className }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Larguei Mão icon"
    className={`shrink-0 ${className ?? ""}`}
  >
    <defs>
      {/* Máscara que corta a bomba exatamente na superfície da erva (Y=28) */}
      <clipPath id="bomba-clip">
        <rect x="0" y="0" width="64" height="28.5" />
      </clipPath>
    </defs>

    {/* 1. Corpo da Cuia (Porongo) */}
    <path
      d="M 12 28
         C 20 30, 24 38, 24 44
         C 14 52, 14 60, 24 62
         L 40 62
         C 50 60, 50 52, 40 44
         C 40 38, 44 30, 52 28 Z"
      fill="#6B1F1F"
    />

    {/* Sombra 2D na esquerda (Cel-shading) */}
    <path
      d="M 12 28
         C 20 30, 24 38, 24 44
         C 14 52, 14 60, 24 62
         L 30 62
         C 20 60, 20 52, 30 44
         C 30 38, 26 30, 18 28 Z"
      fill="#4A1515"
    />

    {/* Brilho 2D na direita (Cel-shading) */}
    <path
      d="M 48 28
         C 40 30, 36 38, 36 44
         C 46 52, 46 60, 36 62
         L 40 62
         C 50 60, 50 52, 40 44
         C 40 38, 44 30, 52 28 Z"
      fill="#8B2A2A"
    />

    {/* 2. Erva (Fica 100% contida dentro do bocal da cuia, sem sair pra cima) */}
    {/* Fundo da erva (sombra) alinhado ao Verde Mate principal */}
    <ellipse cx="32" cy="28" rx="20" ry="5" fill="#1B3626" />
    {/* Topo da erva (brilho plano) */}
    <ellipse cx="32" cy="27.5" rx="19" ry="4" fill="#2E5640" />

    {/* 3. Borda do Bocal (Rim de madeira) - Contorna a erva, mas fica atrás da bomba */}
    <path
      d="M 12 28 C 12 31, 21 33, 32 33 C 43 33, 52 31, 52 28 C 52 25, 43 23, 32 23 C 21 23, 12 25, 12 28 Z"
      stroke="#3A1010"
      strokeWidth="3"
      fill="none"
    />

    {/* 4. Bomba (Canudo de Metal) - Cortada pela máscara para afundar na erva */}
    <g clipPath="url(#bomba-clip)">
      <line x1="36" y1="32" x2="52" y2="8" stroke="#78909C" strokeWidth="6" strokeLinecap="round" />
      <line x1="35" y1="31" x2="51" y2="7" stroke="#CFD8DC" strokeWidth="2" strokeLinecap="round" />

      {/* Anel da Bomba */}
      <circle cx="45" cy="18.5" r="4.5" fill="#455A64" />
      <circle cx="44.5" cy="18" r="3" fill="#B0BEC5" />
      <circle cx="43.5" cy="17" r="1" fill="#FFFFFF" />
    </g>
  </svg>
);

/**
 * Larguei Mão — Horizontal lockup (icon + wordmark)
 */
export const LargueiMaoLogo = ({ size = 64, className }: LogoProps) => (
  <div className={`inline-flex items-center gap-3 text-brand ${className ?? ""}`}>
    <LargueiMaoIcon size={size} />
    <span
      className="font-black tracking-tight leading-none relative"
      style={{
        fontSize: size * 0.55,
        top: size * 0.25, // Alinhamento ótico vertical
        left: -15           // Alinhamento ótico horizontal (mude de 0 para size * 0.1, etc)
      }}
    >
      Larguei Mão
    </span>
  </div>
);

export default LargueiMaoLogo;
