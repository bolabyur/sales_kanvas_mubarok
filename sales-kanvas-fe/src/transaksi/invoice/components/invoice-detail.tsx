import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice } from "../types/invoice.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; data: Invoice | null };

export function InvoiceDetail({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detail Invoice #{data.id}</DialogTitle>
          <DialogDescription>
            Outlet: <strong>{data.outlet?.nama_toko}</strong> | 
            Plan: <strong>{data.salesKanvasPlan?.invoice}</strong> | 
            Tanggal: {formatDate(data.tgl_invoice)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge variant={data.tipe_pembayaran.toUpperCase() === "TUNAI" ? "default" : "outline"} className="text-sm">
            {data.tipe_pembayaran}
          </Badge>
          {data.kartuPiutangOutlet && (
            <Badge variant="destructive" className="text-sm">
              Sisa Piutang: {formatRupiah(data.kartuPiutangOutlet.sisa_piutang)}
            </Badge>
          )}
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produk</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.detailInvoiceOutlets?.map((item: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.produk?.name}</TableCell>
                  <TableCell>{item.batch?.no_batch}</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right">{formatRupiah(item.harga_satuan)}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-end pt-4 border-t mt-4">
          <div className="text-xl font-bold">
            Total: {formatRupiah(data.total_tagihan)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}