import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useProdukDestructions } from "../hooks/useProdukDestruction";
import type { ProdukDestruction } from "../types/produk-destruction.types";
import { ProdukDestructionForm } from "./produk-destruction-form";

export function ProdukDestructionPage() {
  const { data = [], isLoading, isError } = useProdukDestructions();
  const canWrite = usePermission()("retur:create"); 

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const columns: ColumnDef<ProdukDestruction>[] = [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
    { accessorKey: "tgl_destruction", header: "Tanggal", cell: ({ row }) => formatDate(row.original.tgl_destruction) },
    { accessorKey: "gudang.nama_gudang", header: "Gudang", cell: ({ row }) => row.original.gudang?.nama_gudang || "-" },
    { accessorKey: "alasan", header: "Alasan" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant="destructive">{row.original.status}</Badge> },
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
            <SearchInput placeholder="Cari data pemusnahan…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button variant="destructive" className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus /> Catat Disposal
              </Button>
            )}
          </>
        }
      />
      <ProdukDestructionForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}