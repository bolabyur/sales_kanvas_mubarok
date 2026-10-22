import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useDeleteBatch, useBatch } from "../hooks/useBatch";
import type { Batch } from "../types/batch.types";
import { BatchForm } from "./batch-form";

export function BatchPage() {
  const { data = [], isLoading, isError } = useBatch();
  const remove = useDeleteBatch();
  const canWrite = usePermission()("batch:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState<Batch | null>(null);

  const openForm = (row: Batch | null) => { setEditing(row); setFormOpen(true); };

  const columns: ColumnDef<Batch>[] = [
    { accessorKey: "no_batch", header: "No Batch", cell: ({ row }) => <span className="font-medium">{row.original.no_batch}</span> },
    { accessorKey: "produk.name", header: "Produk", cell: ({ row }) => row.original.produk?.name || "-" },
    { accessorKey: "expired_date", header: "Expired", cell: ({ row }) => formatDate(row.original.expired_date) },
    { accessorKey: "stok_gudang", header: "Stok" },
    ...(canWrite ? [{ id: "actions", cell: ({ row }) => <RowActions onEdit={() => openForm(row.original)} onDelete={() => setDeleting(row.original)} /> } satisfies ColumnDef<Batch>] : []),
  ];

  return (
    <>
      <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} globalFilter={search} toolbar={
        <>
          <SearchInput placeholder="Cari no batch / produk…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {canWrite && <Button className="ml-auto" onClick={() => openForm(null)}><Plus /> Tambah</Button>}
        </>
      } />
      <BatchForm open={formOpen} onOpenChange={setFormOpen} batch={editing} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Hapus Batch?" description={`"${deleting?.no_batch}" akan dihapus.`} isPending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => {setDeleting(null); },  })} />
    </>
  );
}