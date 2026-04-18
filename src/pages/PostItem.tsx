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

const PostItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "outros",
    location: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Dá um nome pro teu item!");
      return;
    }

    setLoading(true);
    let imageUrl: string | null = null;

    // Upload image if present
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

    const { error } = await supabase.from("items").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: form.price ? parseInt(form.price, 10) / 100 : 0,
      category: form.category,
      location: form.location.trim() || null,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Largar item</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 p-4 pb-8">
        {/* Image */}
        <div>
          <Label>Foto</Label>
          <label className="mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-primary">
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
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            placeholder="Ex: Sofá cinza em bom estado"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-12 rounded-xl bg-muted"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Conta um pouco mais sobre o item..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-[100px] rounded-xl bg-muted"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Preço</Label>
          <Input
            id="price"
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={form.price ? formatCurrency(form.price) : ""}
            onChange={handlePriceChange}
            className="h-12 rounded-xl bg-muted"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="h-12 rounded-xl bg-muted">
              <SelectValue />
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

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            placeholder="Ex: Porto Alegre, RS"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="h-12 rounded-xl bg-muted"
          />
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl text-base font-bold" disabled={loading}>
          {loading ? "PUBLICANDO..." : "LARGAR ITEM"}
        </Button>
      </form>
    </div>
  );
};

export default PostItem;
