import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname: LPathname } = useLocation();

  useEffect(() => {
    // Tenta rolar todos os containers possíveis imediatamente
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.body.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);

    // Fallback caso o React demore alguns milissegundos para renderizar a nova tela
    const LTimeout = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(LTimeout);
  }, [LPathname]);

  return null;
};

export default ScrollToTop;
