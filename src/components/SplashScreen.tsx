import { Bike, Armchair, Leaf, Package, Radio, Book, Guitar, Loader2 } from "lucide-react";

const SplashScreen = () => {
  // Define os ícones que vão ficar girando/flutuando em volta
  const LIcons = [
    { Icon: Bike, angle: 0 },
    { Icon: Armchair, angle: 51 },
    { Icon: Leaf, angle: 102 },
    { Icon: Package, angle: 154 },
    { Icon: Radio, angle: 205 },
    { Icon: Book, angle: 257 },
    { Icon: Guitar, angle: 308 },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-primary text-primary-foreground overflow-hidden">
      
      {/* Círculo decorativo de fundo com os ícones */}
      <div className="absolute left-1/2 top-1/2 w-[340px] h-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 animate-[spin_60s_linear_infinite]">
        {LIcons.map((item, index) => {
          // Calcula a posição do ícone na borda do círculo (raio de 170px)
          const radius = 170;
          const x = Math.cos((item.angle * Math.PI) / 180) * radius;
          const y = Math.sin((item.angle * Math.PI) / 180) * radius;
          
          return (
            <div
              key={index}
              className="absolute text-white/30"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%) rotate(-${item.angle}deg)`, // Mantém o ícone em pé contra a rotação
              }}
            >
              <item.Icon strokeWidth={1.5} size={32} />
            </div>
          );
        })}
      </div>

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-white shadow-black/20 text-shadow-sm">
          Larguei Mão
        </h1>
        
        {/* Nova Cuia centralizada, agora 100% transparente e sem caixas em volta */}
        <div className="relative mb-5">
          <img 
            src="/logo_cuia_transparent.png" 
            alt="Logo Larguei Mão" 
            className="h-32 w-32 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]"
          />
        </div>

        <p className="mt-8 text-center text-xs font-semibold tracking-[0.15em] text-white/90 px-8 leading-relaxed">
          O QUE NÃO SERVE MAIS PRA TI<br />PODE SERVIR PRA ALGUÉM.
        </p>
      </div>

      {/* Indicador de Carregamento no Rodapé */}
      <div className="absolute bottom-12 flex flex-col items-center gap-3 text-white/60">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-xs font-semibold tracking-widest uppercase">
          Carregando...
        </span>
      </div>
      
    </div>
  );
};

export default SplashScreen;
