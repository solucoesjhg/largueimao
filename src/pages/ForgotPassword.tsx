import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

const ForgotPassword = () => {
  const LNavigate = useNavigate();
  const { keyboardHeight, isOpen: isKeyboardOpen } = useKeyboardOpen();
  const [LEmail, setEmail] = useState("");
  const [LLoading, setLoading] = useState(false);
  const [LSuccess, setSuccess] = useState(false);

  const LHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!LEmail || !LEmail.includes("@")) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    setLoading(true);
    
    try {
      // Importante: Fixamos o redirecionamento para o domínio real (com HTTPS)
      // porque em ambientes mobile (Capacitor) o window.location.origin pode ser
      // 'capacitor://localhost', que os aplicativos de e-mail não reconhecem como link clicável.
      const { error } = await supabase.auth.resetPasswordForEmail(LEmail, {
        redirectTo: `https://xn--largueimo-s2a.app.br/reset-password`,
      });
      
      if (error) {
        throw error;
      }

      setSuccess(true);
      toast.success("E-mail de recuperação enviado com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-[100dvh] flex-col bg-background transition-all duration-300 overflow-y-auto"
    >
      <header className="flex h-14 items-center px-4 pt-[env(safe-area-inset-top)] flex-shrink-0">
        <button
          type="button"
          onClick={() => LNavigate("/login")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <main 
        className={`flex flex-1 flex-col justify-center px-6 transition-all duration-300 ${isKeyboardOpen ? 'pb-4' : 'pb-[calc(env(safe-area-inset-bottom)+2rem)]'}`}
        style={{ paddingBottom: isKeyboardOpen ? keyboardHeight + 20 : 0 }}
      >
        {!isKeyboardOpen && (
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-10 w-10 text-primary" />
            </div>
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Esqueceu a senha?
          </h1>
          <p className="text-sm text-muted-foreground">
            {LSuccess 
              ? "Enviamos um link mágico para o seu e-mail. Clique nele para redefinir sua senha." 
              : "Digite seu e-mail abaixo e enviaremos instruções para você redefinir sua senha."}
          </p>
        </div>

        {!LSuccess ? (
          <form onSubmit={LHandleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="seu@email.com"
              value={LEmail}
              onChange={(e) => setEmail(e.target.value)}
              disabled={LLoading}
              className="h-14 rounded-2xl border-0 bg-muted px-4 text-base focus-visible:ring-1 focus-visible:ring-primary"
              required
            />

            <button
              type="submit"
              disabled={LLoading || !LEmail}
              className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-[#8fce9e]/50 font-bold text-[#253b2a] shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-xl transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:border-[#8fce9e]/30 dark:bg-background/80 dark:text-[#8fce9e] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] saturate-150"
            >
              {LLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "ENVIAR LINK"
              )}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => LNavigate("/login")}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-muted font-bold text-foreground transition-transform active:scale-[0.98]"
          >
            VOLTAR PARA O LOGIN
          </button>
        )}
      </main>
    </div>
  );
};

export default ForgotPassword;
