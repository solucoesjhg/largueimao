import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, X, Camera, ArrowLeft } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CATEGORIES } from "@/components/FiltersSheet";
import { cn } from "@/lib/utils";

const CONDITIONS = [
  { value: "novo", label: "Novo" },
  { value: "seminovo", label: "Seminovo" },
  { value: "usado", label: "Usado" },
  { value: "muito_usado", label: "Muito usado" },
];

const MAX_IMAGES = 6;

const formatarCep = (ADigits: string) => {
  const LD = ADigits.slice(0, 8);
  if (LD.length > 5) return `${LD.slice(0, 5)}-${LD.slice(5)}`;
  return LD;
};

type ImageItem = {
  id: string;
  file: File;
  preview: string;
};

const PostItem = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const { user: LUser } = useAuth();
  const [LLoading, setLoading] = useState(false);
  const [LStatusText, setStatusText] = useState("PUBLICANDO...");
  const [LImages, setImages] = useState<ImageItem[]>([]);
  const [LSubmitted, setSubmitted] = useState(false);
  const [LCepLoading, setCepLoading] = useState(false);
  const [LCepError, setCepError] = useState<string | null>(null);
  
  const [LForm, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    cep: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const formatarMoeda = (ADigits: string) => {
    const LCents = parseInt(ADigits || "0", 10);
    return (LCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const mudarPreco = (AEvent: React.ChangeEvent<HTMLInputElement>) => {
    const LDigits = AEvent.target.value.replace(/\D/g, "").slice(0, 8);
    setForm({ ...LForm, price: LDigits });
  };

  // 2. Extração de lógica de eventos e operações usando verbos
  const adicionarFotos = (AEvent: React.ChangeEvent<HTMLInputElement>) => {
    const LFiles = Array.from(AEvent.target.files ?? []);
    if (!LFiles.length) return;

    const LRemaining = MAX_IMAGES - LImages.length;
    if (LRemaining <= 0) {
      toast.error(`Máximo de ${MAX_IMAGES} fotos`);
      return;
    }

    const LAccepted = LFiles.slice(0, LRemaining);
    if (LFiles.length > LAccepted.length) {
      toast.message(`Você pode adicionar até ${MAX_IMAGES} fotos`);
    }

    const LNewItems: ImageItem[] = LAccepted.map((AFile) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: AFile,
      preview: URL.createObjectURL(AFile),
    }));

    setImages((APrev) => [...APrev, ...LNewItems]);
    AEvent.target.value = "";
  };

  const removerFoto = (AId: string) => {
    setImages((APrev) => {
      const LTarget = APrev.find((AI) => AI.id === AId);
      if (LTarget) URL.revokeObjectURL(LTarget.preview);
      return APrev.filter((AI) => AI.id !== AId);
    });
  };

  const pesquisarCep = async (ACepDigits: string) => {
    setCepLoading(true);
    setCepError(null);
    try {
      const LRes = await fetch(`https://viacep.com.br/ws/${ACepDigits}/json/`);
      const LData = await LRes.json();
      if (LData.erro) {
        setCepError("CEP não encontrado");
        return;
      }
      setForm((APrev) => ({
        ...APrev,
        neighborhood: LData.bairro || "",
        city: LData.localidade || "",
        state: LData.uf || "",
      }));
    } catch {
      setCepError("Erro ao buscar CEP. Preencha manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  const geocodificarEndereco = async (): Promise<{ lat: number; lon: number } | null> => {
    const LCep = formatarCep(LForm.cep);
    const LQueries = [
      [LForm.neighborhood, LForm.city, LForm.state, "Brasil"].filter(Boolean).join(", "),
      [LForm.city, LForm.state, "Brasil"].filter(Boolean).join(", "),
      [LCep, "Brasil"].filter(Boolean).join(", "),
    ].filter((AQ) => AQ.trim().length > 0);

    for (const LQ of LQueries) {
      try {
        const LRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(LQ)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!LRes.ok) continue;
        const LData = (await LRes.json()) as Array<{ lat: string; lon: string }>;
        if (LData?.length) {
          return { lat: parseFloat(LData[0].lat), lon: parseFloat(LData[0].lon) };
        }
      } catch {
        // try next
      }
    }
    return null;
  };

  const mudarCep = (AEvent: React.ChangeEvent<HTMLInputElement>) => {
    const LDigits = AEvent.target.value.replace(/\D/g, "").slice(0, 8);
    setForm({ ...LForm, cep: LDigits });
    setCepError(null);
    if (LDigits.length === 8) {
      pesquisarCep(LDigits);
    }
  };

  const LErrors = {
    image: LImages.length === 0,
    title: !LForm.title.trim(),
    price: !LForm.price || parseInt(LForm.price, 10) === 0,
    description: !LForm.description.trim(),
    category: !LForm.category,
    cep: LForm.cep.length !== 8,
    city: !LForm.city.trim(),
    state: !LForm.state.trim(),
  };
  const LHasErrors = Object.values(LErrors).some(Boolean);

  const construirLocalizacao = () => {
    const LNeighborhood = LForm.neighborhood.trim();
    const LCity = LForm.city.trim();
    const LState = LForm.state.trim();
    const LCep = formatarCep(LForm.cep);

    const LMainLocation = [LNeighborhood, [LCity, LState].filter(Boolean).join(" - ")].filter(Boolean).join(", ");
    return [LMainLocation, `CEP ${LCep}`].filter(Boolean).join(" • ");
  };

  const incluirItem = async (AEvent: React.FormEvent) => {
    AEvent.preventDefault();
    if (!LUser) return;

    setSubmitted(true);

    if (LHasErrors) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setStatusText("COMPRIMINDO FOTOS...");

    const LUploadedUrls: string[] = [];
    // 4. Iteração usando "A" para parâmetro de for/map
    for (const AImg of LImages) {
      try {
        const LCompressedBlob = await imageCompression(AImg.file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        });

        setStatusText("ENVIANDO FOTOS...");

        const LExt = AImg.file.name.split(".").pop() || "jpg";
        const LPath = `${LUser.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${LExt}`;
        const { error: LUploadError } = await supabase.storage
          .from("item-images")
          .upload(LPath, LCompressedBlob);

        if (LUploadError) {
          console.error("Erro no upload da imagem:", LUploadError);
          toast.error(`Erro na foto: ${LUploadError.message}`);
          setLoading(false);
          return;
        }

        const { data: LPublicData } = supabase.storage.from("item-images").getPublicUrl(LPath);
        LUploadedUrls.push(LPublicData.publicUrl);
      } catch (AError) {
        console.error("Erro na compressão:", AError);
        toast.error("Erro ao comprimir uma das fotos");
        setLoading(false);
        return;
      }
    }

    setStatusText("SALVANDO DADOS...");

    const LDescription = LForm.condition
      ? `[Estado: ${CONDITIONS.find((AC) => AC.value === LForm.condition)?.label}]\n\n${LForm.description.trim()}`
      : LForm.description.trim();

    const LCoords = await geocodificarEndereco();

    const { error: LError } = await supabase.from("itens").insert({
      usuari_it: LUser.id,
      titulo_it: LForm.title.trim(),
      descri_it: LDescription,
      preco_it: parseInt(LForm.price, 10) / 100,
      catego_it: LForm.category,
      local_it: construirLocalizacao(),
      imagem_it: LUploadedUrls[0] ?? null,
      fotos_it: LUploadedUrls,
      latitu_it: LCoords?.lat ?? null,
      longit_it: LCoords?.lon ?? null,
    });

    setLoading(false);
    if (LError) {
      console.error("Erro ao inserir no banco:", LError);
      toast.error(`Erro ao salvar: ${LError.message}`);
    } else {
      toast.success("Item largado com sucesso! 🎉");
      LNavigate("/");
    }
  };

  const exibirErro = (AField: keyof typeof LErrors) => LSubmitted && LErrors[AField];
  const LErrorRing = "border-destructive ring-2 ring-destructive/30";
  const LCanAddMore = LImages.length < MAX_IMAGES;

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlTopo = (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
      <button onClick={() => LNavigate(-1)} className="text-foreground">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-bold text-foreground">Largar item</h1>
    </header>
  );

  const pnlFormulario = (
    <form onSubmit={incluirItem} noValidate className="space-y-5 p-4 pb-8">
      <div>
        <div className="flex items-baseline justify-between">
          <Label>
            Fotos <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {LImages.length}/{MAX_IMAGES}
          </span>
        </div>

        {LImages.length === 0 ? (
          <label
            className={cn(
              "mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-primary",
              exibirErro("image") && LErrorRing,
            )}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="h-8 w-8" />
              <span className="text-sm">Toca pra adicionar fotos</span>
              <span className="text-xs">Até {MAX_IMAGES} imagens</span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={adicionarFotos}
            />
          </label>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {LImages.map((AImg, AIdx) => (
              <div
                key={AImg.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                <img src={AImg.preview} alt={`Foto ${AIdx + 1}`} className="h-full w-full object-cover" />
                {AIdx === 0 && (
                  <span className="absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Capa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removerFoto(AImg.id)}
                  aria-label="Remover foto"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-transform active:scale-90"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {LCanAddMore && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Plus className="h-6 w-6" />
                <span className="text-[11px] font-medium">Adicionar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={adicionarFotos}
                />
              </label>
            )}
          </div>
        )}

        {!LCanAddMore && (
          <p className="mt-2 text-xs text-muted-foreground">Limite de {MAX_IMAGES} fotos atingido</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ex: Sofá cinza em bom estado"
          value={LForm.title}
          onChange={(AEvent) => setForm({ ...LForm, title: AEvent.target.value })}
          className={cn("h-12 rounded-xl bg-muted", exibirErro("title") && LErrorRing)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">
          Preço <span className="text-destructive">*</span>
        </Label>
        <Input
          id="price"
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={LForm.price ? formatarMoeda(LForm.price) : ""}
          onChange={mudarPreco}
          className={cn("h-12 rounded-xl bg-muted", exibirErro("price") && LErrorRing)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Descrição <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Conta um pouco mais sobre o item..."
          value={LForm.description}
          onChange={(AEvent) => setForm({ ...LForm, description: AEvent.target.value })}
          className={cn("min-h-[100px] rounded-xl bg-muted", exibirErro("description") && LErrorRing)}
        />
      </div>

      <div className="space-y-2">
        <Label>
          Categoria <span className="text-destructive">*</span>
        </Label>
        <Select value={LForm.category} onValueChange={(AV) => setForm({ ...LForm, category: AV })}>
          <SelectTrigger className={cn("h-12 rounded-xl bg-muted", exibirErro("category") && LErrorRing)}>
            <SelectValue placeholder="Escolhe uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter((AC) => AC.value !== "todos").map((ACat) => (
              <SelectItem key={ACat.value} value={ACat.value}>
                {ACat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Estado do item</Label>
        <Select value={LForm.condition} onValueChange={(AV) => setForm({ ...LForm, condition: AV })}>
          <SelectTrigger className="h-12 rounded-xl bg-muted">
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((AC) => (
              <SelectItem key={AC.value} value={AC.value}>
                {AC.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Endereço</h2>
        <div className="space-y-2">
          <Label htmlFor="cep">
            CEP <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="cep"
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={formatarCep(LForm.cep)}
              onChange={mudarCep}
              className={cn("h-12 rounded-xl bg-muted pr-10", exibirErro("cep") && LErrorRing)}
            />
            {LCepLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {LCepError && <p className="text-xs text-destructive">{LCepError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            placeholder="Bairro"
            value={LForm.neighborhood}
            onChange={(AEvent) => setForm({ ...LForm, neighborhood: AEvent.target.value })}
            className="h-12 rounded-xl bg-muted"
          />
        </div>

        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div className="space-y-2">
            <Label htmlFor="city">
              Cidade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              placeholder="Cidade"
              value={LForm.city}
              onChange={(AEvent) => setForm({ ...LForm, city: AEvent.target.value })}
              className={cn("h-12 rounded-xl bg-muted", exibirErro("city") && LErrorRing)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">
              UF <span className="text-destructive">*</span>
            </Label>
            <Input
              id="state"
              placeholder="UF"
              maxLength={2}
              value={LForm.state}
              onChange={(AEvent) => setForm({ ...LForm, state: AEvent.target.value.toUpperCase() })}
              className={cn("h-12 rounded-xl bg-muted uppercase", exibirErro("state") && LErrorRing)}
            />
          </div>
        </div>
      </div>

      {LSubmitted && LHasErrors && (
        <p className="text-sm text-destructive">Preencha todos os campos obrigatórios</p>
      )}

      <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" disabled={LLoading}>
        {LLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {LStatusText}
          </div>
        ) : (
          "LARGAR ITEM"
        )}
      </Button>
    </form>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="min-h-screen bg-background">
      {pnlTopo}
      {pnlFormulario}
    </div>
  );
};

export default PostItem;
