import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
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

const PostItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    condition: "",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Validation flags
  const errors = {
    image: !imageFile,
    title: !form.title.trim(),
    price: !form.price || parseInt(form.price, 10) === 0,
    description: !form.description.trim(),
    category: !form.category,
    location: !form.location.trim(),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitted(true);

    if (hasErrors) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    let imageUrl: string | null = null;

    // Upload image
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(path, imageFile);

      if (uploadError) {
        toast.error("Erro ao subir a foto.");
        setLoading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("item-images")
        .getPublicUrl(path);
      imageUrl = publicData.publicUrl;
    }

    const description = form.condition
      ? `[Estado: ${CONDITIONS.find((c) => c.value === form.condition)?.label}]\n\n${form.description.trim()}`
      : form.description.trim();

    const { error } = await supabase.from("items").insert({
      user_id: user.id,
      title: form.title.trim(),
      description,
      price: parseInt(form.price, 10) / 100,
      category: form.category,
      location: form.location.trim(),
      image_url: imageUrl,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Largar item</h1>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 p-4 pb-8">
        {/* Image */}
        <div>
          <Label>
            Foto <span className="text-destructive">*</span>
          </Label>
          <label
            className={cn(
              "mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-primary",
              showError("image") && errorRing,
            )}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="h-8 w-8" />
                <span className="text-sm">Toca pra tirar foto</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
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

        {/* Condition (optional) */}
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

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">
            Localização <span className="text-destructive">*</span>
          </Label>
          <Input
            id="location"
            placeholder="Ex: Porto Alegre, RS"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className={cn("h-12 rounded-xl bg-muted", showError("location") && errorRing)}
          />
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
