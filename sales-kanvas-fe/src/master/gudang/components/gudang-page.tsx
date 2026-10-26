import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { useDeleteGudang, useGudang } from "../hooks/useGudang";
import type { Gudang } from "../types/gudang.types";
import { GudangForm } from "./gudang-form";

type Props = {
  tipeGudang?: string;
  title?: string;
};

export function GudangPage({ tipeGudang, title }: Props) {
  const { data: gudangResponse = [], isLoading, isError } = useGudang(); 
  
  const data = Array.isArray(gudangResponse) ? gudangResponse : ((gudangResponse as any)?.items || []);

  const remove = useDeleteGudang();
  const canWrite = usePermission()("gudang:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Gudang | null>(null);
  const [deleting, setDeleting] = useState<Gudang | null>(null);

  const filteredData = tipeGudang
    ? data.filter((g: any) => 
        g.tipe_gudang === tipeGudang || 
        (tipeGudang === "Retur" && g.tipe_gudang?.toLowerCase().includes("retur"))
      )
    : data;

  const openForm = (row: Gudang | null) => {
    setEditing(row);
    setFormOpen(true);
  };

  const columns: ColumnDef<Gudang>[] = [
    { accessorKey: "nama_gudang", header: "Nama Gudang", cell: ({ row }) => <span className="font-medium">{row.original.nama_gudang}</span> },
    { accessorKey: "tipe_gudang", header: "Tipe Gudang" },
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
          } satisfies ColumnDef<Gudang>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        isError={isError}
        globalFilter={search}
        toolbar={
          <>
            <SearchInput
              placeholder={`Cari ${title || "gudang"}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {canWrite && (
              <Button className="ml-auto" onClick={() => openForm(null)}>
                <Plus /> Tambah {title || "Gudang"}
              </Button>
            )}
          </>
        }
      />

      <GudangForm
        open={formOpen}
        onOpenChange={setFormOpen}
        gudang={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus gudang?"
        description={`"${deleting?.nama_gudang}" akan dihapus.`}
        isPending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          })
        }
      />
    </>
  );
}