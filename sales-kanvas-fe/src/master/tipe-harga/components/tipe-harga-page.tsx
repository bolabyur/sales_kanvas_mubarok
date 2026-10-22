import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { useDeleteTipeHarga, useTipeHarga } from "../hooks/useTipeHarga";
import type { TipeHarga } from "../types/tipe-harga.types";
import { TipeHargaForm } from "./tipe-harga-form";

export function TipeHargaPage() {
  const { data = [], isLoading, isError } = useTipeHarga();
  const remove = useDeleteTipeHarga();
  const canWrite = usePermission()("tipe-harga:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TipeHarga | null>(null);
  const [deleting, setDeleting] = useState<TipeHarga | null>(null);

  const openForm = (row: TipeHarga | null) => {
    setEditing(row);
    setFormOpen(true);
  };

  const columns: ColumnDef<TipeHarga>[] = [
    {
      accessorKey: "nama_tipe",
      header: "Nama Tipe Harga",
      cell: ({ row }) => <span className="font-medium">{row.original.nama_tipe}</span>,
    },
    ...(canWrite
      ? [
          {
            id: "actions",
            cell: ({ row }) => (
              <RowActions
                onEdit={() => openForm(row.original)}
                onDelete={() => setDeleting(row.original)}
              />
            ),
          } satisfies ColumnDef<TipeHarga>,
        ]
      : []),
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
              placeholder="Cari tipe harga…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {canWrite && (
              <Button className="ml-auto" onClick={() => openForm(null)}>
                <Plus /> Tambah
              </Button>
            )}
          </>
        }
      />

      <TipeHargaForm open={formOpen} onOpenChange={setFormOpen} tipeHarga={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus Tipe Harga?"
        description={`"${deleting?.nama_tipe}" akan dihapus.`}
        isPending={remove.isPending}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, {           
          })
        }
      />
    </>
  );
}