import { formatDate, formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice } from "../types/invoice.types";
import { usePlan } from "@/plan/hooks/usePlan";
import { Package, MapPin, Truck, Calendar } from "lucide-react";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; data: Invoice | null };

export function InvoiceDetail({ open, onOpenChange, data }: Props) {
  const { data: plan, isLoading: isLoadingPlan } = usePlan(data?.sales_kanvas_plan_id || 0);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Invoice #{data.id}</DialogTitle>
          <DialogDescription>
            Outlet: <strong>{data.outlet?.nama_toko}</strong> | 
            Tgl: {formatDate(data.tgl_invoice)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Badge variant={data.tipe_pembayaran?.toUpperCase() === "TUNAI" ? "default" : "secondary"} className="text-xs">
            {data.tipe_pembayaran}
          </Badge>
          {data.kartuPiutangOutlet && (
            <Badge variant="destructive" className="text-xs">
              Sisa Piutang: {formatRupiah(data.kartuPiutangOutlet.sisa_piutang)}
            </Badge>
          )}
        </div>

        {/* === FITUR TRACEABILITY (SHADCN STYLE) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          {/* Box Rujukan Plan */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium flex items-center gap-2 mb-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Rujukan Plan
            </h4>
            {isLoadingPlan ? (
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            ) : plan ? (
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>No. Plan</span>
                  <span className="font-medium text-foreground">{plan.invoice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Area</span>
                  <span>{plan.marketArea?.name || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Kendaraan</span>
                  <span>{plan.vehicle?.nopol || "-"}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Data Plan tidak ditemukan.</p>
            )}
          </div>

          {/* Box BON */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium flex items-center gap-2 mb-3 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" /> Barang Bawaan (BON)
            </h4>
            {isLoadingPlan ? (
              <p className="text-sm text-muted-foreground">Memuat BON...</p>
            ) : (plan?.kasbonProduks && plan.kasbonProduks.length > 0) ? (
              <div className="space-y-2">
                {plan.kasbonProduks.map((bon: any) => (
                  <div key={bon.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground">BON #{bon.id}</span>
                    <Badge variant="outline" className="text-xs">{bon.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada BON terkait.</p>
            )}
          </div>
        </div>
        {/* ================================================= */}

        <div className="border rounded-lg overflow-hidden mt-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
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
        
        <div className="flex justify-end pt-4 border-t mt-2">
          <div className="text-lg font-bold">
            Total: {formatRupiah(data.total_tagihan)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}