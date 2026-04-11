import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import gauchoMascot from "@/assets/gaucho-mascot.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={() => navigate("/")} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Perfil</h1>
      </header>

      <div className="flex flex-col items-center gap-4 p-8">
        <img src={gauchoMascot} alt="Avatar" className="h-20 w-20 rounded-full bg-muted p-2" />
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{profile?.display_name || "Gaúcho"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="mt-8 h-12 w-full max-w-xs rounded-xl text-base"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
