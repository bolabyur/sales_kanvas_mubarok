import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { useDeleteOutlet, useOutlet } from "../hooks/useOutlet";
import type { Outlet } from "../types/outlet.types";
import { OutletForm } from "./outlet-form";

export function OutletPage() {
  const { data = [], isLoading, isError } = useOutlet();
  const remove = useDeleteOutlet();
  const canWrite = usePermission()("outlet:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Outlet | null>(null);
  const [deleting, setDeleting] = useState<Outlet | null>(null);

  const openForm = (row: Outlet | null) => { setEditing(row); setFormOpen(true); };

  const columns: ColumnDef<Outlet>[] = [
    { 
      accessorKey: "nama_toko", 
      header: "Nama Toko", 
      cell: ({ row }) => (
        <span className="font-medium">
          {/* Tambahkan fallback || "-" agar tidak kosong melompong */}
          {row.original.nama_toko || "-"}
        </span>
      ) 
    },
    { 
      accessorKey: "alamat", 
      header: "Alamat",
      cell: ({ row }) => row.original.alamat || "-"
    },
    { 
      accessorKey: "tipeHarga.nama_tipe", 
      header: "Tipe Harga", 
      cell: ({ row }) => row.original.tipeHarga?.nama_tipe || "-" 
    },
    ...(canWrite ? [{ id: "actions", cell: ({ row }) => <RowActions onEdit={() => openForm(row.original)} onDelete={() => setDeleting(row.original)} /> } satisfies ColumnDef<Outlet>] : []),
  ];

  return (
    <>
      <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} globalFilter={search} toolbar={
        <>
          <SearchInput placeholder="Cari nama / alamat…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {canWrite && <Button className="ml-auto" onClick={() => openForm(null)}><Plus /> Tambah</Button>}
        </>
      } />
      <OutletForm open={formOpen} onOpenChange={setFormOpen} outlet={editing} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Hapus Outlet?" description={`"${deleting?.nama_toko}" akan dihapus.`} isPending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { setDeleting(null); } })} />
    </>
  );
}