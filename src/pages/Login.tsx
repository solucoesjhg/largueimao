import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import HeaderLogo from "@/components/HeaderLogo";

const Login = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const [LEmail, setEmail] = useState("");
  const [LPassword, setPassword] = useState("");
  const [LLoading, setLoading] = useState(false);

  // 2. Extração de lógica pesada para um método focado usando verbos (autenticar)
  const autenticarUsuario = async (AEvent: React.FormEvent) => {
    AEvent.preventDefault();
    if (!LEmail.trim() || !LPassword.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    const { error: LError } = await supabase.auth.signInWithPassword({ email: LEmail, password: LPassword });
    setLoading(false);
    if (LError) {
      if (LError.message === "Email not confirmed") {
        toast.error("Confirme seu email antes de entrar. Verifique sua caixa de entrada.");
      } else if (LError.message === "Invalid login credentials") {
        toast.error("Email ou senha inválidos.");
      } else if (LError.message.includes("disabled")) {
        toast.error("Login por email está desativado. Entre com o Google ou contate o suporte.");
      } else if (LError.message.toLowerCase().includes("rate limit") || LError.message.toLowerCase().includes("too many")) {
        toast.error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else if (LError.message.toLowerCase().includes("load failed") || LError.message.toLowerCase().includes("failed to fetch")) {
        toast.error("Sem conexão de internet. Verifique sua rede e tente novamente.");
      } else {
        toast.error(`Erro: ${LError.message}`);
      }
    } else {
      LNavigate("/");
    }
  };

  const autenticarComGoogle = async () => {
    const LResult = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (LResult.error) {
      toast.error("Erro ao entrar com Google.");
    }
  };

  const autenticarComApple = async () => {
    const LResult = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (LResult.error) {
      toast.error("Erro ao entrar com Apple.");
    }
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlLogo = (
    <div className="flex justify-center pb-4">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo_cuia.png" alt="Larguei Mão" className="h-32 w-32 rounded-3xl shadow-xl border border-border/50" />
        <h1 className="text-2xl font-bold text-foreground">Larguei Mão</h1>
      </div>
    </div>
  );

  const pnlFormulario = (
    <form onSubmit={autenticarUsuario} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={LEmail}
          onChange={(AEvent) => setEmail(AEvent.target.value)}
          className="h-12 rounded-xl bg-muted"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={LPassword}
          onChange={(AEvent) => setPassword(AEvent.target.value)}
          className="h-12 rounded-xl bg-muted"
          required
        />
      </div>

      <Button
        type="submit"
        variant="default"
        className="h-12 w-full rounded-xl text-base font-bold"
        disabled={LLoading}
      >
        {LLoading ? "ENTRANDO..." : "ENTRAR"}
      </Button>
    </form>
  );

  const pnlDivisor = (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">ou</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );

  const btnGoogle = (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full rounded-xl text-base font-medium"
      onClick={autenticarComGoogle}
    >
      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Entrar com Google
    </Button>
  );

  const btnApple = (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full rounded-xl text-base font-medium bg-black text-white hover:bg-black/80 hover:text-white border-0"
      onClick={autenticarComApple}
    >
      <svg className="mr-2 h-5 w-5" viewBox="0 0 384 512" fill="currentColor">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
      </svg>
      Entrar com Apple
    </Button>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        {pnlLogo}
        <h1 className="text-center text-2xl font-bold text-foreground"></h1>
        {pnlFormulario}
        {pnlDivisor}
        <div className="space-y-3">
          {btnGoogle}
          {btnApple}
        </div>
        <div className="text-center">
          <Link to="/signup">
            <Button variant="ghost" className="text-sm text-muted-foreground">
              Criar conta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
