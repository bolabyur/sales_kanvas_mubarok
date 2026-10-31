import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Retur } from "../types/retur.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; data: Retur | null };

export function ReturDetail({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  // Hitung total qty untuk pembagian proporsional (jika ada multi-item)
  const totalQty = data.detailInvoiceReturs?.reduce((sum: number, item: any) => sum + item.qty, 0) || 1;
  const hargaPerItem = Number(data.total_nilai_retur) / totalQty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Rincian Retur Outlet #{data.id}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1">
            <span>Outlet: <strong>{data.outlet?.nama_toko}</strong></span>
            <span>|</span>
            <span>Tanggal: {formatDate(data.updated_at)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-2">
          <Badge variant="outline" className="text-sm">
            Gudang: {data.gudangRetur?.nama_gudang || "-"}
          </Badge>
          <Badge variant={data.status === "APPROVED" ? "default" : "secondary"} className="text-sm">
            Status: {data.status || "DRAFT"}
          </Badge>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Produk</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Harga Satuan</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead>Alasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.detailInvoiceReturs?.map((item: any, idx: number) => {
                const subtotal = item.qty * hargaPerItem;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.produk?.name}</TableCell>
                    <TableCell>{item.batch?.no_batch || "-"}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatRupiah(hargaPerItem)}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(subtotal)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                        {item.alasan_retur}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Ringkasan Total */}
        <div className="flex justify-end pt-4 border-t mt-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Total Nilai Retur</p>
            <p className="text-2xl font-bold text-primary">
              {formatRupiah(data.total_nilai_retur)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}