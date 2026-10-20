import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "./select-input";

const PAGE_SIZES = [10, 20, 50].map((s) => ({
  value: String(s),
  label: `${s} / hal`,
}));

export function DataTablePagination<T>({ table }: { table: Table<T> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getRowCount();
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>
        {from}–{to} dari {total}
      </span>
      <div className="flex items-center gap-2">
        <SelectInput
          size="sm"
          className="w-24"
          aria-label="Baris per halaman"
          options={PAGE_SIZES}
          value={String(pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        />
        <span>
          Hal. {pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Halaman sebelumnya"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Halaman berikutnya"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
