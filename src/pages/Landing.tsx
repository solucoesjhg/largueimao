import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Apple, Play } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();

  // Se por acaso abrirem a Landing Page de dentro do app nativo, redireciona.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#265939] text-white">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <img src="/logo_cuia_transparent.png" alt="Larguei Mão" className="h-10 w-10 drop-shadow-md" />
          <span className="font-nunito font-black text-2xl tracking-tight">Larguei Mão</span>
        </div>
        <nav className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-white hover:text-[#265939] hover:bg-white font-bold rounded-full">
              Entrar
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-[#8fce9e] text-[#253b2a] hover:bg-white font-bold rounded-full border-none shadow-[0_4px_14px_0_rgba(0,0,0,0.1)]">
              Criar Conta
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto py-12 lg:py-24">
        <div className="animate-fade-in [animation-delay:200ms] opacity-0 fill-mode-forwards">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-sm font-bold tracking-wider mb-6">
            O SEU APP DE DESAPEGO
          </span>
        </div>
        
        <h1 className="font-nunito text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight animate-fade-in [animation-delay:400ms] opacity-0 fill-mode-forwards drop-shadow-sm">
          O que não serve mais pra ti,<br className="hidden md:block" />
          <span className="text-[#a3d9b0]"> pode servir pra alguém.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-12 font-medium animate-fade-in [animation-delay:600ms] opacity-0 fill-mode-forwards">
          Conectamos quem quer doar com quem precisa. Desapegue daquilo que só ocupa espaço de forma simples, rápida e baseada na sua localização.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in [animation-delay:800ms] opacity-0 fill-mode-forwards">
          <a href="#" className="flex items-center justify-center gap-3 bg-black hover:bg-black/80 text-white rounded-2xl px-6 py-4 transition-transform active:scale-95 shadow-xl">
            <Apple className="h-8 w-8" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] leading-tight text-white/70">Baixar na</span>
              <span className="text-xl font-bold leading-tight">App Store</span>
            </div>
          </a>
          
          <a href="#" className="flex items-center justify-center gap-3 bg-black hover:bg-black/80 text-white rounded-2xl px-6 py-4 transition-transform active:scale-95 shadow-xl">
            <Play className="h-7 w-7 ml-1" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] leading-tight text-white/70">DISPONÍVEL NO</span>
              <span className="text-xl font-bold leading-tight">Google Play</span>
            </div>
          </a>
        </div>
        
        <div className="mt-16 relative w-full max-w-4xl animate-fade-in [animation-delay:1000ms] opacity-0 fill-mode-forwards">
          <div className="absolute inset-0 bg-gradient-to-t from-[#265939] via-transparent to-transparent z-10"></div>
          <img 
            src="/icon-512.png" 
            alt="App Preview" 
            className="w-48 h-48 mx-auto rounded-3xl shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-white/50 text-sm">
        <p>© {new Date().getFullYear()} Larguei Mão. Todos os direitos reservados.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
