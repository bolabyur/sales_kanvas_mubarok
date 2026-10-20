import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import {
  useDeleteKasbonMaterialType,
  useKasbonMaterialTypes,
} from "../hooks/useKasbonMaterialType";
import type { KasbonMaterialType } from "../types/kasbonMaterialType.types";
import { KasbonMaterialTypeForm } from "./kasbon-material-type-form";

export function KasbonMaterialTypePage() {
  const { data = [], isLoading, isError } = useKasbonMaterialTypes();
  const remove = useDeleteKasbonMaterialType();
  const canWrite = usePermission()("kasbon-material-type:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KasbonMaterialType | null>(null);
  const [deleting, setDeleting] = useState<KasbonMaterialType | null>(null);

  const openForm = (row: KasbonMaterialType | null) => {
    setEditing(row);
    setFormOpen(true);
  };

  const columns: ColumnDef<KasbonMaterialType>[] = [
    { accessorKey: "name", header: "Nama" },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => formatDate(row.original.created_at),
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
          } satisfies ColumnDef<KasbonMaterialType>,
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
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => openForm(null)}>
                <Plus /> Tambah
              </Button>
            )}
          </>
        }
      />

      <KasbonMaterialTypeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        kasbonMaterialType={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus jenis kasbon material?"
        description={`"${deleting?.name}" akan dihapus. Jenis yang sudah dipakai plan tidak bisa dihapus.`}
        isPending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success("Jenis kasbon dihapus");
              setDeleting(null);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </>
  );
}
