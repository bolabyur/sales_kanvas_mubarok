import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { KanvasReturn } from "../types/kanvas-return.types";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; data: KanvasReturn | null };

export function KanvasReturnDetail({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Rincian Retur Kanvas #{data.id}</DialogTitle>
          <DialogDescription>
            Plan: <strong>{data.salesKanvasPlan?.invoice}</strong> | 
            Gudang Tujuan: <strong>{data.gudangTujuan?.nama_gudang}</strong> | 
            Tanggal: {formatDate(data.tgl_retur)}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produk</TableHead>
                <TableHead>No. Batch</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-center">Kondisi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.details?.length ? (
                data.details.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.produk?.name}</TableCell>
                    <TableCell>{item.batch?.no_batch}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          item.kondisi === "BAGUS" ? "default" : 
                          item.kondisi === "RUSAK" ? "destructive" : "secondary"
                        }
                      >
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