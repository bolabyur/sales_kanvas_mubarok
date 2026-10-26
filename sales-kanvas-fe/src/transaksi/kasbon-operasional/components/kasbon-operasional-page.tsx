import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { formatDate, formatRupiah } from "@/lib/format";
import { useKasbonOperasionals } from "../hooks/useKasbonOperasional";
import type { KasbonOperasional } from "../types/kasbon-operasional.types";
import { KasbonOperasionalDetail } from "./kasbon-operasional-detail";

export function KasbonOperasionalPage() {
  const { data = [], isLoading, isError } = useKasbonOperasionals();
  const [search, setSearch] = useState("");
  const [detailData, setDetailData] = useState<KasbonOperasional | null>(null);

  const columns: ColumnDef<KasbonOperasional>[] = [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
    { accessorKey: "salesKanvasPlan.invoice", header: "Rencana Kanvas", cell: ({ row }) => row.original.salesKanvasPlan?.invoice || "-" },
    { accessorKey: "nominal_kasbon", header: "Total Kasbon", cell: ({ row }) => <span className="font-medium">{formatRupiah(row.original.nominal_kasbon)}</span> },
    { accessorKey: "updated_at", header: "Tanggal", cell: ({ row }) => formatDate(row.original.updated_at) },
    { 
      accessorKey: "status", 
      header: "Status", 
      cell: ({ row }) => {
        const status = row.original.status?.toUpperCase() || "PENDING";
        let variant: "default" | "secondary" | "destructive" = "secondary";
        if (status === "APPROVED") variant = "default";
        if (status === "REJECTED") variant = "destructive";
        return <Badge variant={variant}>{status}</Badge>;
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
          <SearchInput placeholder="Cari data kasbon…" value={search} onChange={(e) => setSearch(e.target.value)} />
        }
      />
      <KasbonOperasionalDetail open={!!detailData} onOpenChange={(o) => !o && setDetailData(null)} data={detailData} />
    </>
  );
}