import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCrm } from "@/lib/store";
import type { Customer, Lead } from "@/types";

export type SearchRecord = (Customer | Lead) & { type: "Customer" | "Lead" };

interface CustomerLeadSearchProps {
  value?: string | null;
  onChange: (value: string | null, record?: SearchRecord) => void;
  placeholder?: string;
  typeFilter?: "Customer" | "Lead" | "Both";
}

export function CustomerLeadSearch({
  value,
  onChange,
  placeholder = "Search customer or lead...",
  typeFilter = "Both",
}: CustomerLeadSearchProps) {
  const { customers, leads } = useCrm();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allRecords: SearchRecord[] = useMemo(() => {
    const arr: SearchRecord[] = [];
    if (typeFilter === "Customer" || typeFilter === "Both") {
      arr.push(...customers.map((c) => ({ ...c, type: "Customer" as const })));
    }
    if (typeFilter === "Lead" || typeFilter === "Both") {
      arr.push(...leads.map((l) => ({ ...l, type: "Lead" as const })));
    }
    return arr;
  }, [customers, leads, typeFilter]);

  const selectedRecord = useMemo(() => {
    if (!value) return null;
    return allRecords.find((r) => r.id === value) || null;
  }, [value, allRecords]);

  const matches = useMemo(() => {
    if (!query) return [];
    const lower = query.toLowerCase();
    
    // Score based on exact startsWith matching vs includes matching
    const scored = allRecords.map((r) => {
      let score = 0;
      const n = r.name.toLowerCase();
      const c = r.company.toLowerCase();
      const p = r.phone.toLowerCase();
      
      if (n.startsWith(lower)) score = 3;
      else if (n.includes(lower)) score = 2;
      else if (c.startsWith(lower) || c.includes(lower)) score = 1;
      else if (p.includes(lower)) score = 1;
      
      return { record: r, score };
    });
    
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.record)
      .slice(0, 15);
  }, [query, allRecords]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (selectedRecord) {
    return (
      <div className="relative w-full max-w-full min-w-0">
        <div className="flex h-10 w-full items-center justify-between rounded-md border-0 glass-soft px-3 pr-2 shadow-sm text-sm">
          <div className="truncate flex-1 font-medium">
            {selectedRecord.name} <span className="text-muted-foreground font-normal ml-1">· {selectedRecord.company}</span>
          </div>
          <button
            type="button"
            className="shrink-0 p-1 hover:bg-black/5 rounded-full text-muted-foreground"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full min-w-0" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="h-10 w-full glass-soft border-0 pl-9"
        />
      </div>

      {isOpen && matches.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-black/5 bg-white shadow-md">
          <div className="max-h-[240px] overflow-y-auto p-1">
            {matches.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onChange(r.id, r);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left text-sm hover:bg-mint/20 focus:bg-mint/20 focus:outline-none"
              >
                <div className="font-medium truncate w-full text-gray-900">
                  {r.name} <span className="text-gray-500 font-normal">· {r.company}</span>
                </div>
                {typeFilter === "Both" && (
                  <div className="text-[11px] font-medium text-teal-700/70 mt-0.5">
                    {r.type}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
