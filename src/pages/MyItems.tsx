import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MyItems = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["my-items", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) {
      toast.error("Erro ao remover item.");
    } else {
      toast.success("Item removido!");
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={() => navigate("/")} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Meus itens</h1>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="text-muted-foreground">Tu ainda não largou nada.</p>
            <Link to="/post-item">
              <Button variant="outline" className="mt-2 rounded-xl">Largar primeiro item</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <ItemCard
                  title={item.title}
                  price={item.price}
                  location={item.location}
                  imageUrl={item.image_url}
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-destructive backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyItems;
