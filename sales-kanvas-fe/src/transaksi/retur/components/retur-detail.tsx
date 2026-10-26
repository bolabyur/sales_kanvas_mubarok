import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Retur } from "../types/retur.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; data: Retur | null };

export function ReturDetail({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Rincian Retur Outlet #{data.id}</DialogTitle>
          <DialogDescription>
            Outlet: <strong>{data.outlet?.nama_toko}</strong> | 
            Tanggal: {formatDate(data.updated_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge variant="outline" className="text-sm">
            Gudang: {data.gudangRetur?.nama_gudang}
          </Badge>
          {data.invoiceOutlet && (
            <Badge variant="secondary" className="text-sm">
              Ref Invoice: #{data.invoiceOutlet.id}
            </Badge>
          )}
          <Badge variant="default" className="text-sm bg-primary">
            Total Nilai: {formatRupiah(data.total_nilai_retur)}
          </Badge>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produk</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Alasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.detailInvoiceReturs?.length ? (
                data.detailInvoiceReturs.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.produk?.name}</TableCell>
                    <TableCell>{item.batch?.no_batch}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell><Badge variant="destructive">{item.alasan_retur}</Badge></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Tidak ada rincian barang.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}