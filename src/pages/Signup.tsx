import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { traduzirErroSupabase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { MailCheck, Loader2 } from "lucide-react";

const Signup = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const [LEmail, setEmail] = useState("");
  const [LPassword, setPassword] = useState("");
  const [LName, setName] = useState("");
  const [LLoading, setLoading] = useState(false);
  const [LIsVerifying, setIsVerifying] = useState(false);
  const { isOpen: LIsKeyboardOpen, keyboardHeight: LKeyboardHeight } = useKeyboardOpen();

  // Escuta quando o app volta para primeiro plano para tentar logar automaticamente
  useEffect(() => {
    if (!LIsVerifying) return;

    const tentarLogar = async () => {
      // Se não tá verificando ou perdeu os dados, ignora
      if (!LEmail || !LPassword) return;
      
      const { data: LData, error: LError } = await supabase.auth.signInWithPassword({
        email: LEmail,
        password: LPassword,
      });

      if (!LError && LData.session) {
        toast.success("Email verificado com sucesso! Bem-vindo(a)!");
        LNavigate("/");
      }
    };

    let LAppListener: any;
    
    if (Capacitor.isNativePlatform()) {
      LAppListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          tentarLogar();
        }
      });
    }

    // Listener para Web
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tentarLogar();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Também faz um polling leve a cada 10 segundos caso a pessoa confirme pelo PC mas o app fique aberto
    const LInterval = setInterval(tentarLogar, 10000);

    return () => {
      if (LAppListener) LAppListener.then((l: any) => l.remove());
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(LInterval);
    };
  }, [LIsVerifying, LEmail, LPassword, LNavigate]);

  // 2. Extração de lógica pesada para um método focado usando verbos
  const cadastrarUsuario = async (AEvent: React.FormEvent) => {
    AEvent.preventDefault();
    if (!LEmail.trim() || !LPassword.trim() || !LName.trim()) {
      toast.error("Opa, pera lá! Faltou preencher tudo, vivente.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(LEmail)) {
      toast.error("Bah, esse formato de email tá meio esquisito. Confere aí!");
      return;
    }
    
    if (LPassword.length < 6) {
      toast.error("Essa senha tá muito fraquinha, chê! Bota no mínimo 6 letras.");
      return;
    }
    setLoading(true);
    const { error: LError } = await supabase.auth.signUp({
      email: LEmail,
      password: LPassword,
      options: {
        data: { full_name: LName },
      },
    });
    setLoading(false);
    if (LError) {
      if (LError.message.toLowerCase().includes("rate limit") || LError.message.toLowerCase().includes("too many")) {
        toast.error("Acalma o facho! Tentou demais. Espera um minutinho e tenta de novo.");
      } else if (String(LError.message).includes("1001") || LError.message.toLowerCase().includes("canceled")) {
        console.log("Usuário cancelou o cadastro");
      } else {
        toast.error(traduzirErroSupabase(LError.message));
      }
    } else {
      setIsVerifying(true);
    }
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlLogo = (
    <div className={`flex flex-col items-center justify-center transition-all duration-300 ${LIsKeyboardOpen && !LIsVerifying ? 'h-[15vh] pt-2' : 'h-[35vh] pt-6'}`}>
      <div className={`flex flex-col items-center gap-3 transition-transform duration-300 ${LIsKeyboardOpen && !LIsVerifying ? 'scale-75' : 'scale-100'}`}>
        <img src="/logo_cuia_transparent.png" alt="Larguei Mão" className={`object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)] transition-all duration-300 ${LIsKeyboardOpen && !LIsVerifying ? 'h-16 w-16' : 'h-32 w-32'}`} />
        {(!LIsKeyboardOpen || LIsVerifying) && (
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-[#a8e6b3] drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] text-center px-4">
            {LIsVerifying ? "Quase lá!" : "Cria tua conta"}
          </h1>
        )}
      </div>
    </div>
  );

  const pnlFormulario = (
    <form onSubmit={cadastrarUsuario} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          placeholder="Teu nome"
          value={LName}
          onChange={(AEvent) => setName(AEvent.target.value)}
          className="h-12 rounded-xl bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={LEmail}
          onChange={(AEvent) => setEmail(AEvent.target.value)}
          className="h-12 rounded-xl bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={LPassword}
          onChange={(AEvent) => setPassword(AEvent.target.value)}
          className="h-12 rounded-xl bg-muted"
        />
      </div>

      <Button
        type="submit"
        variant="default"
        className="h-12 w-full rounded-xl text-base font-bold"
        disabled={LLoading}
      >
        {LLoading ? "CRIANDO..." : "CRIAR CONTA"}
      </Button>
    </form>
  );

  const pnlVerificacao = (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 bg-muted/30 rounded-3xl border border-border mt-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-10 w-10" />
        </div>
      </div>
      
      <div className="space-y-3 text-center">
        <h2 className="text-xl font-bold text-foreground">Verifique seu e-mail</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nós enviamos um link de confirmação para <strong className="text-foreground font-medium">{LEmail}</strong>.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Abra seu aplicativo de e-mail, clique no link para ativar sua conta e <strong>volte para cá</strong>. 
          O login será feito automaticamente!
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary bg-primary/10 px-4 py-2 rounded-full mt-4">
        <Loader2 className="h-3 w-3 animate-spin" />
        Aguardando verificação...
      </div>
    </div>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <>
      <div 
        className="relative flex min-h-screen flex-col items-center bg-background px-6 overflow-y-auto overflow-x-hidden transition-all duration-300" 
        style={{ paddingBottom: LIsKeyboardOpen && !LIsVerifying ? LKeyboardHeight + 20 : 32 }}
      >
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-[#3d5e44] to-[#253b2a] rounded-b-[3rem] z-0 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.3),_inset_0_2px_4px_rgba(255,255,255,0.1),_0_10px_25px_rgba(0,0,0,0.1)] border-b-[1.5px] border-[#4d7555]/60 pointer-events-none transition-all duration-300 ${LIsKeyboardOpen && !LIsVerifying ? 'h-[15vh]' : 'h-[35vh]'}`} />

        <div className="z-10 w-full max-w-sm flex flex-col space-y-6">
          {pnlLogo}
          
          <div className="space-y-6 mt-2">
            {LIsVerifying ? pnlVerificacao : pnlFormulario}

            {!LIsVerifying && (
              <p className="text-center text-sm text-muted-foreground pb-8">
                Já tem conta?{" "}
                <button 
                  type="button"
                  onClick={() => {
                    if (LName.trim() || LEmail.trim() || LPassword.trim()) {
                      if (window.confirm("Tu começou um cadastro.\nTem certeza que quer sair e perder o que já preencheu?")) {
                        LNavigate("/login");
                      }
                    } else {
                      LNavigate("/login");
                    }
                  }} 
                  className="font-medium text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Entrar
                </button>
              </p>
            )}
            
            {LIsVerifying && (
              <div className="text-center mt-6">
                <Button variant="ghost" onClick={() => setIsVerifying(false)} className="text-muted-foreground">
                  Usar outro e-mail
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {LLoading && (
        <div className="fixed inset-0 z-[9999] cursor-not-allowed bg-background/40 backdrop-blur-[2px] touch-none" />
      )}
    </>
  );
};

export default Signup;
