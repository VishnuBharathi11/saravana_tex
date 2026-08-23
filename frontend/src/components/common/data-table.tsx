import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number;
  className?: string;
}

export interface FilterGroup {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  filters?: FilterGroup[];
  toolbar?: ReactNode;
  sortMenuExtra?: ReactNode;
  pageSize?: number;
  emptyMessage?: string;
}

type Sort = { key: string; dir: "asc" | "desc" } | null;

function escapeCsvValue(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  searchPlaceholder = "Search…",
  filters = [],
  toolbar,
  sortMenuExtra,
  pageSize = 8,
  emptyMessage = "Nothing here yet.",
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);

  const visible = columns.filter((c) => !hidden.includes(c.key));

  const cellValue = (row: T, col: Column<T>) =>
    col.value
      ? col.value(row)
      : (((row as Record<string, unknown>)[col.key] as string | number) ?? "");

  const processed = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => String(cellValue(r, c)).toLowerCase().includes(q)),
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = cellValue(a, col);
          const bv = cellValue(b, col);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, sort, columns]);

  const pages = Math.max(1, Math.ceil(processed.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = processed.slice(current * pageSize, current * pageSize + pageSize);

  const exportCsv = () => {
    if (processed.length === 0) {
      toast.info("No records to export");
      return;
    }

    const csv = [
      visible.map((column) => escapeCsvValue(column.header)).join(","),
      ...processed.map((row) =>
        visible.map((column) => escapeCsvValue(cellValue(row, column))).join(","),
      ),
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${processed.length} records to CSV`);
  };

  return (
    <div className="glass rounded-2xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="glass-soft h-9 border-0 pl-9 text-sm"
          />
        </div>

        {filters.map((f) => (
          <DropdownMenu key={f.label}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="glass-soft h-9 gap-1.5 border-0">
                <Filter className="size-3.5" />
                <span className="hidden sm:inline">{f.value === "All" ? f.label : f.value}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-auto">
              <DropdownMenuLabel>{f.label}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={f.value} onValueChange={f.onChange}>
                {["All", ...f.options].map((o) => (
                  <DropdownMenuRadioItem key={o} value={o}>
                    {o}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="glass-soft h-9 gap-1.5 border-0">
              <ArrowUpDown className="size-3.5" />
              <span className="hidden sm:inline">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-auto">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            {columns.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.key}
                checked={sort?.key === c.key}
                onCheckedChange={() =>
                  setSort((s) =>
                    s?.key === c.key
                      ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
                      : { key: c.key, dir: "asc" },
                  )
                }
              >
                {c.header} {sort?.key === c.key ? (sort.dir === "asc" ? "↑" : "↓") : ""}
              </DropdownMenuCheckboxItem>
            ))}
            {sortMenuExtra && (
              <>
                <DropdownMenuSeparator />
                {sortMenuExtra}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="glass-soft h-9 gap-1.5 border-0">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-auto">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.key}
                checked={!hidden.includes(c.key)}
                onCheckedChange={() =>
                  setHidden((h) =>
                    h.includes(c.key) ? h.filter((x) => x !== c.key) : [...h, c.key],
                  )
                }
              >
                {c.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="glass-soft h-9 gap-1.5 border-0"
          onClick={exportCsv}
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>

        {toolbar}
      </div>

      <div className="no-scrollbar mt-3 overflow-x-auto rounded-xl">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {visible.map((c) => (
                <th
                  key={c.key}
                  onClick={() =>
                    setSort((s) =>
                      s?.key === c.key
                        ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
                        : { key: c.key, dir: "asc" },
                    )
                  }
                  className={cn(
                    "cursor-pointer bg-secondary/70 px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-secondary-foreground uppercase backdrop-blur first:rounded-l-xl last:rounded-r-xl",
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "page-enter transition-colors",
                  onRowClick && "cursor-pointer hover:bg-mint/25",
                )}
                style={{ animationDelay: `${i * 25}ms` }}
              >
                {visible.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "border-b border-border/60 px-3 py-3 align-middle whitespace-nowrap",
                      c.className,
                    )}
                  >
                    {c.render ? c.render(row) : String(cellValue(row, c))}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 ? (
              <tr>
                <td
                  colSpan={visible.length}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {processed.length} records · page {current + 1} of {pages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
