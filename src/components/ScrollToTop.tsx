import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname: LPathname } = useLocation();
  const LAction = useNavigationType();

  useEffect(() => {
    if (LAction === "POP") {
      return;
    }

    // Tenta rolar todos os containers possíveis imediatamente
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.body.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);

    // Fallback caso o React demore alguns milissegundos para renderizar a nova tela
    const LTimeout = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(LTimeout);
  }, [LPathname, LAction]);

  return null;
};

export default ScrollToTop;
