import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchHeader from "@/components/SearchHeader";
import FiltersSheet, { FilterValues } from "@/components/FiltersSheet";

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

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background pt-3 pb-[calc(60px+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex max-w-sm flex-col gap-1.5 px-4">
        {pnlBusca}
        {btnAnunciar}
      </div>
    </div>
  );
};

export default PnlNavegacao;
