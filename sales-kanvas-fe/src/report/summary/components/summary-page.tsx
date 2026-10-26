import { useState } from "react";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSummarySale, useSummarySaleZona, useSummaryRekonsiliasi } from "../hooks/useSummary";

export function SummaryPage() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const { data: sale, isLoading: loadSale } = useSummarySale(startDate, endDate);
  const { data: zona, isLoading: loadZona } = useSummarySaleZona(startDate, endDate);
  const { data: rekon, isLoading: loadRekon } = useSummaryRekonsiliasi();

  return (
    <div className="space-y-6">
      {/* FILTER TANGGAL & INDIKATOR LOADING */}
      <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border">
        <div className="grid gap-1.5">
          <Label>Dari Tanggal</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Sampai Tanggal</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        
        {/* MENGGUNAKAN VARIABEL LOADING DI SINI */}
        {(loadSale || loadZona || loadRekon) && (
          <div className="ml-auto text-sm text-primary animate-pulse font-medium">
            Memuat data laporan...
          </div>
        )}
      </div>

      {/* KARTU RINGKASAN PENJUALAN */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Invoice</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{sale?.total_invoice || 0} Invoice</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Penjualan Bruto</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatRupiah(sale?.penjualan_bruto || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-destructive">Total Retur</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">-{formatRupiah(sale?.total_retur || 0)}</div></CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Penjualan Neto</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatRupiah(sale?.penjualan_neto || 0)}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* TABEL ZONA */}
        <Card>
          <CardHeader><CardTitle>Penjualan per Zona</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wilayah</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                  <TableHead className="text-right">Total (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zona?.map((z) => (
                  <TableRow key={z.market_area_id}>
                    <TableCell className="font-medium">{z.nama_zona}</TableCell>
                    <TableCell className="text-right">{z.total_invoice}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(z.total_penjualan)}</TableCell>
                  </TableRow>
                ))}
                {!zona?.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* TABEL REKONSILIASI PIUTANG */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Rekonsiliasi Piutang</span>
              <span className="text-sm text-muted-foreground font-normal">
                Total Piutang: <strong className="text-foreground">{formatRupiah(rekon?.ringkasan.total_saldo_piutang || 0)}</strong>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Sisa Piutang</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rekon?.daftar_piutang?.map((p) => (
                  <TableRow key={p.invoice_id}>
                    <TableCell>
                      <div className="font-medium">{p.outlet}</div>
                      <div className="text-xs text-muted-foreground">{p.zona}</div>
                    </TableCell>
                    <TableCell>{p.jatuh_tempo ? formatDate(p.jatuh_tempo) : "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(p.sisa_piutang)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.status === "MENUNGGAK" ? "destructive" : "outline"}>
                        {p.status === "MENUNGGAK" ? "Menunggak" : "Aman"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!rekon?.daftar_piutang?.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Tidak ada piutang aktif</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}