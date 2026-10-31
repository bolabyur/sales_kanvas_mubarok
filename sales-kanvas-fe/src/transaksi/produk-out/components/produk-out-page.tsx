import { useState } from "react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useProdukOut, useCancelProdukOut } from "../hooks/useProdukOut";
import { XCircle, Plus } from "lucide-react";
import { ProdukOutForm } from "./produk-out-form";

export function ProdukOutPage() {
  const { data: produkOuts = [], isLoading } = useProdukOut();
  const cancelOut = useCancelProdukOut();
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) return <div className="p-6">Memuat data Onloading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onloading (Pengeluaran Barang)</h1>
          <p className="text-muted-foreground">Daftar barang yang sudah keluar dari Gudang menuju Sales.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Proses Onloading
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>No. Onloading</TableHead>
              <TableHead>No. BON</TableHead>
              <TableHead>Nama Sales</TableHead>
              <TableHead className="text-right">Jenis Produk</TableHead>
              <TableHead className="text-right">Total Qty</TableHead>
              <TableHead>Tanggal Keluar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produkOuts.map((po: any) => {
              const salesPersonil = po.kasbonProduk?.salesKanvasPlan?.salesKanvasPersonil?.find(
                (p: any) => String(p.position).toLowerCase() === "sales"
              );
              const namaSales = salesPersonil?.employee?.name || "-";
              
              const jenisProduk = po.detailProdukOuts?.length || 0;
              const totalQty = po.detailProdukOuts?.reduce((sum: number, item: any) => sum + item.qty, 0) || 0;

              return (
                <TableRow key={po.id}>
                  <TableCell className="font-medium text-primary">ONL-{po.id}</TableCell>
                  <TableCell>{po.kasbonProduk?.salesKanvasPlan?.invoice || `BON #${po.kasbon_produk_id}`}</TableCell>
                  <TableCell>{namaSales}</TableCell>
                  <TableCell className="text-right">{jenisProduk} Item</TableCell>
                  <TableCell className="text-right font-bold">{totalQty} Pcs</TableCell>
                  <TableCell>{formatDate(po.tgl_keluar)}</TableCell>
                  <TableCell>
                    <Badge variant={po.is_deleted ? "destructive" : "outline"} className={!po.is_deleted ? "border-green-500 text-green-600 bg-green-50" : ""}>
                      {po.is_deleted ? "Dibatalkan" : "Selesai"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!po.is_deleted && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setSelectedId(po.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {produkOuts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  Belum ada data Onloading. Klik "Proses Onloading" untuk memulai.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProdukOutForm open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title="Batalkan Onloading?"
        description="Stok barang akan dikembalikan ke Gudang, dan status BON akan kembali menjadi DRAFT. Lanjutkan?"
        confirmLabel="Ya, Batalkan"
        destructive={true}
        isPending={cancelOut.isPending}
        onConfirm={() => {
          if (selectedId) {
            cancelOut.mutate(selectedId, {
              onSuccess: () => setSelectedId(null)
            });
          }
        }}
      />
    </div>
  );
}