import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useProdukIns } from "../hooks/useProdukIn";
import type { ProdukIn } from "../types/produk-in.types";
import { ProdukInForm } from "./produk-in-form";
import { ProdukInDetail } from "./produk-in-detail";
import type { ColumnDef } from "@tanstack/react-table";

export function ProdukInPage() {
  const { data = [], isLoading, isError } = useProdukIns();
  const canWrite = usePermission()("produk-in:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailData, setDetailData] = useState<ProdukIn | null>(null);

  const columns: ColumnDef<ProdukIn>[] = [
    { accessorKey: "id", header: "ID In", cell: ({ row }) => <span className="font-medium text-primary">IN-{row.original.id}</span> },
    { accessorKey: "salesKanvasPlan.invoice", header: "No. Rencana Kanvas", cell: ({ row }) => row.original.salesKanvasPlan?.invoice || "-" },
    { accessorKey: "tgl_masuk", header: "Tanggal Masuk", cell: ({ row }) => formatDate(row.original.tgl_masuk) },
    { 
      accessorKey: "source_type", 
      header: "Tipe Sumber", 
      cell: ({ row }) => {
        const source = row.original.source_type || "UNKNOWN";
        return <Badge variant="outline">{source.replace(/_/g, " ")}</Badge>;
      } 
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setDetailData(row.original)}>
          <FileText className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        globalFilter={search}
        toolbar={
          <>
            <SearchInput placeholder="Cari data unloading..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Proses Unloading
              </Button>
            )}
          </>
        }
      />
      <ProdukInForm open={formOpen} onOpenChange={setFormOpen} />
      <ProdukInDetail open={!!detailData} onOpenChange={(o) => !o && setDetailData(null)} data={detailData} />
    </>
  );
}