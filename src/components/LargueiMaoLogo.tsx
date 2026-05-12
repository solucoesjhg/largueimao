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
  <div 
    style={{ width: size, height: size, minWidth: size }} 
    className={`relative shrink-0 overflow-hidden rounded-[22.5%] shadow-md border border-black/10 dark:border-white/10 ${className ?? ""}`}
  >
    <img 
      src="/icon-512.png?v=3" 
      alt="Larguei Mão Icon" 
      className="absolute inset-0 w-full h-full object-cover"
    />
  </div>
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
