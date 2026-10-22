import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermissionList } from "../hooks/usePermission";
import type { Permission } from "../types/permission.types";

export function PermissionPage() {
  const { data = [], isLoading, isError } = usePermissionList();
  const [search, setSearch] = useState("");

  const columns: ColumnDef<Permission>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Nama Permission (Module:Action)", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
  ];

  return (
    <DataTable columns={columns} data={data} isLoading={isLoading} isError={isError} globalFilter={search}
      toolbar={
        <SearchInput placeholder="Cari permission…" value={search} onChange={(e) => setSearch(e.target.value)} />
      }
    />
  );
}