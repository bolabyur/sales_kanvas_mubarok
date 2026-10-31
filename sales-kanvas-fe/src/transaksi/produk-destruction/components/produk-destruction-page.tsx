import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Trash2 } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useProdukDestructions } from "../hooks/useProdukDestruction";
import type { ProdukDestruction } from "../types/produk-destruction.types";
import { ProdukDestructionForm } from "./produk-destruction-form";
import { ProdukDestructionDetail } from "./produk-destruction-detail";

export function ProdukDestructionPage() {
  const { data = [], isLoading, isError } = useProdukDestructions();
  const canWrite = usePermission()("produk-destruction:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailData, setDetailData] = useState<ProdukDestruction | null>(null);

  const columns: ColumnDef<ProdukDestruction>[] = [
    { accessorKey: "id", header: "ID Disposal", cell: ({ row }) => <span className="font-medium text-destructive">DSP-{row.original.id}</span> },
    { accessorKey: "tgl_destruction", header: "Tanggal", cell: ({ row }) => formatDate(row.original.tgl_destruction) },
    { accessorKey: "gudang.nama_gudang", header: "Gudang", cell: ({ row }) => row.original.gudang?.nama_gudang || "-" },
    { 
      accessorKey: "petugas", 
      header: "Petugas", 
      cell: ({ row }) => row.original.petugas || "Admin Gudang" 
    },
    { 
      accessorKey: "alasan", 
      header: "Alasan", 
      cell: ({ row }) => <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{row.original.alasan}</Badge>
    },
    { 
      accessorKey: "details", 
      header: () => <div className="text-right">Total Barang</div>, 
      cell: ({ row }) => {
        const total = row.original.details?.reduce((sum: number, d: any) => sum + d.qty_dimusnahkan, 0) || 0;
        return <div className="text-right font-bold">{total} Pcs</div>;
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
            <SearchInput placeholder="Cari data disposal..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" variant="destructive" onClick={() => setFormOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Buat Disposal
              </Button>
            )}
          </>
        }
      />
      <ProdukDestructionForm open={formOpen} onOpenChange={setFormOpen} />
      <ProdukDestructionDetail open={!!detailData} onOpenChange={(o) => !o && setDetailData(null)} data={detailData} />
    </>
  );
}