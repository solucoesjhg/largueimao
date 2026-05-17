import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchHeader from "@/components/SearchHeader";
import FiltersSheet, { FilterValues } from "@/components/FiltersSheet";

interface PnlNavegacaoProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filtersActive: boolean;
  setFilters: (f: FilterValues) => void;
}

const PnlNavegacao = ({
  searchQuery,
  setSearchQuery,
  filtersActive,
  setFilters,
}: PnlNavegacaoProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background pt-2 pb-[calc(60px+env(safe-area-inset-bottom,0px))] shadow-[0_-20px_30px_-15px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex max-w-sm flex-col gap-1.5 px-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>
          <FiltersSheet onApply={setFilters} active={filtersActive} />
        </div>
        <Link to="/post-item" className="w-full">
          <Button className="h-12 w-full rounded-xl text-base font-bold">
            <Plus className="mr-2 h-5 w-5" />
            LARGAR ITEM
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PnlNavegacao;
