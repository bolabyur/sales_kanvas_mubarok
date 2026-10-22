import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePermission } from "@/auth/hooks/usePermission";
import { useUsers, useDeleteUser } from "../hooks/useUser";
import type { User } from "../types/user.types";
import { UserForm } from "./user-form";

export function UserPage() {
  const { data = [], isLoading, isError } = useUsers();
  const remove = useDeleteUser();
  const canWrite = usePermission()("user:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const openForm = (row: User | null) => {
    setEditing(row);
    setFormOpen(true);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    { accessorKey: "username", header: "Username" },
    { accessorKey: "role.name", header: "Role", cell: ({ row }) => row.original.role?.name || "-" },
    { accessorKey: "is_active", header: "Status", cell: ({ row }) => (row.original.is_active ? "Aktif" : "Nonaktif") },
    ...(canWrite ? [{
      id: "actions",
      cell: ({ row }) => (
        <RowActions onEdit={() => openForm(row.original)} onDelete={() => setDeleting(row.original)} />
      ),
    } satisfies ColumnDef<User>] : []),
  ];

  return (
    <>
      <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} globalFilter={search}
        toolbar={
          <>
            <SearchInput placeholder="Cari nama / username…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && <Button className="ml-auto" onClick={() => openForm(null)}><Plus /> Tambah</Button>}
          </>
        }
      />
      <UserForm open={formOpen} onOpenChange={setFormOpen} user={editing} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Hapus User?" description={`"${deleting?.name}" akan dihapus.`} isPending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id,)} />
    </>
  );
}