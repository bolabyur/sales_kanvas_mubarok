import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Plus, Ban, Eye, Copy, Search } from "lucide-react"; 
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePermission } from "@/auth/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { usePlans, useUpdatePlanStatus } from "../hooks/usePlan";
import type { Plan } from "../types/plan.types";
import { PlanForm } from "./plan-form";
import { PlanStatusBadge } from "./plan-status-badge";

export function PlanPage() {
  // State untuk Server-Side Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // State untuk Search dengan Debounce (Delay 500ms)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      // Kembali ke halaman 1 setiap kali pencarian berubah
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Panggil Hook dengan parameter (Server-Side)
  const { data: response, isLoading, isError } = usePlans(
    pagination.pageIndex + 1, 
    pagination.pageSize, 
    debouncedSearch
  );
  
  // PERBAIKAN: Ambil items dan total data
  const plans = response?.items || []; 
  const totalData = response?.meta?.total || 0;
  
  const updateStatus = useUpdatePlanStatus();
  const canWrite = usePermission()("plan:create");
  const canCancel = usePermission()("plan:cancel"); 

  const [formOpen, setFormOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Plan | null>(null);
  const [duplicatingPlan, setDuplicatingPlan] = useState<Plan | null>(null); 

  const handleDuplicate = (plan: Plan) => {
    setDuplicatingPlan(plan);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setDuplicatingPlan(null);
  };

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
            nativeButton={false} 
            render={<Link to={`/plan/${row.original.id}`} />}
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => handleDuplicate(row.original)}
              title="Duplikat Plan"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}

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
        
        // PERBAIKAN: Gunakan prop 'server' sesuai dengan tipe data di komponen DataTable Anda
        server={{
          pagination: pagination,
          onPaginationChange: setPagination,
          rowCount: totalData, // Total keseluruhan baris dari database
        }}

        toolbar={
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari invoice / wilayah…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Buat Plan
              </Button>
            )}
          </>
        }
      />
      
      <PlanForm 
        open={formOpen} 
        onOpenChange={handleFormOpenChange} 
        defaultPlan={duplicatingPlan} 
      />
      
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