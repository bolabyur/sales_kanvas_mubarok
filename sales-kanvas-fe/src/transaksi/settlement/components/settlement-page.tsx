import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatRupiah } from "@/lib/format";
import { useSettlements } from "../hooks/useSettlement";
import type { Settlement } from "../types/settlement.types";
import { SettlementForm } from "./settlement-form";

export function SettlementPage() {
  const { data = [], isLoading, isError } = useSettlements();
  const canWrite = usePermission()("settlement:create");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const columns: ColumnDef<Settlement>[] = [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
    { accessorKey: "salesKanvasPlan.invoice", header: "Rencana Kanvas", cell: ({ row }) => row.original.salesKanvasPlan?.invoice || "-" },
    { accessorKey: "total_penjualan_tunai", header: "Penjualan Tunai", cell: ({ row }) => formatRupiah(row.original.total_penjualan_tunai) },
    { accessorKey: "selisih_kas", header: "Selisih Kas", cell: ({ row }) => {
        const selisih = Number(row.original.selisih_kas);
        return <span className={selisih < 0 ? "text-destructive font-bold" : "text-green-600 font-bold"}>{formatRupiah(selisih)}</span>
      } 
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="default">{row.original.status}</Badge> },
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
            <SearchInput placeholder="Cari data settlement…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus /> Buat Settlement
              </Button>
            )}
          </>
        }
      />
      <SettlementForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}