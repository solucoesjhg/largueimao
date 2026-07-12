import { Home, Plus, Heart, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

export const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageCircle, label: "Chats", path: "/chats" },
  { icon: Heart, label: "Favoritos", path: "/favorites" },
  { icon: User, label: "Perfil", path: "/profile" },
];

interface BottomNavProps {
  className?: string;
  topContent?: React.ReactNode;
}

const BottomNav = ({ className = "w-full shrink-0 z-50", topContent }: BottomNavProps = {}) => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LLocation = useLocation();
  const { data: LHasUnread } = useUnreadChats();
  const { isOpen: isKeyboardOpen } = useKeyboardOpen();

  // The entire bottom navigation bar will be conditionally hidden
  // down below to avoid jumping on top of the keyboard.

    const renderItem = (AItem: typeof NAV_ITEMS[0]) => {
    const LIsActive = LLocation.pathname === AItem.path;
    return (
      <Link
        key={AItem.path}
        to={AItem.path}
        className="group relative flex flex-col items-center gap-1 transition-all select-none [-webkit-touch-callout:none]"
      >
        <div className="relative transition-transform duration-200 group-active:scale-90">
          <AItem.icon
            className={`h-6 w-6 transition-colors ${
              LIsActive ? "text-primary" : "text-primary/40 dark:text-muted-foreground"
            }`}
            strokeWidth={LIsActive ? 2.5 : 2}
          />
          {AItem.path === "/chats" && LHasUnread && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#e6f2e8] dark:ring-background" />
          )}
        </div>
      </Link>
    );
  };

  const pnlItens = (
    <div className="mx-auto flex w-full max-w-sm items-center justify-between px-6 py-2">
      {NAV_ITEMS.slice(0, 2).map(renderItem)}
      
      {/* Botão Central de Postar */}
      <Link
        to="/post-item"
        className="group relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3d5e44] to-[#253b2a] text-white shadow-[0_4px_10px_rgba(37,59,42,0.3)] transition-transform duration-200 active:scale-95 border border-[#1b2b1f] select-none [-webkit-touch-callout:none]"
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
      </Link>

      {NAV_ITEMS.slice(2, 4).map(renderItem)}
    </div>
  );

  return (
    <div className={`${className} bg-background shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] relative`}>
      {topContent}
      {!isKeyboardOpen && (
        <nav className="px-4 pb-3 pt-0 pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-w-sm rounded-full bg-[#8fce9e]/50 dark:bg-background/80 shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#8fce9e]/50 dark:border-[#8fce9e]/30 backdrop-blur-xl saturate-150">
            {pnlItens}
          </div>
        </nav>
      )}
    </div>
  );
};

export default BottomNav;
