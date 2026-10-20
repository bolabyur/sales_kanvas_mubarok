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
import { errorMessage } from "@/lib/errors";
import { useDeleteVehicle, useVehicles } from "../hooks/useVehicle";
import type { Vehicle } from "../types/vehicle.types";
import { VehicleForm } from "./vehicle-form";

export function VehiclePage() {
  const { data = [], isLoading, isError } = useVehicles();
  const remove = useDeleteVehicle();
  const canWrite = usePermission()("vehicle:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  const openForm = (row: Vehicle | null) => {
    setEditing(row);
    setFormOpen(true);
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "nopol",
      header: "No. Polisi",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nopol}</span>
      ),
    },
    { accessorKey: "name", header: "Nama" },
    { accessorKey: "type_vehicle", header: "Jenis" },
    { accessorKey: "type_fuel", header: "Bahan Bakar" },
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
          } satisfies ColumnDef<Vehicle>,
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
              placeholder="Cari nopol / nama…"
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

      <VehicleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus kendaraan?"
        description={`${deleting?.nopol} (${deleting?.name}) akan dihapus. Kendaraan yang sudah dipakai plan tidak bisa dihapus.`}
        isPending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success("Kendaraan dihapus");
              setDeleting(null);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </>
  );
}
