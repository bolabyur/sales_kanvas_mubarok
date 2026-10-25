import { formatDate } from "@/lib/format";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import type { ProdukOut } from "../types/produk-out.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProdukOut | null;
};

export function ProdukOutDetail({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Rincian Loading #{data.id}</DialogTitle>
          <DialogDescription>
            Referensi BON: <strong>{data.kasbonProduk?.salesKanvasPlan?.invoice || `BON #${data.kasbon_produk_id}`}</strong> | 
            Sumber: <strong>{data.tipe_sumber}</strong> | 
            Tanggal: {formatDate(data.tgl_keluar)}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produk</TableHead>
                <TableHead>No. Batch</TableHead>
                <TableHead className="text-right">Qty Dimuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.detailProdukOuts?.length ? (
                data.detailProdukOuts.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.produk?.name}</TableCell>
                    <TableCell>{item.batch?.no_batch}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
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
      </DialogContent>
    </Dialog>
  );
}