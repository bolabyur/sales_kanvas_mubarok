import { useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Ban, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { usePlans, useUpdatePlanStatus } from "../hooks/usePlan";
import type { Plan } from "../types/plan.types";
import { PlanForm } from "./plan-form";
import { PlanStatusBadge } from "./plan-status-badge";

export function PlanPage() {
  const { data: response, isLoading, isError } = usePlans();
  const plans = response?.items || []; 
  
  const updateStatus = useUpdatePlanStatus();
  const canWrite = usePermission()("plan:create");
  const canCancel = usePermission()("plan:cancel"); 

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Plan | null>(null);

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: "invoice",
      header: "No. Invoice",
      cell: ({ row }) => (
        <Link to={`/plan/${row.original.id}`} className="font-medium hover:underline text-primary">
          {row.original.invoice}
        </Link>
      ),
    },
    {
      accessorKey: "tgl_pergi_kanvas",
      header: "Tgl Berangkat",
      cell: ({ row }) => formatDate(row.original.tgl_pergi_kanvas),
    },
    {
      accessorKey: "marketArea.name",
      header: "Wilayah",
      cell: ({ row }) => row.original.marketArea?.name || "-",
    },
    {
      accessorKey: "vehicle.nopol",
      header: "Kendaraan",
      cell: ({ row }) => row.original.vehicle?.nopol || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <PlanStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            render={<Link to={`/plan/${row.original.id}`} />}
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {canCancel && row.original.status?.toUpperCase() !== "BATAL" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setCancelling(row.original)}
              title="Batalkan Plan"
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={plans}
        isLoading={isLoading}
        isError={isError}
        globalFilter={search}
        toolbar={
          <>
            <SearchInput
              placeholder="Cari invoice / wilayah…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Buat Plan
              </Button>
            )}
          </>
        }
      />
      
      <PlanForm open={formOpen} onOpenChange={setFormOpen} />
      
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Batalkan Rencana Kanvas?"
        description={`Plan "${cancelling?.invoice}" akan diubah statusnya menjadi BATAL.`}
        confirmLabel="Ya, Batalkan"
        destructive={true}
        isPending={updateStatus.isPending}
        onConfirm={() =>
          cancelling &&
          updateStatus.mutate(
            { id: cancelling.id, status: "BATAL" },
            {
              onSuccess: () => {
                toast.success("Rencana Kanvas dibatalkan");
                setCancelling(null);
              },
            },
          )
        }
      />
    </>
  );
}