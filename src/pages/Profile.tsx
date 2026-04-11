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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

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

  const startEditing = () => {
    setDisplayName(profile?.display_name || "");
    setBio(profile?.bio || "");
    setEditing(true);
  };

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), bio: bio.trim() })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setEditing(false);
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Foto atualizada!");
    },
    onError: () => toast.error("Erro ao enviar foto"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Perfil</h1>
        </div>
        {!editing && (
          <button onClick={startEditing} className="text-primary">
            <Pencil className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="flex flex-col items-center gap-4 p-8">
        {/* Avatar */}
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-muted">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {editing ? (
          <div className="w-full max-w-xs space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nome</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-xl"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
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
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xs text-center">
            <p className="text-lg font-bold text-foreground">
              {profile?.display_name || "Gaúcho"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile?.bio && (
              <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
            )}
          </div>
        )}

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
