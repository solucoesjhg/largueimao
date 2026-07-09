import { Loader2 } from "lucide-react";

const SplashScreen = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary text-primary-foreground">
      
      {/* Título */}
      <h1 className="mb-6 font-[Nunito] text-5xl font-black text-white drop-shadow-md">
        Larguei Mão
      </h1>
      
      {/* Cuia */}
      <div className="mb-12">
        <img 
          src="/logo_cuia_transparent.png" 
          alt="Logo Larguei Mão" 
          className="h-40 w-40 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
        />
      </div>

      {/* Indicador de Carregamento */}
      <div className="mb-6 flex flex-col items-center gap-3 text-white/80">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="font-[Nunito] text-sm font-bold tracking-widest uppercase">
          Carregando...
        </span>
      </div>

      {/* Frase de efeito */}
      <p className="mt-4 text-center font-[Nunito] text-sm font-black tracking-wider text-white/90 px-8 leading-relaxed drop-shadow-sm">
        O QUE NÃO SERVE MAIS PRA TI<br />PODE SERVIR PRA ALGUÉM.
      </p>
      
    </div>
  );
};

export default SplashScreen;
