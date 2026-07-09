import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchHeader from "@/components/SearchHeader";
import FiltersSheet, { FilterValues } from "@/components/FiltersSheet";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

interface PnlNavegacaoProps {
  searchQuery: string;
  setSearchQuery: (AQ: string) => void;
  filtersActive: boolean;
  setFilters: (AF: FilterValues) => void;
}

const PnlNavegacao = ({
  searchQuery: ASearchQuery,
  setSearchQuery: ASetSearchQuery,
  filtersActive: AFiltersActive,
  setFilters: ASetFilters,
}: PnlNavegacaoProps) => {
  const { isOpen: isKeyboardOpen } = useKeyboardOpen();

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlBusca = (
    <div className="flex gap-2">
      <div className="flex-1">
        <SearchHeader searchQuery={ASearchQuery} onSearchChange={ASetSearchQuery} />
      </div>
      <FiltersSheet onApply={ASetFilters} active={AFiltersActive} />
    </div>
  );

  const btnAnunciar = (
    <Link to="/post-item" className="w-full">
      <Button className="h-12 w-full rounded-xl text-base font-bold">
        <Plus className="mr-2 h-5 w-5" />
        LARGAR ITEM
      </Button>
    </Link>
  );

  // In flex layout, we don't need fixed positioning or safe-area hacks. 
  // It naturally sits at the bottom of the scroll view or right above the keyboard/BottomNav.
  const containerClass = "w-full shrink-0 bg-background pt-3 pb-1.5 border-t border-border/50 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]";

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className={containerClass}>
      <div className="mx-auto flex max-w-sm flex-col gap-3 px-4">
        {pnlBusca}
        {!isKeyboardOpen && btnAnunciar}
      </div>
    </div>
  );
};

export default PnlNavegacao;
