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
    className={className}
  >
    {/* Cuia: continuous U-shape */}
    <path
      d="M14 26 L14 40 Q14 56 32 56 Q50 56 50 40 L50 26"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />
    {/* Bomba: diagonal straw */}
    <path
      d="M40 26 L46 10"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/**
 * Larguei Mão — Horizontal lockup (icon + wordmark)
 */
export const LargueiMaoLogo = ({ size = 64, className }: LogoProps) => (
  <div className={`inline-flex items-center gap-3 text-brand ${className ?? ""}`}>
    <LargueiMaoIcon size={size} />
    <span
      className="font-black tracking-tight leading-none"
      style={{ fontSize: size * 0.55 }}
    >
      Larguei Mão
    </span>
  </div>
);

export default LargueiMaoLogo;
