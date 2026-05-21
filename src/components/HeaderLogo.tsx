import { Link } from "react-router-dom";
import { LargueiMaoIcon, LargueiMaoLogo } from "@/components/LargueiMaoLogo";

interface HeaderLogoProps {
  iconOnly?: boolean;
  size?: number;
  to?: string | null;
  className?: string;
}

export const HeaderLogo = ({
  iconOnly: AIconOnly = false,
  size: ASize = 32,
  to: ATo = "/",
  className: AClassName,
}: HeaderLogoProps) => {
  
  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlConteudo = AIconOnly ? (
    <LargueiMaoIcon size={ASize} className="text-brand" />
  ) : (
    <LargueiMaoLogo size={ASize} />
  );

  if (ATo === null) {
    return <span className={AClassName}>{pnlConteudo}</span>;
  }

  // 5. O return da tela fica extremamente simples e sem lógica
  return (
    <Link
      to={ATo}
      aria-label="Larguei Mão — início"
      className={`inline-flex items-center transition-opacity hover:opacity-80 ${AClassName ?? ""}`}
    >
      {pnlConteudo}
    </Link>
  );
};

export default HeaderLogo;
