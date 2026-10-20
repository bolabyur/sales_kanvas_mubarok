import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { useEmployees } from "../hooks/useEmployee";
import type { Employee } from "../types/employee.types";
import { EmployeeForm } from "./employee-form";

export function EmployeePage() {
  const { data = [], isLoading, isError } = useEmployees();
  const canWrite = usePermission()("employee:write");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const openForm = (row: Employee | null) => {
    setEditing(row);
    setFormOpen(true);
  };

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "nip",
      header: "NIP",
      cell: ({ row }) => row.original.nip ?? "-",
    },
    {
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "gender",
      header: "L/P",
      cell: ({ row }) => (row.original.gender === "MALE" ? "L" : "P"),
    },
    {
      accessorKey: "contact",
      header: "Kontak",
      cell: ({ row }) => row.original.contact ?? "-",
    },
    {
      accessorKey: "tgl_masuk",
      header: "Tgl. Masuk",
      cell: ({ row }) => formatDate(row.original.tgl_masuk),
    },
    ...(canWrite
      ? [
          {
            id: "actions",
            cell: ({ row }) => (
              <RowActions onEdit={() => openForm(row.original)} />
            ),
          } satisfies ColumnDef<Employee>,
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
              placeholder="Cari nama / NIP / kontak…"
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

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
      />
    </>
  );
}
