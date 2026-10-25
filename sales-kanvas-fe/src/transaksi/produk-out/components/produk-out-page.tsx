import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useProdukOuts } from "../hooks/useProdukOut";
import type { ProdukOut } from "../types/produk-out.types";
import { ProdukOutForm } from "./produk-out-form";
import { ProdukOutDetail } from "./produk-out-detail"; // <-- Import komponen baru

export function ProdukOutPage() {
  const { data = [], isLoading, isError } = useProdukOuts();
  const canWrite = usePermission()("produk-out:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailData, setDetailData] = useState<ProdukOut | null>(null);

  const columns: ColumnDef<ProdukOut>[] = [
    {
      accessorKey: "id",
      header: "ID Out",
      cell: ({ row }) => (
        <span className="font-medium">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "kasbonProduk.invoice",
      header: "BON Referensi",
      cell: ({ row }) => (
        <div className="flex flex-col">
          {/* Fallback ke strip (-) jika invoice tidak ada */}
          <span className="font-medium">
            {row.original.kasbonProduk?.salesKanvasPlan?.invoice || "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            BON #{row.original.kasbon_produk_id}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "tipe_sumber",
      header: "Tipe Sumber",
      cell: ({ row }) => {
        // Cek jika tipe_sumber kosong (data lama)
        const source = row.original.tipe_sumber;
        return source ? (
          <Badge variant="outline">{source}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "tgl_keluar",
      header: "Tanggal Keluar",
      cell: ({ row }) => formatDate(row.original.tgl_keluar),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => setDetailData(row.original)}
          title="Lihat Rincian"
        >
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
            <SearchInput
              placeholder="Cari data loading…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus /> Proses Loading
              </Button>
            )}
          </>
        }
      />

      <ProdukOutForm open={formOpen} onOpenChange={setFormOpen} />

      {/* Panggil komponen detail di sini */}
      <ProdukOutDetail
        open={!!detailData}
        onOpenChange={(o) => !o && setDetailData(null)}
        data={detailData}
      />
    </>
  );
}
