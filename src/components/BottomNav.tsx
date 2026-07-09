import { Home, PlusCircle, Heart, MessageCircle, User } from "lucide-react";
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
}

const BottomNav = ({ className = "fixed bottom-0 left-0 right-0 z-50" }: BottomNavProps = {}) => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LLocation = useLocation();
  const { data: LHasUnread } = useUnreadChats();
  const { isOpen: isKeyboardOpen } = useKeyboardOpen();

  // If the keyboard is open, hide the entire bottom navigation bar
  // to avoid it jumping on top of the keyboard and covering the screen.
  if (isKeyboardOpen) return null;

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlItens = (
    <div className="mx-auto flex max-w-lg items-center justify-around">
      {/* 4. Parâmetros iterativos e callbacks ganham prefixo "A" */}
      {NAV_ITEMS.map((AItem) => {
        const LIsActive = LLocation.pathname === AItem.path;
        return (
          <Link
            key={AItem.path}
            to={AItem.path}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              LIsActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <AItem.icon className="h-5 w-5" />
              {AItem.path === "/chats" && LHasUnread && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
              )}
            </div>
            <span>{AItem.label}</span>
          </Link>
        );
      })}
    </div>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <nav className={`${className} bg-background pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]`}>
      {pnlItens}
    </nav>
  );
};

export default BottomNav;
