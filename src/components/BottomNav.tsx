import { Home, PlusCircle, Heart, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUnreadChats } from "@/hooks/useUnreadChats";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: PlusCircle, label: "Anunciar", path: "/post-item" },
  { icon: MessageCircle, label: "Chats", path: "/chats" },
  { icon: Heart, label: "Favoritos", path: "/favorites" },
  { icon: User, label: "Perfil", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const { data: hasUnread } = useUnreadChats();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pt-1 pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.path === "/chats" && hasUnread && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div >
    </nav >
  );
};

export default BottomNav;
