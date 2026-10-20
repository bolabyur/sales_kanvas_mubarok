import type { SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type {
  ColumnDef,
  PaginationState,
  Updater,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { FormField } from "@/components/shared/form-field";
import { SearchInput } from "@/components/shared/search-input";
import { SelectInput } from "@/components/shared/select-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { useMarketAreas } from "@/master/market-area/hooks/useMarketArea";
import { formatDate } from "@/lib/format";
import { usePlans } from "../hooks/usePlan";
import {
  PLAN_STATUSES,
  type Plan,
  type PlanListQuery,
} from "../types/plan.types";
import { PlanStatusBadge, STATUS_LABEL } from "./plan-status-badge";

const ALL = { value: "", label: "Semua" };

const columns: ColumnDef<Plan>[] = [
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => (
      <Link
        to={`/plan/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.invoice}
      </Link>
    ),
  },
  {
    header: "Tgl. Invoice",
    cell: ({ row }) => formatDate(row.original.tgl_invoice),
  },
  {
    header: "Tgl. Pergi",
    cell: ({ row }) => formatDate(row.original.tgl_pergi_kanvas),
  },
  { header: "Market Area", cell: ({ row }) => row.original.marketArea.name },
  { header: "Kendaraan", cell: ({ row }) => row.original.vehicle.nopol },
  {
    header: "Status",
    cell: ({ row }) => <PlanStatusBadge status={row.original.status} />,
  },
  {
    header: "Rev.",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.revision}</span>
    ),
  },
];

export function PlanListPage() {
  const [sp, setSp] = useSearchParams();
  const canWrite = usePermission()("plan:write");
  const { data: marketAreas = [] } = useMarketAreas();

  const query: PlanListQuery = {
    page: Number(sp.get("page") ?? 1),
    limit: Number(sp.get("limit") ?? 10),
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    market_area_id: sp.get("market_area_id")
      ? Number(sp.get("market_area_id"))
      : undefined,
    tanggalPergiKanvasStart: sp.get("start") ?? undefined,
    tanggalPergiKanvasEnd: sp.get("end") ?? undefined,
  };
  const { data, isLoading, isError } = usePlans(query);

  const update = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    setSp(next);
  };

  const pagination: PaginationState = {
    pageIndex: query.page - 1,
    pageSize: query.limit,
  };
  const onPaginationChange = (u: Updater<PaginationState>) => {
    const next = typeof u === "function" ? u(pagination) : u;
    update({ page: next.pageIndex + 1, limit: next.pageSize });
  };

  function onFilter(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    update({
      search: get("search"),
      status: get("status"),
      market_area_id: get("market_area_id"),
      start: get("start"),
      end: get("end"),
      page: undefined,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      isLoading={isLoading}
      isError={isError}
      server={{
        pagination,
        onPaginationChange,
        rowCount: data?.meta.total ?? 0,
      }}
      toolbar={
        <form
          key={sp.toString()}
          onSubmit={onFilter}
          className="flex w-full flex-wrap items-end gap-2"
        >
          <FormField label="Invoice" htmlFor="search">
            <SearchInput
              id="search"
              name="search"
              placeholder="SKS-…"
              defaultValue={query.search}
            />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <SelectInput
              id="status"
              name="status"
              className="w-36"
              placeholder="Semua"
              options={[
                ALL,
                ...PLAN_STATUSES.map((s) => ({
                  value: s,
                  label: STATUS_LABEL[s],
                })),
              ]}
              defaultValue={query.status}
            />
          </FormField>
          <FormField label="Market Area" htmlFor="market_area_id">
            <SelectInput
              id="market_area_id"
              name="market_area_id"
              className="w-44"
              placeholder="Semua"
              options={[
                ALL,
                ...marketAreas.map((m) => ({
                  value: String(m.id),
                  label: m.name,
                })),
              ]}
              defaultValue={query.market_area_id?.toString()}
            />
          </FormField>
          <FormField label="Pergi dari" htmlFor="start">
            <Input
              id="start"
              name="start"
              type="date"
              defaultValue={query.tanggalPergiKanvasStart}
            />
          </FormField>
          <FormField label="s/d" htmlFor="end">
            <Input
              id="end"
              name="end"
              type="date"
              defaultValue={query.tanggalPergiKanvasEnd}
            />
          </FormField>
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
          <Button type="button" variant="ghost" onClick={() => setSp({})}>
            Reset
          </Button>
          {canWrite && (
            <Button
              className="ml-auto"
              nativeButton={false}
              render={<Link to="/plan/new" />}
            >
              <Plus /> Buat Plan
            </Button>
          )}
        </form>
      }
    />
  );
}
