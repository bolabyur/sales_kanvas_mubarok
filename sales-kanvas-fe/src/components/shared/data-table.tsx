import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";

type Props<T> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  globalFilter?: string;
  toolbar?: ReactNode;
  server?: {
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    rowCount: number;
  };
};

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  globalFilter,
  toolbar,
  server,
}: Props<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(server
      ? {
          manualPagination: true,
          rowCount: server.rowCount,
          onPaginationChange: server.onPaginationChange,
          state: { pagination: server.pagination },
        }
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          state: { globalFilter },
        }),
  });

  const rows = table.getRowModel().rows;
  const message = isLoading
    ? "Memuat…"
    : isError
      ? "Gagal memuat data."
      : rows.length === 0
        ? "Tidak ada data."
        : null;

  return (
    <div className="grid gap-4">
      {toolbar && (
        <div className="flex flex-wrap items-end gap-2">{toolbar}</div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {message ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {message}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
