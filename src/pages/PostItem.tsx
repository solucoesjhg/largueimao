import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CATEGORIES } from "@/components/CategoryFilter";
import { cn } from "@/lib/utils";

const CONDITIONS = [
  { value: "novo", label: "Novo" },
  { value: "seminovo", label: "Seminovo" },
  { value: "usado", label: "Usado" },
  { value: "muito_usado", label: "Muito usado" },
];

const MAX_IMAGES = 6;

const formatCep = (digits: string) => {
  const d = digits.slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
};

type ImageItem = {
  id: string;
  file: File;
  preview: string;
};

const PostItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    number: "",
    complement: "",
  });

  const formatCurrency = (digits: string) => {
    const cents = parseInt(digits || "0", 10);
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm({ ...form, price: digits });
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_IMAGES} fotos`);
      return;
    }

    const accepted = files.slice(0, remaining);
    if (files.length > accepted.length) {
      toast.message(`Você pode adicionar até ${MAX_IMAGES} fotos`);
    }

    const newItems: ImageItem[] = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newItems]);
    // reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const fetchCep = async (cepDigits: string) => {
    setCepLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado");
        return;
      }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }));
    } catch {
      setCepError("Erro ao buscar CEP. Preencha manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  const geocodeAddress = async (): Promise<{ lat: number; lon: number } | null> => {
    const cep = formatCep(form.cep);
    const queries = [
      [form.street, form.number, form.city, form.state, "Brasil"].filter(Boolean).join(", "),
      [form.neighborhood, form.city, form.state, "Brasil"].filter(Boolean).join(", "),
      [cep, "Brasil"].filter(Boolean).join(", "),
    ].filter((q) => q.trim().length > 0);

    for (const q of queries) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) continue;
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (data?.length) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      } catch {
        // try next
      }
    }
    return null;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    setForm({ ...form, cep: digits });
    setCepError(null);
    if (digits.length === 8) {
      fetchCep(digits);
    }
  };

  // Validation flags
  const errors = {
    image: images.length === 0,
    title: !form.title.trim(),
    price: !form.price || parseInt(form.price, 10) === 0,
    description: !form.description.trim(),
    category: !form.category,
    cep: form.cep.length !== 8,
    number: !form.number.trim(),
    city: !form.city.trim(),
    state: !form.state.trim(),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const buildLocation = () => {
    const street = form.street.trim();
    const number = form.number.trim();
    const complement = form.complement.trim();
    const neighborhood = form.neighborhood.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const cep = formatCep(form.cep);

    const line1 = [street && `${street}${number ? `, ${number}` : ""}`, complement]
      .filter(Boolean)
      .join(" - ");
    const line2 = [neighborhood, [city, state].filter(Boolean).join("/")].filter(Boolean).join(" - ");
    return [line1, line2, `CEP ${cep}`].filter(Boolean).join(" • ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitted(true);

    if (hasErrors) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    // Upload all images sequentially
    const uploadedUrls: string[] = [];
    for (const img of images) {
      const ext = img.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(path, img.file);

      if (uploadError) {
        toast.error("Erro ao subir uma das fotos.");
        setLoading(false);
        return;
      }

      const { data: publicData } = supabase.storage.from("item-images").getPublicUrl(path);
      uploadedUrls.push(publicData.publicUrl);
    }

    const description = form.condition
      ? `[Estado: ${CONDITIONS.find((c) => c.value === form.condition)?.label}]\n\n${form.description.trim()}`
      : form.description.trim();

    const coords = await geocodeAddress();

    const { error } = await supabase.from("items").insert({
      user_id: user.id,
      title: form.title.trim(),
      description,
      price: parseInt(form.price, 10) / 100,
      category: form.category,
      location: buildLocation(),
      image_url: uploadedUrls[0] ?? null,
      images: uploadedUrls,
      latitude: coords?.lat ?? null,
      longitude: coords?.lon ?? null,
    });

    setLoading(false);
    if (error) {
      toast.error("Erro ao publicar. Tenta de novo.");
    } else {
      toast.success("Item largado com sucesso! 🎉");
      navigate("/");
    }
  };

  const showError = (field: keyof typeof errors) => submitted && errors[field];
  const errorRing = "border-destructive ring-2 ring-destructive/30";
  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Largar item</h1>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 p-4 pb-8">
        {/* Images */}
        <div>
          <div className="flex items-baseline justify-between">
            <Label>
              Fotos <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {images.length}/{MAX_IMAGES}
            </span>
          </div>

          {images.length === 0 ? (
            <label
              className={cn(
                "mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-primary",
                showError("image") && errorRing,
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
                onChange={handleAddImages}
              />
            </label>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  <img src={img.preview} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Capa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    aria-label="Remover foto"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-transform active:scale-90"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {canAddMore && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <Plus className="h-6 w-6" />
                  <span className="text-[11px] font-medium">Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                  />
                </label>
              )}
            </div>
          )}

          {!canAddMore && (
            <p className="mt-2 text-xs text-muted-foreground">Limite de {MAX_IMAGES} fotos atingido</p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Título <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Ex: Sofá cinza em bom estado"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={cn("h-12 rounded-xl bg-muted", showError("title") && errorRing)}
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">
            Preço <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={form.price ? formatCurrency(form.price) : ""}
            onChange={handlePriceChange}
            className={cn("h-12 rounded-xl bg-muted", showError("price") && errorRing)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Descrição <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Conta um pouco mais sobre o item..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={cn("min-h-[100px] rounded-xl bg-muted", showError("description") && errorRing)}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>
            Categoria <span className="text-destructive">*</span>
          </Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className={cn("h-12 rounded-xl bg-muted", showError("category") && errorRing)}>
              <SelectValue placeholder="Escolhe uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter((c) => c.value !== "todos").map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label>Estado do item</Label>
          <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
            <SelectTrigger className="h-12 rounded-xl bg-muted">
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address Section */}
        <div className="space-y-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Endereço</h2>

          {/* CEP */}
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
                value={formatCep(form.cep)}
                onChange={handleCepChange}
                className={cn("h-12 rounded-xl bg-muted pr-10", showError("cep") && errorRing)}
              />
              {cepLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {cepError && <p className="text-xs text-destructive">{cepError}</p>}
          </div>

          {/* Street */}
          <div className="space-y-2">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              placeholder="Rua / Avenida"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="h-12 rounded-xl bg-muted"
            />
          </div>

          {/* Number + Complement */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="number">
                Número <span className="text-destructive">*</span>
              </Label>
              <Input
                id="number"
                placeholder="123"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className={cn("h-12 rounded-xl bg-muted", showError("number") && errorRing)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                placeholder="Apto, bloco..."
                value={form.complement}
                onChange={(e) => setForm({ ...form, complement: e.target.value })}
                className="h-12 rounded-xl bg-muted"
              />
            </div>
          </div>

          {/* Neighborhood */}
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              placeholder="Bairro"
              value={form.neighborhood}
              onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              className="h-12 rounded-xl bg-muted"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">
                Cidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                placeholder="Cidade"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={cn("h-12 rounded-xl bg-muted", showError("city") && errorRing)}
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
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                className={cn("h-12 rounded-xl bg-muted uppercase", showError("state") && errorRing)}
              />
            </div>
          </div>
        </div>

        {submitted && hasErrors && (
          <p className="text-sm text-destructive">Preencha todos os campos obrigatórios</p>
        )}

        <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" disabled={loading}>
          {loading ? "PUBLICANDO..." : "LARGAR ITEM"}
        </Button>
      </form>
    </div>
  );
};

export default PostItem;
