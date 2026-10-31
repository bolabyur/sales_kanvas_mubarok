import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, FileText, CheckCircle2, Loader2 } from "lucide-react"; // ✅ Tambah Loader2
import { toast } from "sonner"; // ✅ Tambah toast
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { usePermission } from "@/auth/hooks/usePermission";
import { useMe } from "@/auth/hooks/useAuth"; 
import { formatDate, formatRupiah } from "@/lib/format";
import { useReturs, useApproveRetur } from "../hooks/useRetur";
import type { Retur } from "../types/retur.types";
import { ReturForm } from "./retur-form";
import { ReturDetail } from "./retur-detail";

export function ReturPage() {
  const { data = [], isLoading, isError } = useReturs();
  const approve = useApproveRetur();
  const canWrite = usePermission()("retur:create");
  
  const { data: user } = useMe();
  
  const allowedApprovers = ["Super Admin", "Supervisor Pemasaran", "superadmin"];
  const isApprover = allowedApprovers.includes(user?.role?.name || "");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailData, setDetailData] = useState<Retur | null>(null);

  const columns: ColumnDef<Retur>[] = [
    { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
    { accessorKey: "outlet.nama_toko", header: "Outlet", cell: ({ row }) => row.original.outlet?.nama_toko || "-" },
    { accessorKey: "invoice_outlet_id", header: "Ref Invoice", cell: ({ row }) => row.original.invoice_outlet_id ? `INV #${row.original.invoice_outlet_id}` : "-" },
    { accessorKey: "gudangRetur.nama_gudang", header: "Gudang Tujuan", cell: ({ row }) => row.original.gudangRetur?.nama_gudang || "-" },
    { accessorKey: "total_nilai_retur", header: "Total Nilai", cell: ({ row }) => <span className="font-bold">{formatRupiah(row.original.total_nilai_retur)}</span> },
    
    { 
      accessorKey: "status", 
      header: "Status", 
      cell: ({ row }) => {
        const status = row.original.status || "DRAFT";
        return (
          <Badge variant={status === "APPROVED" ? "default" : "secondary"}>
            {status === "APPROVED" ? "Disetujui" : "Draft"}
          </Badge>
        );
      } 
    },
    { accessorKey: "updated_at", header: "Tanggal", cell: ({ row }) => formatDate(row.original.updated_at) },
    
    {
      id: "actions",
      cell: ({ row }) => {
        // ✅ Cek apakah baris ini yang sedang diproses
        const isApprovingThisRow = approve.isPending && approve.variables === row.original.id;

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setDetailData(row.original)}>
              <FileText className="h-4 w-4" />
            </Button>
            
            {row.original.status !== "APPROVED" && isApprover && (
              <Button 
                variant="default" 
                size="sm"
                disabled={approve.isPending} // Kunci semua tombol jika ada proses
                onClick={() => {
                  if (approve.isPending) return;
                  
                  approve.mutate(row.original.id, {
                    onError: (err: any) => {
                      // ✅ Tangkap error backend dan tampilkan sebagai Toast
                      const msg = err.response?.data?.message || err.message;
                      toast.error("Gagal Approve Retur", { description: msg });
                    }
                  });
                }}
              >
                {isApprovingThisRow ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </>
                )}
              </Button>
            )}
          </div>
        );
      },
    },
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
            <SearchInput placeholder="Cari data retur…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus /> Proses Retur Outlet
              </Button>
            )}
          </>
        }
      />
      <ReturForm open={formOpen} onOpenChange={setFormOpen} />
      <ReturDetail open={!!detailData} onOpenChange={(o) => !o && setDetailData(null)} data={detailData} />
    </>
  );
}