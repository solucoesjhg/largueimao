import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (AValue: string) => void;
}

const SearchHeader = ({
  searchQuery: ASearchQuery,
  onSearchChange: AOnSearchChange,
}: SearchHeaderProps) => {
  
  // 5. O return da tela fica extremamente simples e sem lógica
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={ASearchQuery}
        onChange={(AEvent) => AOnSearchChange(AEvent.target.value)}
        onKeyDown={(AEvent) => {
          if (AEvent.key === "Enter") {
            AEvent.currentTarget.blur();
          }
        }}
        placeholder="O que tu tá procurando?"
        className="h-10 rounded-full bg-muted pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/50"
      />
    </div>
  );
};

export default SearchHeader;
