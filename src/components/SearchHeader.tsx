import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const SearchHeader = ({ searchQuery, onSearchChange }: SearchHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background px-4 pb-3 pt-4">
      <h1 className="mb-3 text-center font-display text-lg font-bold text-primary">
        LARGUEI MÃO
      </h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="O que tu tá procurando?"
          className="h-10 rounded-xl bg-muted pl-10"
        />
      </div>
    </header>
  );
};

export default SearchHeader;
