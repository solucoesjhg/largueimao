import { useState, useRef } from "react";
import { ArrowLeft, LogOut, Camera, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/BottomNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const { user: LUser, signOut: LSignOut } = useAuth();
  const LQueryClient = useQueryClient();
  const LFileInputRef = useRef<HTMLInputElement>(null);
  const [LEditing, setEditing] = useState(false);
  const [LDisplayName, setDisplayName] = useState("");
  const [LBio, setBio] = useState("");

  // 2. Extração de lógica pesada para um método focado usando verbos
  const pesquisarPerfil = async () => {
    if (!LUser) return null;
    const { data: LData } = await supabase
      .from("perfis")
      .select("*")
      .eq("usuari_pe", LUser.id)
      .single();
    return LData;
  };

  const { data: LProfile } = useQuery({
    queryKey: ["profile", LUser?.id],
    queryFn: pesquisarPerfil,
    enabled: !!LUser,
  });

  const iniciarEdicao = () => {
    setDisplayName(LProfile?.nome_pe || "");
    setBio(LProfile?.bio_pe || "");
    setEditing(true);
  };

  const salvarPerfil = useMutation({
    mutationFn: async () => {
      const { error: LError } = await supabase
        .from("perfis")
        .update({ nome_pe: LDisplayName.trim(), bio_pe: LBio.trim() })
        .eq("usuari_pe", LUser!.id);
      if (LError) throw LError;
    },
    onSuccess: () => {
      LQueryClient.invalidateQueries({ queryKey: ["profile", LUser?.id] });
      setEditing(false);
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const enviarAvatar = useMutation({
    mutationFn: async (AFile: File) => {
      const LExt = AFile.name.split(".").pop();
      const LPath = `${LUser!.id}/avatar.${LExt}`;

      const { error: LUploadError } = await supabase.storage
        .from("avatars")
        .upload(LPath, AFile, { upsert: true });
      if (LUploadError) throw LUploadError;

      const { data: LUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(LPath);

      const LAvatarUrl = `${LUrlData.publicUrl}?t=${Date.now()}`;
      const { error: LError } = await supabase
        .from("perfis")
        .update({ avatar_pe: LAvatarUrl })
        .eq("usuari_pe", LUser!.id);
      if (LError) throw LError;
    },
    onSuccess: () => {
      LQueryClient.invalidateQueries({ queryKey: ["profile", LUser?.id] });
      toast.success("Foto atualizada!");
    },
    onError: () => toast.error("Erro ao enviar foto"),
  });

  const lidarComSelecaoArquivo = (AEvent: React.ChangeEvent<HTMLInputElement>) => {
    const LFile = AEvent.target.files?.[0];
    if (LFile) enviarAvatar.mutate(LFile);
  };

  const sairDaConta = async () => {
    await LSignOut();
    LNavigate("/login");
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlTopo = (
    <header className="sticky top-0 z-40 flex items-center justify-center border-b border-border bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
      <h1 className="text-lg font-bold text-foreground">Perfil</h1>
    </header>
  );

  const pnlAvatar = (
    <div className="relative">
      <div className="h-24 w-24 overflow-hidden rounded-full bg-muted">
        {LProfile?.avatar_pe ? (
          <img src={LProfile.avatar_pe} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">👤</div>
        )}
      </div>
      <button
        onClick={() => LFileInputRef.current?.click()}
        disabled={enviarAvatar.isPending}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <Camera className="h-4 w-4" />
      </button>
      <input
        ref={LFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={lidarComSelecaoArquivo}
      />
    </div>
  );

  const pnlEdicao = (
    <div className="w-full max-w-xs space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Nome</label>
        <Input
          value={LDisplayName}
          onChange={(AEvent) => setDisplayName(AEvent.target.value)}
          className="rounded-xl"
          placeholder="Seu nome"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Bio</label>
        <Textarea
          value={LBio}
          onChange={(AEvent) => setBio(AEvent.target.value)}
          className="rounded-xl"
          placeholder="Conte um pouco sobre você..."
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-xl"
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
        <Button
          className="h-10 flex-1 rounded-xl"
          onClick={() => salvarPerfil.mutate()}
          disabled={salvarPerfil.isPending}
        >
          Salvar
        </Button>
      </div>
    </div>
  );

  const pnlExibicao = (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 text-center">
      <div>
        <p className="text-lg font-bold text-foreground">
          {LProfile?.nome_pe || "Gaúcho"}
        </p>
        <p className="text-sm text-muted-foreground">{LUser?.email}</p>
        {LProfile?.bio_pe ? (
          <p className="mt-3 text-sm text-muted-foreground">{LProfile.bio_pe}</p>
        ) : (
          <p className="mt-3 text-sm italic text-muted-foreground">Nenhuma biografia.</p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={iniciarEdicao}
        className="mt-2 h-10 w-full rounded-xl"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Editar Perfil
      </Button>
    </div>
  );

  const pnlAcoesExtra = (
    <Button
      variant="outline"
      onClick={sairDaConta}
      className="mt-8 h-12 w-full max-w-xs rounded-xl text-base"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sair da conta
    </Button>
  );

  const pnlRodape = <BottomNav />;

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="min-h-screen bg-background pb-20">
      {pnlTopo}

      <div className="flex flex-col items-center gap-4 p-8">
        {pnlAvatar}
        {LEditing ? pnlEdicao : pnlExibicao}
        {pnlAcoesExtra}
      </div>

      {pnlRodape}
    </div>
  );
};

export default Profile;
