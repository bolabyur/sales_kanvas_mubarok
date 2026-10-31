import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, CheckCircle2, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePermission } from "@/auth/hooks/usePermission";
import { useKasbonProduks, useUpdateKasbonStatus } from "../hooks/useKasbonProduk";
import { KasbonProdukForm } from "./kasbon-produk-form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

export function KasbonProdukPage() {
  const { data = [], isLoading, isError } = useKasbonProduks();
  const updateStatus = useUpdateKasbonStatus();
  
  const canCreate = usePermission()("kasbon-produk:create");
  const canApprove = usePermission()("kasbon-produk:update"); 

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ id: number; status: string } | null>(null);
  
  const [detailBon, setDetailBon] = useState<any | null>(null);

  const columns: ColumnDef<any>[] = [
    { 
      accessorKey: "id", 
      header: "ID BON",
      cell: ({ row }) => (
        <Button 
          variant="link" 
          className="p-0 h-auto font-medium text-primary"
          onClick={() => setDetailBon(row.original)}
        >
          #{row.original.id}
        </Button>
      )
    },
    { 
      accessorKey: "salesKanvasPlan.invoice", 
      header: "No. Rencana Kanvas",
      cell: ({ row }) => row.original.salesKanvasPlan?.invoice || "-"
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const rawStatus = row.original.status?.toUpperCase() || "DRAFT";
        let label = "Draft";
        let variant: "default" | "secondary" | "outline" | "destructive" = "secondary";
        
        if (rawStatus === "DRAFT") { label = "Draft"; variant = "secondary"; }
        else if (rawStatus === "APPROVED") { label = "Disetujui"; variant = "default"; }
        else if (rawStatus === "BATAL") { label = "Ditolak"; variant = "destructive"; }
        else if (rawStatus === "ONLOADING") { label = "Onloading"; variant = "outline"; }

        return <Badge variant={variant}>{label}</Badge>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const currentStatus = row.original.status?.toUpperCase();
        const isDraft = currentStatus === "DRAFT" || currentStatus === "PENDING";

        return (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setDetailBon(row.original)}
              title="Lihat Rincian Barang"
            >
              <FileText className="h-4 w-4" />
            </Button>

            {canApprove && isDraft && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => setConfirmData({ id: row.original.id, status: "APPROVED" })}
                  title="Setujui Pengajuan (ACC)"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmData({ id: row.original.id, status: "BATAL" })}
                  title="Tolak Pengajuan"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {currentStatus === "APPROVED" && <span className="text-xs text-muted-foreground font-medium px-2">Terkunci</span>}
            {currentStatus === "ONLOADING" && <span className="text-xs text-primary font-medium px-2">Barang Keluar</span>}
            {currentStatus === "BATAL" && <span className="text-xs text-destructive font-medium px-2">Ditolak</span>}
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
            <SearchInput
              placeholder="Cari no invoice / ID BON…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {canCreate && (
              <Button className="ml-auto" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Buat Pengajuan BON
              </Button>
            )}
          </>
        }
      />
      
      <KasbonProdukForm open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={!!confirmData}
        onOpenChange={(o) => !o && setConfirmData(null)}
        title={confirmData?.status === "APPROVED" ? "Setujui BON Barang?" : "Tolak BON Barang?"}
        description={`BON ini akan diubah statusnya menjadi ${confirmData?.status}.`}
        confirmLabel={confirmData?.status === "APPROVED" ? "Ya, Setujui" : "Ya, Tolak"}
        destructive={confirmData?.status === "BATAL"}
        isPending={updateStatus.isPending}
        onConfirm={() => {
          if (confirmData) {
            updateStatus.mutate(confirmData, {
              onSuccess: () => {
                toast.success(`BON berhasil di ${confirmData?.status === "APPROVED" ? "Setujui" : "Tolak"}`);
                setConfirmData(null);
              },
            });
          }
        }}
      />

      {/* MODAL RINCIAN BARANG BON */}
      <Dialog open={!!detailBon} onOpenChange={(o) => !o && setDetailBon(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle>Rincian Pengajuan BON #{detailBon?.id}</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">
                Daftar barang yang diminta untuk Rencana Kanvas <strong>{detailBon?.salesKanvasPlan?.invoice}</strong>.
              </span>
              <span className="block">
                Diajukan oleh: <strong className="text-primary">
                  {detailBon?.salesKanvasPlan?.salesKanvasPersonil?.find(
                    (p: any) => String(p.position).toLowerCase() === "sales"
                  )?.employee?.name 
                   || detailBon?.salesKanvasPlan?.salesKanvasPersonil?.[0]?.employee?.name 
                   || "-"}
                </strong>
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-md mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Produk</TableHead>
                  <TableHead>No. Batch</TableHead>
                  <TableHead className="text-right">Qty Diminta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailBon?.detailKasbonProduks?.length ? (
                  detailBon.detailKasbonProduks.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.produk?.name}</TableCell>
                      <TableCell>{item.batch?.no_batch || "-"}</TableCell>
                      <TableCell className="text-right">{item.qty_bawa} pcs</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Tidak ada rincian barang.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="bg-muted/30 p-4 rounded-md mt-2 flex justify-between items-center border">
            <span className="font-medium text-sm">Total Item Diminta:</span>
            <span className="text-lg font-bold text-primary">
              {detailBon?.detailKasbonProduks?.reduce((sum: number, item: any) => sum + item.qty_bawa, 0) || 0} pcs
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}