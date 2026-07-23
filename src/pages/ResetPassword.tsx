import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

const ResetPassword = () => {
  const LNavigate = useNavigate();
  const { keyboardHeight, isKeyboardOpen } = useKeyboardOpen();
  const [LPassword, setPassword] = useState("");
  const [LConfirmPassword, setConfirmPassword] = useState("");
  const [LLoading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão inválida ou expirada. Tente novamente.");
        LNavigate("/login");
      }
    };
    
    checkUser();
  }, [LNavigate]);

  const LHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (LPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (LPassword !== LConfirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: LPassword
      });
      
      if (error) throw error;

      toast.success("Senha atualizada com sucesso!");
      LNavigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-[100dvh] flex-col bg-background transition-all duration-300 overflow-y-auto"
      style={{ paddingBottom: isKeyboardOpen ? keyboardHeight + 20 : 0 }}
    >
      <main className={`flex flex-1 flex-col justify-center px-6 transition-all duration-300 ${isKeyboardOpen ? 'pt-4 pb-4' : 'pb-[calc(env(safe-area-inset-bottom)+2rem)]'}`}>
        {!isKeyboardOpen && (
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Criar Nova Senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite sua nova senha abaixo para recuperar o acesso à sua conta.
          </p>
        </div>

        <form onSubmit={LHandleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Nova Senha"
            value={LPassword}
            onChange={(e) => setPassword(e.target.value)}
            disabled={LLoading}
            className="h-14 rounded-2xl border-0 bg-muted px-4 text-base focus-visible:ring-1 focus-visible:ring-primary"
            required
            minLength={6}
          />
          
          <Input
            type="password"
            placeholder="Confirmar Nova Senha"
            value={LConfirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={LLoading}
            className="h-14 rounded-2xl border-0 bg-muted px-4 text-base focus-visible:ring-1 focus-visible:ring-primary"
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={LLoading || !LPassword || !LConfirmPassword}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-[#8fce9e]/50 font-bold text-[#253b2a] shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-xl transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:border-[#8fce9e]/30 dark:bg-background/80 dark:text-[#8fce9e] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] saturate-150"
          >
            {LLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "SALVAR NOVA SENHA"
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ResetPassword;
