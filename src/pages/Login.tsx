import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import gauchoMascot from "@/assets/gaucho-mascot.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Email ou senha inválidos.");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <img src={gauchoMascot} alt="Larguei Mão" className="h-16 w-16" />
          <span className="font-display text-lg font-bold text-primary">LARGUEI MÃO</span>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold text-foreground">
          Bora largar mão disso?
        </h1>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-muted"
              required
            />
          </div>

          <Button
            type="submit"
            variant="default"
            className="h-12 w-full rounded-xl text-base font-bold"
            disabled={loading}
          >
            {loading ? "ENTRANDO..." : "ENTRAR"}
          </Button>
        </form>

        {/* Secondary */}
        <div className="text-center">
          <Link to="/signup">
            <Button variant="outline" className="h-12 w-full rounded-xl text-base font-medium">
              Criar conta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
