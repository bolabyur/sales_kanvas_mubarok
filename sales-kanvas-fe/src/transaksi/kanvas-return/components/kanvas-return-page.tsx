import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useKanvasReturns } from "../hooks/useKanvasReturn";
import type { KanvasReturn } from "../types/kanvas-return.types";
import { KanvasReturnForm } from "./kanvas-return-form";
import { KanvasReturnDetail } from "./kanvas-return-detail";

export function KanvasReturnPage() {
  const { data = [], isLoading, isError } = useKanvasReturns();
  const canWrite = usePermission()("retur:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailData, setDetailData] = useState<KanvasReturn | null>(null);

  const columns: ColumnDef<KanvasReturn>[] = [
    { accessorKey: "id", header: "ID Retur", cell: ({ row }) => <span className="font-medium text-primary">#{row.original.id}</span> },
    { accessorKey: "salesKanvasPlan.invoice", header: "No. Rencana Kanvas", cell: ({ row }) => row.original.salesKanvasPlan?.invoice || "-" },
    { accessorKey: "tgl_retur", header: "Tanggal Retur", cell: ({ row }) => formatDate(row.original.tgl_retur) },
    { accessorKey: "gudangTujuan.nama_gudang", header: "Gudang Tujuan", cell: ({ row }) => row.original.gudangTujuan?.nama_gudang || "-" },
    { 
      accessorKey: "status", 
      header: "Status", 
      cell: ({ row }) => {
        const status = row.original.status || "DRAFT";
        return <Badge variant="outline" className="uppercase">{status}</Badge>;
      } 
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
            <SearchInput placeholder="Cari data retur..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Input Retur Sales
              </Button>
            )}
          </>
        }
      />
      <KanvasReturnForm open={formOpen} onOpenChange={setFormOpen} />
      <KanvasReturnDetail open={!!detailData} onOpenChange={(o) => !o && setDetailData(null)} data={detailData} />
    </>
  );
}