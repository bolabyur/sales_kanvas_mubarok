import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProdukDestruction } from "../types/produk-destruction.types";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; data: ProdukDestruction | null };

export function ProdukDestructionDetail({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  const totalQty = data.details?.reduce((sum: number, d: any) => sum + d.qty_dimusnahkan, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-destructive">Berita Acara Pemusnahan Barang (DSP-{data.id})</DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1">
            <span>Tanggal: <strong>{formatDate(data.tgl_destruction)}</strong></span>
            <span>|</span>
            <span>Gudang: <strong>{data.gudang?.nama_gudang}</strong></span>
            <span>|</span>
            <span>Petugas: <strong>{data.petugas || "Admin"}</strong></span>
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2">
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 uppercase">
            Alasan: {data.alasan}
          </Badge>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produk</TableHead>
                <TableHead>No. Batch</TableHead>
                <TableHead>Expired</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.details?.length ? (
                data.details.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.produk?.name}</TableCell>
                    <TableCell>{item.batch?.no_batch}</TableCell>
                    <TableCell className="text-destructive">{formatDate(item.batch?.expired_date)}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{item.qty_dimusnahkan} Pcs</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Tidak ada rincian.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end pt-4 border-t mt-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Total Dimusnahkan</p>
            <p className="text-2xl font-bold text-destructive">{totalQty} Pcs</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}