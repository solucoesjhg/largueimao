import { useState, useRef, useEffect } from "react";
import { LogOut, Camera, Pencil, Save, Trash2, MoreVertical, History, Ban, Unlock, ChevronRight } from "lucide-react";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  const [LIsOptionsOpen, setIsOptionsOpen] = useState(false);
  const [LIsBlockedOpen, setIsBlockedOpen] = useState(false);
  const [LIsHistoryOpen, setIsHistoryOpen] = useState(false);

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

  useEffect(() => {
    if (LProfile) {
      const nome = LProfile.nome_pe || "";
      if (!nome || nome.includes("privaterelay.appleid.com") || nome.includes("appleid.com")) {
        setDisplayName("");
        setBio(LProfile.bio_pe || "");
        setEditing(true);
      }
    }
  }, [LProfile]);

  const pesquisarMeusItens = async () => {
    if (!LUser) return [];
    const { data: LData, error: LError } = await supabase
      .from("itens")
      .select("*")
      .eq("usuari_it", LUser.id)
      .in("status_it", ["active", "reserved"])
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
      LRefetchHistory();
    }
  };

  const pesquisarBloqueados = async () => {
    if (!LUser) return [];
    
    // 1. Fetch blocks
    const { data: blocks, error: blockErr } = await supabase
      .from("bloqueios")
      .select("id, bloqueado_id")
      .eq("bloqueador_id", LUser.id);
      
    if (blockErr) throw blockErr;
    if (!blocks || blocks.length === 0) return [];
    
    // 2. Fetch profiles for those blocked users
    const blockedIds = blocks.map(b => b.bloqueado_id);
    const { data: profiles, error: profErr } = await supabase
      .from("perfis")
      .select("usuari_pe, nome_pe, avatar_pe")
      .in("usuari_pe", blockedIds);
      
    if (profErr) throw profErr;
    
    // 3. Map them together
    return blocks.map(b => {
      const p = profiles.find(p => p.usuari_pe === b.bloqueado_id);
      return {
        id: b.id,
        perfis: {
          nome_pe: p?.nome_pe || "Usuário",
          avatar_pe: p?.avatar_pe
        }
      };
    });
  };

  const { data: LBlockedUsers = [], refetch: LRefetchBlocked } = useQuery({
    queryKey: ["blocked-users", LUser?.id],
    queryFn: pesquisarBloqueados,
    enabled: !!LUser && LIsBlockedOpen,
  });

  const desbloquearUsuario = useMutation({
    mutationFn: async (id_bl: string) => {
      const { error } = await supabase.from("bloqueios").delete().eq("id", id_bl);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuário desbloqueado!");
      LRefetchBlocked();
    }
  });

  const pesquisarHistorico = async () => {
    if (!LUser) return [];
    const { data, error } = await supabase
      .from("itens")
      .select("*")
      .eq("usuari_it", LUser.id)
      .eq("status_it", "sold")
      .order("criado_it", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data: LHistoryItems = [], isLoading: LIsLoadingHistory, refetch: LRefetchHistory } = useQuery({
    queryKey: ["history-items", LUser?.id],
    queryFn: pesquisarHistorico,
    enabled: !!LUser && LIsHistoryOpen,
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

  const lidarComSelecaoArquivo = async () => {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Foto de Perfil',
        promptLabelCancel: 'Cancelar',
        promptLabelPhoto: 'Escolher da Galeria',
        promptLabelPicture: 'Tirar Foto'
      });

      if (image.webPath) {
        toast.info("Processando foto...");
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], "avatar.jpeg", { type: "image/jpeg" });
        const LResized = await redimensionarImagem(file);
        enviarAvatar.mutate(LResized);
      }
    } catch (e) {
      console.log('Camera cancelled', e);
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
        onClick={lidarComSelecaoArquivo}
        disabled={enviarAvatar.isPending}
        className="absolute bottom-0 right-0 h-10 w-10 rounded-full btn-glass-neon flex items-center justify-center"
      >
        <Camera className="h-4 w-4" />
      </button>
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
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="h-12 flex-1 rounded-full font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => salvarPerfil.mutate()}
          disabled={salvarPerfil.isPending || !LDisplayName.trim()}
          className="h-12 flex-1 rounded-full flex items-center justify-center bg-[#8fce9e]/50 dark:bg-background/80 shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#8fce9e]/50 dark:border-[#8fce9e]/30 backdrop-blur-xl saturate-150 text-[#253b2a] dark:text-[#8fce9e] transition-transform active:scale-[0.98] disabled:opacity-50 font-bold"
        >
          {salvarPerfil.isPending ? "Salvando..." : "Salvar"}
        </button>
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
      <div className="flex gap-2 mt-4 w-full px-4">
        <button
          onClick={iniciarEdicao}
          className="h-12 flex-1 rounded-full font-bold btn-glass-neon flex items-center justify-center"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar Perfil
        </button>
        <button
          onClick={() => setIsOptionsOpen(true)}
          className="h-12 w-12 flex-shrink-0 rounded-full btn-glass-neon flex items-center justify-center"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
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
          {AItem.status_it === 'reserved' && (
            <div className="absolute top-2 left-2 z-10 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md shadow-sm border border-amber-400/50">
              RESERVADO
            </div>
          )}
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

      <Drawer open={LIsOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DrawerContent className="px-4 pb-8 pt-2">
          <DrawerHeader className="px-0 mb-2">
            <DrawerTitle className="text-xl font-bold">Opções da Conta</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2">
            <button
              onClick={() => {
                setIsOptionsOpen(false);
                setIsBlockedOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl p-4 text-left font-medium hover:bg-muted active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <Ban className="h-5 w-5 text-muted-foreground" />
                Contas Bloqueadas
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => {
                setIsOptionsOpen(false);
                setIsHistoryOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl p-4 text-left font-medium hover:bg-muted active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                Histórico de Anúncios
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={LIsBlockedOpen} onOpenChange={setIsBlockedOpen}>
        <DrawerContent className="px-4 pb-8 pt-2 max-h-[85vh]">
          <DrawerHeader className="px-0 mb-2">
            <DrawerTitle className="text-xl font-bold">Contas Bloqueadas</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-3 overflow-y-auto">
            {LBlockedUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma conta bloqueada.</p>
            ) : (
              LBlockedUsers.map((bl: any) => (
                <div key={bl.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                      {bl.perfis.avatar_pe ? (
                        <img src={bl.perfis.avatar_pe} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg bg-primary/20">{bl.perfis.nome_pe?.[0] || "?"}</div>
                      )}
                    </div>
                    <span className="font-semibold">{bl.perfis.nome_pe}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-full"
                    onClick={() => desbloquearUsuario.mutate(bl.id)}
                    disabled={desbloquearUsuario.isPending}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Desbloquear
                  </Button>
                </div>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={LIsHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DrawerContent className="px-4 pb-8 pt-2 max-h-[85vh] bg-background">
          <DrawerHeader className="px-0 mb-2">
            <DrawerTitle className="text-xl font-bold">Histórico de Anúncios</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-3 overflow-y-auto pb-6">
            {LIsLoadingHistory ? (
              <p className="text-center text-muted-foreground py-8 animate-pulse">Carregando...</p>
            ) : LHistoryItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Você ainda não finalizou nenhum anúncio.</p>
            ) : (
              <div className="flex flex-row flex-wrap gap-2 w-full">
                {LHistoryItems.map((AItem: any) => (
                  <div key={AItem.id_it} className="relative w-[calc((100%-0.5rem)/2)] opacity-80 grayscale-[30%]">
                    <ItemCard
                      id={AItem.id_it}
                      title={AItem.titulo_it}
                      price={AItem.preco_it}
                      location={AItem.local_it}
                      latitude={AItem.latitu_it}
                      longitude={AItem.longit_it}
                      imageUrl={AItem.imagem_it}
                      images={AItem.fotos_it ?? null}
                      views={AItem.visualizacoes || 0}
                      onClick={() => {}} // Sem clique no histórico
                    />
                    <div className="absolute inset-0 bg-background/20 pointer-events-none rounded-xl" />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md">
                      FINALIZADO
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        excluirItem(AItem.id_it);
                      }}
                      className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-1.5 text-destructive backdrop-blur-sm transition-colors shadow-sm border border-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <BottomNav />
    </div>
  );
};

export default Profile;
