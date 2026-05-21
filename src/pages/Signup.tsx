import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import HeaderLogo from "@/components/HeaderLogo";

const Signup = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const [LEmail, setEmail] = useState("");
  const [LPassword, setPassword] = useState("");
  const [LName, setName] = useState("");
  const [LLoading, setLoading] = useState(false);

  // 2. Extração de lógica pesada para um método focado usando verbos
  const cadastrarUsuario = async (AEvent: React.FormEvent) => {
    AEvent.preventDefault();
    if (!LEmail.trim() || !LPassword.trim() || !LName.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (LPassword.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error: LError } = await supabase.auth.signUp({
      email: LEmail,
      password: LPassword,
      options: {
        data: { full_name: LName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (LError) {
      if (LError.message.toLowerCase().includes("rate limit") || LError.message.toLowerCase().includes("too many")) {
        toast.error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else {
        toast.error(LError.message);
      }
    } else {
      toast.success("Conta criada! Verifique seu email para confirmar.");
      LNavigate("/login");
    }
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlLogo = (
    <div className="flex justify-center">
      <HeaderLogo size={36} to={null} />
    </div>
  );

  const pnlFormulario = (
    <form onSubmit={cadastrarUsuario} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          placeholder="Teu nome"
          value={LName}
          onChange={(AEvent) => setName(AEvent.target.value)}
          className="h-12 rounded-xl bg-muted"
          required
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
          required
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
          required
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

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        {pnlLogo}
        
        <h1 className="text-center text-2xl font-bold text-foreground">
          Cria tua conta, tchê!
        </h1>

        {pnlFormulario}

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
