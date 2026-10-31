import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProdukIn } from "../types/produk-in.types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; data: ProdukIn | null };

export function ProdukInDetail({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Rincian Unloading #{data.id}</DialogTitle>
          <DialogDescription>
            Dari Plan <strong>{data.salesKanvasPlan?.invoice}</strong> | 
            Sumber: <strong>{data.source_type}</strong> | {/* <-- PERBAIKAN */}
            Tanggal: {formatDate(data.tgl_masuk)}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produk</TableHead>
                <TableHead>No. Batch</TableHead>
                <TableHead className="text-right">Qty Sisa</TableHead>
                <TableHead className="text-center">Kondisi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.detailProdukIns?.length ? (
                data.detailProdukIns.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.produk?.name}</TableCell>
                    <TableCell>{item.batch?.no_batch}</TableCell>
                    <TableCell className="text-right">{item.qty_sisa}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.kondisi === "Bagus" ? "default" : "destructive"}>
                        {item.kondisi}
                      </Badge>
                    </TableCell>
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