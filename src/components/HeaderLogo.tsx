import { Link } from "react-router-dom";
import { LargueiMaoIcon, LargueiMaoLogo } from "@/components/LargueiMaoLogo";

interface HeaderLogoProps {
  /** Render only the icon (for compact spaces / app icon usage) */
  iconOnly?: boolean;
  /** Pixel size of the icon. The wordmark scales relative to this. */
  size?: number;
  /** Optional link target. Defaults to "/". Pass null to render without a link. */
  to?: string | null;
  className?: string;
}

/**
 * HeaderLogo — reusable brand lockup for the app header.
 * Wraps the canonical LargueiMaoLogo / LargueiMaoIcon so the same mark is
 * used everywhere (header, auth screens, app icon export, etc.).
 */
export const HeaderLogo = ({
  iconOnly = false,
  size = 32,
  to = "/",
  className,
}: HeaderLogoProps) => {
  const content = iconOnly ? (
    <LargueiMaoIcon size={size} className="text-brand" />
  ) : (
    <LargueiMaoLogo size={size} />
  );

  if (to === null) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link
      to={to}
      aria-label="Larguei Mão — início"
      className={`inline-flex items-center transition-opacity hover:opacity-80 ${className ?? ""}`}
    >
      {content}
    </Link>
  );
};

export default HeaderLogo;
