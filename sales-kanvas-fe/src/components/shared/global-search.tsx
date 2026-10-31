import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { api } from "@/lib/api";
import { FileText, Receipt, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();

  // Shortcut Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => api<any>(`/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <>
      {/* Tombol Pemicu di Header */}
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 sm:pr-12 bg-muted/50 hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Cari dokumen...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>

      {/* Dialog Pencarian */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-xl overflow-hidden shadow-lg">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Cari Plan, Invoice, atau BON..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-75 min-h-30">
              {/* Loading State */}
              {isLoading && debouncedQuery.length >= 2 && (
                <div className="p-6 text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Mencari...
                </div>
              )}

              {/* Empty State (Kurang dari 2 karakter) */}
              {!isLoading && debouncedQuery.length < 2 && (
                <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                  <Search className="h-8 w-8 text-muted-foreground/30" />
                  <p>Ketik minimal 2 karakter untuk mencari.</p>
                </div>
              )}

              {/* Empty State (Tidak ada hasil) */}
              {!isLoading && debouncedQuery.length >= 2 && data?.plans?.length === 0 && data?.invoices?.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada hasil ditemukan untuk "{debouncedQuery}"
                </div>
              )}

              {/* Hasil Pencarian */}
              {!isLoading && debouncedQuery.length >= 2 && (
                <>
                  {data?.plans?.length > 0 && (
                    <CommandGroup heading="Rencana Kanvas">
                      {data.plans.map((plan: any) => (
                        <CommandItem 
                          key={`plan-${plan.id}`} 
                          onSelect={() => handleSelect(`/plan/${plan.id}`)}
                          className="cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4 text-primary" />
                          <span>{plan.invoice}</span>
                          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {plan.status}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {data?.invoices?.length > 0 && (
                    <CommandGroup heading="Invoice">
                      {data.invoices.map((inv: any) => (
                        <CommandItem 
                          key={`inv-${inv.id}`} 
                          onSelect={() => handleSelect(`/transaksi/invoice`)}
                          className="cursor-pointer"
                        >
                          <Receipt className="mr-2 h-4 w-4 text-orange-500" />
                          <span>INV #{inv.id} — {inv.outlet?.nama_toko}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}