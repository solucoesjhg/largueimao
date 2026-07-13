import { useState, useRef } from "react";
import { LogOut, Camera, Pencil, Save, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import ItemCard from "@/components/ItemCard";
import PullToRefresh from "@/components/PullToRefresh";

const Profile = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const { user: LUser, signOut: LSignOut } = useAuth();
  const LQueryClient = useQueryClient();
  const LFileInputRef = useRef<HTMLInputElement>(null);
  const [LEditing, setEditing] = useState(false);
  const [LDisplayName, setDisplayName] = useState("");
  const [LBio, setBio] = useState("");
  const [LIsSigningOut, setIsSigningOut] = useState(false);

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
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const pesquisarMeusItens = async () => {
    if (!LUser) return [];
    const { data: LData, error: LError } = await supabase
      .from("itens")
      .select("*")
      .eq("usuari_it", LUser.id)
      .order("criado_it", { ascending: false })
      .limit(30);
    if (LError) throw LError;
    return LData;
  };

  const { data: LItems = [], isLoading: LIsLoadingItems, refetch: LRefetchItems } = useQuery({
    queryKey: ["my-items", LUser?.id],
    queryFn: pesquisarMeusItens,
    enabled: !!LUser,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const excluirItem = async (AItemId: string) => {
    if (!window.confirm("Opa, vivente!\n\nTens certeza que queres apagar esse anúncio de vez?\n\nNão tem volta, hein!")) return;
    
    // Apaga todas as conversas relacionadas ao item para inativar os chats
    await supabase.from("conversas").delete().eq("item_co", AItemId);

    const { error: LError } = await supabase.from("itens").delete().eq("id_it", AItemId);
    if (LError) {
      toast.error("Erro ao remover item.");
    } else {
      toast.success("Item removido!");
      LRefetchItems();
    }
  };

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
      window.dispatchEvent(new Event('profileSaved'));
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const enviarAvatar = useMutation({
    mutationFn: async (AFile: File) => {
      const LFormData = new FormData();
      LFormData.append("file", AFile);
      LFormData.append("bucket", "avatars");

      const { data: LResult, error: LFunctionError } = await supabase.functions.invoke(
        "moderate-upload", 
        {
          body: LFormData,
        }
      );

      if (LFunctionError || !LResult?.success) {
        throw new Error(LFunctionError?.message || LResult?.error || "Imagem rejeitada");
      }

      const LAvatarUrl = `${LResult.url}?t=${Date.now()}`;
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

  const redimensionarImagem = (file: File, maxWidth = 800): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          }, "image/jpeg", 0.7);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const lidarComSelecaoArquivo = async (AEvent: React.ChangeEvent<HTMLInputElement>) => {
    const LFile = AEvent.target.files?.[0];
    if (LFile) {
      toast.info("Processando foto...");
      const LResized = await redimensionarImagem(LFile);
      enviarAvatar.mutate(LResized);
    }
  };

  const sairDaConta = async () => {
    setIsSigningOut(true);
    try {
      await LSignOut();
      LNavigate("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlTopo = (
    <header className="sticky top-0 z-40 bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="w-10"></div>
        <h1 className="text-lg font-bold text-foreground">Perfil</h1>
        <button
          onClick={sairDaConta}
          disabled={LIsSigningOut}
          className="flex h-10 w-10 items-center justify-center rounded-full text-destructive active:bg-destructive/10 transition-colors"
          aria-label="Sair da conta"
        >
          {LIsSigningOut ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );

  const pnlAvatar = (
    <div className="relative">
      <div className="h-24 w-24 overflow-hidden rounded-full bg-muted border-4 border-background shadow-md">
        {LProfile?.avatar_pe ? (
          <img src={LProfile.avatar_pe} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl bg-gradient-to-br from-[#a8e6b3] to-[#4d7555] text-white font-bold">
            {LProfile?.nome_pe ? LProfile.nome_pe[0].toUpperCase() : "👤"}
          </div>
        )}
      </div>
      <button
        onClick={() => LFileInputRef.current?.click()}
        disabled={enviarAvatar.isPending}
        className="absolute bottom-0 right-0 h-10 w-10 rounded-full btn-glass-neon"
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
          className="rounded-xl h-12"
          placeholder="Seu nome"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Bio</label>
        <Textarea
          value={LBio}
          onChange={(AEvent) => setBio(AEvent.target.value)}
          className="rounded-xl resize-none"
          placeholder="Conte um pouco sobre você..."
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-xl"
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
        <Button
          className="h-12 flex-1 rounded-xl bg-[#4d7555] hover:bg-[#3d5e44] text-white"
          onClick={() => salvarPerfil.mutate()}
          disabled={salvarPerfil.isPending}
        >
          Salvar
        </Button>
      </div>
    </div>
  );

  const pnlExibicao = (
    <div className="flex w-full max-w-xs flex-col items-center gap-2 text-center">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {LProfile?.nome_pe || "Gaúcho"}
        </h2>
        <p className="text-sm text-muted-foreground">{LUser?.email}</p>
        {LProfile?.bio_pe ? (
          <p className="mt-4 text-sm text-foreground/80 leading-relaxed px-4">{LProfile.bio_pe}</p>
        ) : (
          <p className="mt-4 text-sm italic text-muted-foreground/60">Nenhuma biografia adicionada.</p>
        )}
      </div>
      <button
        onClick={iniciarEdicao}
        className="mt-4 h-12 px-6 rounded-full font-bold btn-glass-neon"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Editar Perfil
      </button>
    </div>
  );

  const pnlLoadingItems = (
    <div className="flex flex-row flex-wrap gap-2 w-full mt-4 px-4 pb-4">
      {[...Array(2)].map((_, AIndex) => (
        <div key={AIndex} className="w-[calc((100%-0.5rem)/2)] aspect-[3/4] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );

  const pnlVazioItems = (
    <div className="flex flex-col items-center gap-2 py-8 text-center mt-4 w-full">
      <span className="text-4xl">📭</span>
      <p className="text-muted-foreground">Tu ainda não largou nada.</p>
      <Link to="/post-item">
        <Button variant="outline" className="mt-2 rounded-xl">Largar primeiro item</Button>
      </Link>
    </div>
  );

  const grdItens = (
    <div className="flex flex-row flex-wrap gap-2 w-full mt-4 px-4 pb-4">
      {LItems.map((AItem) => (
        <div key={AItem.id_it} className="relative w-[calc((100%-0.5rem)/2)]">
          <ItemCard
            id={AItem.id_it}
            title={AItem.titulo_it}
            price={AItem.preco_it}
            location={AItem.local_it}
            latitude={AItem.latitu_it}
            longitude={AItem.longit_it}
            imageUrl={AItem.imagem_it}
            images={(AItem as { fotos_it?: string[] | null }).fotos_it ?? null}
            views={AItem.visualizacoes || 0}
            onClick={() => LNavigate(`/item/${AItem.id_it}`, { state: { initialItem: AItem } })}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              excluirItem(AItem.id_it);
            }}
            className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 text-destructive backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      {pnlTopo}

      <div className="flex-1 overflow-y-auto">
        <PullToRefresh onRefresh={async () => {
          await Promise.all([
            LQueryClient.invalidateQueries({ queryKey: ["profile", LUser?.id] }),
            LRefetchItems()
          ]);
        }}>
          <div className="flex flex-col items-center pt-8 pb-32">
            {pnlAvatar}
            <div className="mt-4 mb-4 w-full flex justify-center">
              {LEditing ? pnlEdicao : pnlExibicao}
            </div>
            
            {!LEditing && (
              <div className="w-full mt-4">
                <div className="px-4 mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">Meus Itens Largados</h3>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {LIsLoadingItems ? pnlLoadingItems : LItems.length === 0 ? pnlVazioItems : grdItens}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
