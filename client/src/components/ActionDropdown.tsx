import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

import type { Diagnosis, Procedure } from "shared/index.js";

interface ActionDropdownProps {
  type: "Diagnosis" | "Procedure";
  items: (Diagnosis | Procedure)[];
  onSelect: (item: string) => void;
  disabled?: boolean;
}

export function ActionDropdown({ type, items, onSelect, disabled }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredItems = items.filter(item => {
    const name = typeof item === 'object' && 'name' in item ? item.name : String(item);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        setSearch("");
        setVisibleCount(10);
      }, 200);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-50 justify-between"
          disabled={disabled}
        >
          {type}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-75 p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`Search ${type.toLowerCase()}...`} 
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              setVisibleCount(10);
            }}
          />
          <CommandList
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                if (hasMore) {
                  setVisibleCount(prev => prev + 10);
                }
              }
            }}
          >
            <CommandEmpty>No {type.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {visibleItems.map((item, idx) => {
                const name = typeof item === 'object' && 'name' in item ? item.name : String(item);
                return (
                  <CommandItem
                    key={idx}
                    value={name}
                    onSelect={() => {
                      onSelect(name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className="mr-2 h-4 w-4 opacity-0"
                    />
                    {name}
                  </CommandItem>
                );
              })}
              {hasMore && (
                <div 
                  className="py-2 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => setVisibleCount(prev => prev + 10)}
                >
                  Show more...
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
