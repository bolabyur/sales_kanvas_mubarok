import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { useAdjustStock, useBatch } from "../hooks/useBatch";
import type { Batch } from "../types/batch.types";
import { History, SlidersHorizontal } from "lucide-react";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; batch: Batch | null; };

export function BatchDetailModal({ open, onOpenChange, batch }: Props) {
  const adjust = useAdjustStock();
  const { data: liveBatch } = useBatch(batch?.id || 0);
  const displayBatch = liveBatch || batch;

  const [qtyDelta, setQtyDelta] = useState<string>("");
  const [alasan, setAlasan] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setQtyDelta("");
      setAlasan("");
    }
  }, [open]);

  if (!displayBatch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtyDelta || Number(qtyDelta) === 0) return;
    if (!alasan) return;

    adjust.mutate({
      id: displayBatch.id,
      qty_delta: Number(qtyDelta),
      alasan: alasan,
    }, {
      onSuccess: () => {
        setQtyDelta("");
        setAlasan("");
      }
    });
  };

  // Ambil data mutasi dan total
  const mutasiList = (displayBatch as any).mutasiBatches || [];
  const totalMutasi = (displayBatch as any).totalMutasi || mutasiList.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* PERBAIKAN: max-h-[90vh] dan flex-col agar form & tabel punya area sendiri-sendiri */}
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        
        {/* Header - Fixed */}
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>Detail & Koreksi Stok - {displayBatch.no_batch}</DialogTitle>
            <DialogDescription>
              Produk: <strong>{displayBatch.produk?.name}</strong> | Stok Saat Ini: <strong className="text-primary">{displayBatch.stok_gudang} pcs</strong>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Area Scrollable */}
        <div className="overflow-y-auto px-6 pb-6 space-y-6 flex-1">
          
          {/* FORM KOREKSI STOK */}
          <div className="bg-muted/30 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Form Koreksi Stok
            </h4>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-32">
                <label className="text-xs text-muted-foreground mb-1 block">Qty (+/-)</label>
                <Input 
                  type="number" 
                  placeholder="Misal: -5" 
                  value={qtyDelta} 
                  onChange={(e) => setQtyDelta(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs text-muted-foreground mb-1 block">Alasan Koreksi</label>
                <Input 
                  placeholder="Misal: Barang rusak 5 pcs" 
                  value={alasan} 
                  onChange={(e) => setAlasan(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" disabled={adjust.isPending} className="w-full sm:w-auto">
                {adjust.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </div>

          {/* RIWAYAT MUTASI */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4" /> Riwayat Mutasi Stok
              </h4>
              <span className="text-xs text-muted-foreground">
                Menampilkan <strong>{mutasiList.length}</strong> dari <strong>{totalMutasi}</strong> mutasi
              </span>
            </div>

            {/* PERBAIKAN: Tabel dengan area scroll sendiri dan sticky header */}
            <div className="border rounded-md">
              <div className="max-h-75 overflow-y-auto relative">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-25">Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mutasiList.length ? (
                      mutasiList.map((mut: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="text-muted-foreground text-xs py-3">{formatDate(mut.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={mut.tipe_mutasi.includes("IN") ? "text-green-600 border-green-200" : "text-orange-600 border-orange-200"}>
                              {mut.tipe_mutasi}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${mut.tipe_mutasi.includes("IN") ? "text-green-600" : "text-orange-600"}`}>
                            {mut.tipe_mutasi.includes("IN") ? "+" : "-"}{mut.qty}
                          </TableCell>
                          <TableCell className="text-sm py-3">{mut.keterangan || "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          Belum ada riwayat mutasi.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}