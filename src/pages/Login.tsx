import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Fingerprint } from "lucide-react";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { SignInWithApple } from "@capacitor-community/apple-sign-in";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { Capacitor } from "@capacitor/core";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { traduzirErroSupabase } from "@/lib/utils";

const Login = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const [LEmail, setEmail] = useState("");
  const [LPassword, setPassword] = useState("");
  const [LLoading, setLoading] = useState(false);
  const [LHasBiometrics, setHasBiometrics] = useState(false);
  const [LIsNative, setIsNative] = useState(Capacitor.isNativePlatform());
  const { isOpen: LIsKeyboardOpen, keyboardHeight: LKeyboardHeight } = useKeyboardOpen();

  useEffect(() => {
    if (!LIsNative) return;
    const checkBiometrics = async () => {
      try {
        const result = await NativeBiometric.isAvailable();
        if (result.isAvailable) {
          const creds = await NativeBiometric.getCredentials({ server: 'largueimao' });
          if (creds && creds.username && creds.password) {
            setHasBiometrics(true);
          }
        }
      } catch (e) {
        console.log("Biometria não disponível ou sem credenciais");
      }
    };
    checkBiometrics();
  }, [LIsNative]);

  // 2. Extração de lógica pesada para um método focado usando verbos (autenticar)
  const autenticarUsuario = async (AEvent: React.FormEvent) => {
    AEvent.preventDefault();
    if (!LEmail.trim() || !LPassword.trim()) {
      toast.error("Opa, pera lá! Faltou preencher tudo, vivente.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(LEmail)) {
      toast.error("Bah, esse formato de email tá meio esquisito. Confere aí!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: LEmail,
      password: LPassword,
    });
    
    if (error) {
      if (error.message.toLowerCase().includes("invalid login")) {
        toast.error("Não achei ninguém com esses dados. Escreveu certo ou tá de caô?");
      } else if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("too many")) {
        toast.error("Acalma o facho! Tentou demais. Espera um minutinho e tenta de novo.");
      } else {
        toast.error(traduzirErroSupabase(error.message));
      }
      setLoading(false);
    } else {
      // Salva as credenciais para o próximo login, se a biometria estiver disponível
      if (LIsNative) {
        try {
          const result = await NativeBiometric.isAvailable();
          if (result.isAvailable) {
            await NativeBiometric.setCredentials({
              username: LEmail,
              password: LPassword,
              server: 'largueimao',
            });
          }
        } catch (e) {
          console.log("Erro ao salvar biometria", e);
        }
      }
      LNavigate("/");
    }
  };

  const autenticarComBiometria = async () => {
    try {
      // Força a verificação do Rosto/Dedo antes de pegar as senhas salvas
      await NativeBiometric.verifyIdentity({
        reason: "Entrar no Larguei Mão",
        title: "Acesso Rápido",
        subtitle: "Use sua biometria",
      });

      const creds = await NativeBiometric.getCredentials({ server: 'largueimao' });
      if (creds && creds.username && creds.password) {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
          email: creds.username,
          password: creds.password,
        });
        if (error) {
          toast.error("Erro na biometria: " + error.message);
        } else {
          LNavigate("/");
        }
      }
    } catch (e) {
      toast.error("Falha ao usar biometria ou operação cancelada");
    } finally {
      setLoading(false);
    }
  };

  const autenticarComGoogle = async () => {
    setLoading(true);
    try {
      if (LIsNative) {
        const result = await GoogleSignIn.signIn();
        if (result.idToken) {
          // Extrair o nonce do id_token (necessário pois o iOS injeta um nonce nativo)
          let extractedNonce;
          try {
            const base64Url = result.idToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              window.atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            extractedNonce = JSON.parse(jsonPayload).nonce;
          } catch (e) {
            console.warn("Não foi possível extrair o nonce do token", e);
          }

          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: result.idToken,
            nonce: extractedNonce
          });
          if (!error) LNavigate("/");
          else throw error;
        }
      } else {
        // Fallback for Web
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro Google: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const autenticarComApple = async () => {
    setLoading(true);
    try {
      if (LIsNative) {
        const { response } = await SignInWithApple.authorize({
          clientId: 'com.solucoesjhg.largueimao',
          redirectURI: window.location.origin,
          scopes: 'email name'
        });
        if (response.identityToken) {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: response.identityToken
          });
          if (!error) LNavigate("/");
          else throw error;
        }
      } else {
        // Fallback for Web
        const { error } = await supabase.auth.signInWithOAuth({ provider: "apple" });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      const LErrorMessage = error?.message || JSON.stringify(error) || "";
      if (LErrorMessage.includes("1001") || LErrorMessage.toLowerCase().includes("canceled")) {
        console.log("Usuário cancelou o login com a Apple");
      } else {
        toast.error(`Erro Apple: ${LErrorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlLogo = (
    <div className={`flex flex-col items-center justify-center transition-all duration-300 ${LIsKeyboardOpen ? 'h-[15vh] pt-2' : 'h-[35vh] pt-6'}`}>
      <div className={`flex flex-col items-center gap-3 transition-transform duration-300 ${LIsKeyboardOpen ? 'scale-75' : 'scale-100'}`}>
        {/* Imagem do ícone com leve sombra */}
        <img src="/logo_cuia_transparent.png" alt="Larguei Mão" className={`object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)] transition-all duration-300 ${LIsKeyboardOpen ? 'h-16 w-16' : 'h-32 w-32'}`} />
        {!LIsKeyboardOpen && (
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-[#a8e6b3] drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
            Larguei Mão
          </h1>
        )}
      </div>
    </div>
  );

  const pnlFormulario = (
    <form onSubmit={autenticarUsuario} className="space-y-6" noValidate>
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
          placeholder="••••••••"
          value={LPassword}
          onChange={(AEvent) => setPassword(AEvent.target.value)}
          className="h-12 rounded-xl bg-muted"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="default"
          className="h-12 flex-1 rounded-xl text-base font-bold"
          disabled={LLoading}
        >
          {LLoading ? "ENTRANDO..." : "ENTRAR"}
        </Button>

        {LHasBiometrics && (
          <Button
            type="button"
            variant="outline"
            className="h-12 w-12 shrink-0 rounded-xl"
            onClick={autenticarComBiometria}
            disabled={LLoading}
          >
            <Fingerprint className="h-6 w-6" />
          </Button>
        )}
      </div>
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
      disabled={LLoading}
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
      disabled={LLoading}
    >
      <svg className="mr-2 h-5 w-5" viewBox="0 0 384 512" fill="currentColor">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
      </svg>
      Entrar com Apple
    </Button>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <>
      <div 
        className="relative flex min-h-screen flex-col items-center bg-background px-6 overflow-y-auto overflow-x-hidden transition-all duration-300" 
        style={{ paddingBottom: LIsKeyboardOpen ? LKeyboardHeight + 20 : 32 }}
      >
        {/* Detalhe curvo no topo simulando o efeito 3D (gradient, inner shadow e borda iluminada) */}
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-[#3d5e44] to-[#253b2a] rounded-b-[3rem] z-0 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.3),_inset_0_2px_4px_rgba(255,255,255,0.1),_0_10px_25px_rgba(0,0,0,0.1)] border-b-[1.5px] border-[#4d7555]/60 pointer-events-none transition-all duration-300 ${LIsKeyboardOpen ? 'h-[15vh]' : 'h-[35vh]'}`} />

        <div className="z-10 w-full max-w-sm flex flex-col space-y-6">
          {pnlLogo}
          
          <div className="space-y-6 mt-2">
            {pnlFormulario}
            {pnlDivisor}
            <div className="space-y-3">
              {btnGoogle}
              {Capacitor.getPlatform() === 'ios' && btnApple}
            </div>
            <div className="text-center pb-8">
              <Link to="/signup">
                <Button variant="ghost" className="text-sm text-muted-foreground">
                  Criar conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {LLoading && (
        <div className="fixed inset-0 z-[9999] cursor-not-allowed bg-background/40 backdrop-blur-[2px] touch-none" />
      )}
    </>
  );
};

export default Login;
