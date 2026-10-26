import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatRupiah } from "@/lib/format";

type Props = {
  plan: any;
};

export function PlanTransactions({ plan }: Props) {
  const bons = plan?.kasbonProduks || [];
  const invoices = plan?.invoiceOutlets || [];

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      
      {/* TABEL BON BARANG */}
      <Card>
        <CardHeader className="bg-muted/30 pb-3 border-b">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Barang Dibawa (BON)</span>
            <Badge variant="outline">{bons.length} BON</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID BON</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Belum ada BON yang dibuat.
                  </TableCell>
                </TableRow>
              ) : (
                bons.map((bon: any) => {
                  const totalQty = bon.detailKasbonProduks?.reduce((sum: number, item: any) => sum + item.qty_bawa, 0) || 0;
                  return (
                    <TableRow key={bon.id}>
                      <TableCell className="font-medium">#{bon.id}</TableCell>
                      <TableCell>
                        <Badge variant={bon.status === "APPROVED" || bon.status === "Loaded" ? "default" : "secondary"}>
                          {bon.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{totalQty} Pcs</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* TABEL INVOICE */}
      <Card>
        <CardHeader className="bg-muted/30 pb-3 border-b">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Hasil Penjualan (Invoice)</span>
            <Badge variant="outline">{invoices.length} Invoice</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outlet</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Total Tagihan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Belum ada invoice penjualan.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="font-medium">{inv.outlet?.nama_toko || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">INV #{inv.id} • {formatDate(inv.tgl_invoice)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.tipe_pembayaran?.toUpperCase() === "TUNAI" ? "default" : "outline"}>
                        {inv.tipe_pembayaran}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(inv.total_tagihan)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}